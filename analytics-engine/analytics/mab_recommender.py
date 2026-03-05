"""
Clario Analytics Engine — Multi-Armed Bandit (MAB) Recommendation Engine
Replaces rule-based recommendations with an adaptive strategy that learns
which type of recommendation yields the highest mastery improvement.

Uses Thompson Sampling on a per-student-archetype basis:
    - Each "arm" is a recommendation type (Learn, Practice, Quiz, Revision)
    - The "reward" is the improvement in BKT mastery after following the recommendation
    - Uses Beta distribution conjugate priors for binary reward signals
"""

import random
import numpy as np
from .config import config
from .db import db


# ─── Arms (Recommendation Types) ──────────────────────────────────────────────
ARMS = ["Learn", "Practice", "Quiz", "Revision"]

# ─── Prior hyperparameters per arm per archetype ───────────────────────────────
# alpha = successes + 1, beta = failures + 1 (Beta distribution)
# These are sensible starting priors based on educational research
DEFAULT_PRIORS = {
    "mastery":     {"Learn": (2, 8), "Practice": (5, 5), "Quiz": (7, 3), "Revision": (8, 2)},
    "careful":     {"Learn": (3, 7), "Practice": (6, 4), "Quiz": (5, 5), "Revision": (7, 3)},
    "developing":  {"Learn": (5, 5), "Practice": (6, 4), "Quiz": (5, 5), "Revision": (4, 6)},
    "guessing":    {"Learn": (8, 2), "Practice": (5, 5), "Quiz": (3, 7), "Revision": (3, 7)},
    "struggling":  {"Learn": (9, 1), "Practice": (6, 4), "Quiz": (2, 8), "Revision": (3, 7)},
    "weak":        {"Learn": (8, 2), "Practice": (5, 5), "Quiz": (3, 7), "Revision": (3, 7)},
}


class MABRecommender:
    """
    Multi-Armed Bandit recommendation engine using Thompson Sampling.
    """

    def __init__(self):
        # In-memory arm stats cache: {archetype: {arm: (alpha, beta)}}
        self.arm_stats = {}

    def recommend(self, user_id, weak_topics, archetype="developing", n=5):
        """
        Generate personalized recommendations using Thompson Sampling.

        Args:
            user_id: student UUID
            weak_topics: list of dicts with subject, topic, mastery_probability
            archetype: the student's behavioral archetype (from clustering)
            n: number of recommendations to generate

        Returns:
            list of recommendation dicts
        """
        if not weak_topics:
            return []

        # Load or initialize arm stats for this archetype
        stats = self._get_arm_stats(archetype)

        recommendations = []
        used_topics = set()

        for _ in range(n):
            # Thompson Sampling: sample from Beta distribution for each arm
            samples = {}
            for arm in ARMS:
                alpha, beta_param = stats.get(arm, (1, 1))
                samples[arm] = np.random.beta(alpha, beta_param)

            # Select the arm with the highest sampled value
            best_arm = max(samples, key=samples.get)

            # Pick a weak topic not yet used
            topic = None
            for t in weak_topics:
                key = f"{t['subject']}/{t['topic']}"
                if key not in used_topics:
                    topic = t
                    used_topics.add(key)
                    break

            if not topic:
                # All topics used — cycle back
                topic = random.choice(weak_topics)

            # Determine priority based on mastery
            mastery = topic.get("mastery_probability", 0.5)
            if mastery < 0.3:
                priority = 1  # highest
            elif mastery < 0.5:
                priority = 2
            else:
                priority = 3

            rec = {
                "user_id": user_id,
                "recommendation_type": best_arm.lower(),
                "subject": topic.get("subject"),
                "topic": topic.get("topic"),
                "subtopic": topic.get("subtopic"),
                "concept_tag": topic.get("concept_tag"),
                "title": f"{best_arm}: {topic.get('topic', 'Unknown')}",
                "description": _build_description(best_arm, topic, archetype),
                "priority": priority,
            }
            recommendations.append(rec)

        # Write recommendations to DB
        self._store_recommendations(recommendations)

        return recommendations

    def record_reward(self, archetype, arm, reward):
        """
        Update arm statistics after observing a reward.

        Args:
            archetype: student archetype label
            arm: the recommendation type that was followed
            reward: 1 if mastery improved, 0 if not
        """
        stats = self._get_arm_stats(archetype)
        alpha, beta_param = stats.get(arm, (1, 1))

        if reward:
            alpha += 1
        else:
            beta_param += 1

        stats[arm] = (alpha, beta_param)
        self.arm_stats[archetype] = stats

        # Persist to DB for durability
        self._persist_arm_stats(archetype, arm, alpha, beta_param)

    def _get_arm_stats(self, archetype):
        """Get or initialize arm stats for an archetype."""
        if archetype in self.arm_stats:
            return self.arm_stats[archetype]

        # Try loading from DB first
        stats = self._load_arm_stats(archetype)
        if stats:
            self.arm_stats[archetype] = stats
            return stats

        # Use default priors
        priors = DEFAULT_PRIORS.get(archetype, DEFAULT_PRIORS["developing"])
        stats = {arm: priors[arm] for arm in ARMS}
        self.arm_stats[archetype] = stats
        return stats

    def _store_recommendations(self, recommendations):
        """Write recommendations to the learning_recommendations table."""
        query = """
            INSERT INTO learning_recommendations
                (user_id, recommendation_type, subject, topic, subtopic,
                 concept_tag, title, description, priority)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        try:
            with db.telemetry_conn() as conn:
                with conn.cursor() as cur:
                    for rec in recommendations:
                        cur.execute(query, (
                            str(rec["user_id"]),
                            rec["recommendation_type"],
                            rec["subject"],
                            rec["topic"],
                            rec.get("subtopic"),
                            rec.get("concept_tag"),
                            rec["title"],
                            rec["description"],
                            rec["priority"],
                        ))
        except Exception as e:
            print(f"[MAB] Failed to store recommendations: {e}")

    def _load_arm_stats(self, archetype):
        """Load persisted arm statistics from DB."""
        query = """
            SELECT arm, alpha, beta_param
            FROM mab_arm_stats
            WHERE archetype = %s
        """
        try:
            with db.telemetry_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (archetype,))
                    rows = cur.fetchall()
                    if rows:
                        return {row[0]: (int(row[1]), int(row[2])) for row in rows}
        except Exception:
            pass  # Table might not exist yet
        return None

    def _persist_arm_stats(self, archetype, arm, alpha, beta_param):
        """Persist updated arm stats to DB."""
        query = """
            INSERT INTO mab_arm_stats (archetype, arm, alpha, beta_param)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (archetype, arm)
            DO UPDATE SET alpha = EXCLUDED.alpha, beta_param = EXCLUDED.beta_param,
                          updated_at = NOW()
        """
        try:
            with db.telemetry_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (archetype, arm, alpha, beta_param))
        except Exception as e:
            print(f"[MAB] Failed to persist stats: {e}")


def _build_description(arm, topic, archetype):
    """Build a human-readable description for a recommendation."""
    topic_name = topic.get("topic", "this topic")
    mastery = topic.get("mastery_probability", 0)
    pct = round(mastery * 100)

    templates = {
        "Learn": f"Study the fundamentals of {topic_name} — your mastery is at {pct}%",
        "Practice": f"Solve practice problems on {topic_name} to strengthen your skills",
        "Quiz": f"Test yourself on {topic_name} to identify remaining gaps",
        "Revision": f"Quick revision of {topic_name} to reinforce what you've learned",
    }
    return templates.get(arm, f"Work on {topic_name}")
