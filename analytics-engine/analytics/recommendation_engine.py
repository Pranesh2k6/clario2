"""
Clario Analytics Engine — Recommendation Engine
Generates personalized learning recommendations based on analytics.
"""

import uuid
from datetime import datetime, timedelta
from .config import config
from .db import db
from .skill_estimation import get_weak_topics, get_knowledge_vector


def generate_recommendations(user_id):
    """
    Generate personalized recommendations for a student.

    Rules:
        1. If weak topic detected → recommend practice questions
        2. If accuracy high but speed low → recommend timed practice
        3. If duel win rate low → recommend revision before duels
        4. If topic not attempted recently → recommend review

    Args:
        user_id: UUID string

    Returns:
        list of recommendation dicts that were inserted
    """
    recommendations = []

    # ── Rule 1: Weak topic → Practice questions ────────────────────────────
    weak_topics = get_weak_topics(user_id)
    for topic in weak_topics:
        rec = {
            "user_id": user_id,
            "recommendation_type": "practice_weak_topic",
            "subject": topic["subject"],
            "topic": topic["topic"],
            "subtopic": topic.get("subtopic"),
            "concept_tag": topic.get("concept_tag"),
            "title": f"Practice {topic['topic']}",
            "description": (
                f"Your mastery in {topic['topic']} ({topic['subject']}) is "
                f"{topic['mastery_probability']:.0%}. Practice 15 questions to improve."
            ),
            "priority": 1 if topic["mastery_probability"] < 0.2 else 3,
        }
        recommendations.append(rec)

    # ── Rule 2: High accuracy, slow speed → Timed practice ────────────────
    knowledge = get_knowledge_vector(user_id)
    for subject, topics in knowledge.items():
        for t in topics:
            if (t["behavior_label"] == "careful"
                    and t["mastery_probability"] >= config.STRONG_TOPIC_ACCURACY_THRESHOLD):
                rec = {
                    "user_id": user_id,
                    "recommendation_type": "timed_practice",
                    "subject": subject,
                    "topic": t["topic"],
                    "subtopic": t.get("subtopic"),
                    "concept_tag": t.get("concept_tag"),
                    "title": f"Speed drill: {t['topic']}",
                    "description": (
                        f"You know {t['topic']} well ({t['mastery_probability']:.0%} mastery) "
                        f"but your average time is {t['avg_time_taken_ms']/1000:.1f}s. "
                        f"Try timed practice to build speed."
                    ),
                    "priority": 5,
                }
                recommendations.append(rec)

    # ── Rule 3: Guessing behavior → Concept review ────────────────────────
    for subject, topics in knowledge.items():
        for t in topics:
            if t["behavior_label"] == "guessing":
                rec = {
                    "user_id": user_id,
                    "recommendation_type": "concept_review",
                    "subject": subject,
                    "topic": t["topic"],
                    "subtopic": t.get("subtopic"),
                    "concept_tag": t.get("concept_tag"),
                    "title": f"Review concepts: {t['topic']}",
                    "description": (
                        f"Your responses in {t['topic']} are very fast but inaccurate. "
                        f"Review the core concepts before attempting more questions."
                    ),
                    "priority": 2,
                }
                recommendations.append(rec)

    # ── Rule 4: Stale topics → Review ─────────────────────────────────────
    stale_cutoff = datetime.utcnow() - timedelta(days=14)
    for subject, topics in knowledge.items():
        for t in topics:
            last_at = t.get("last_attempted_at")
            if last_at and last_at < stale_cutoff and t["total_attempts"] >= 5:
                rec = {
                    "user_id": user_id,
                    "recommendation_type": "revision_before_duel",
                    "subject": subject,
                    "topic": t["topic"],
                    "subtopic": t.get("subtopic"),
                    "concept_tag": t.get("concept_tag"),
                    "title": f"Revisit {t['topic']}",
                    "description": (
                        f"You haven't practiced {t['topic']} in over 2 weeks. "
                        f"A quick review will help retain your mastery."
                    ),
                    "priority": 4,
                }
                recommendations.append(rec)

    # ── Write to database ──────────────────────────────────────────────────
    if recommendations:
        _insert_recommendations(recommendations)
        print(f"[Reco] Generated {len(recommendations)} recommendations for user {user_id[:8]}…")
    else:
        print(f"[Reco] No new recommendations for user {user_id[:8]}…")

    return recommendations


def get_active_recommendations(user_id, limit=20):
    """
    Fetch active (non-completed) recommendations for a student.
    Ordered by priority (highest first).
    """
    query = """
        SELECT id, recommendation_type, subject, topic, subtopic, concept_tag,
               title, description, priority, created_at, expires_at
        FROM learning_recommendations
        WHERE user_id = %s
          AND is_completed = FALSE
          AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY priority ASC, created_at DESC
        LIMIT %s
    """

    with db.telemetry_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (str(user_id), limit))
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()

    return [dict(zip(columns, row)) for row in rows]


def complete_recommendation(recommendation_id):
    """Mark a recommendation as completed."""
    query = """
        UPDATE learning_recommendations
        SET is_completed = TRUE, completed_at = NOW()
        WHERE id = %s
    """

    with db.telemetry_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (str(recommendation_id),))


# ─── Internal Helpers ──────────────────────────────────────────────────────────

def _insert_recommendations(recommendations):
    """Bulk-insert recommendations into the database."""
    query = """
        INSERT INTO learning_recommendations
            (id, user_id, recommendation_type, subject, topic, subtopic,
             concept_tag, title, description, priority, expires_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    expires = datetime.utcnow() + timedelta(days=7)

    with db.telemetry_conn() as conn:
        with conn.cursor() as cur:
            for r in recommendations:
                cur.execute(query, (
                    str(uuid.uuid4()),
                    str(r["user_id"]),
                    r["recommendation_type"],
                    r.get("subject"),
                    r.get("topic"),
                    r.get("subtopic"),
                    r.get("concept_tag"),
                    r["title"],
                    r.get("description"),
                    r.get("priority", 5),
                    expires,
                ))
