"""
Clario Analytics Engine — Bayesian Knowledge Tracing (BKT)
Implements a Hidden Markov Model for each student×concept pair to estimate
mastery probability. Replaces the rule-based skill_estimation module.

Parameters per concept (global priors, can be tuned per topic later):
    P(L0)  — prior probability of knowing the concept before any attempts
    P(T)   — probability of learning on each attempt (transit)
    P(G)   — probability of guessing correctly without knowledge
    P(S)   — probability of slipping (wrong answer despite knowledge)
"""

import math
from .config import config
from .db import db


# ─── Global BKT Priors ────────────────────────────────────────────────────────
# These are sensible defaults for JEE-level content. They can be overridden
# per topic once enough data accumulates for per-topic calibration.
DEFAULT_PRIORS = {
    "p_init": 0.10,   # P(L0): most concepts start unlearned
    "p_transit": 0.15, # P(T): ~15% chance to learn per attempt
    "p_guess": 0.20,   # P(G): ~20% chance of lucky guess (4-option MCQ: 0.25)
    "p_slip": 0.10,    # P(S): ~10% careless mistake rate
}


class BKTEngine:
    """
    Bayesian Knowledge Tracing engine.

    For each (user, subject, topic) triple, maintains a running mastery
    probability P(L_t) and updates it with each new observation.
    """

    def __init__(self, priors=None):
        self.priors = priors or DEFAULT_PRIORS

    def update(self, user_id, subject, topic, subtopic, concept_tag,
               is_correct, time_taken_ms):
        """
        Process a single question attempt and update the mastery state.

        Steps:
            1. Fetch current P(L_t-1) from the database (or use P(L0)).
            2. Compute the posterior P(L_t) given the observation.
            3. Determine behavior label from response patterns.
            4. Write the updated mastery back to the database.

        Returns:
            float: The updated mastery probability P(L_t).
        """
        # Step 1: Fetch current state
        current = self._get_current_state(user_id, subject, topic)
        p_l = current["mastery"] if current else self.priors["p_init"]
        total_attempts = current["total_attempts"] if current else 0
        correct_attempts = current["correct_attempts"] if current else 0
        cumulative_time = current["cumulative_time"] if current else 0

        p_t = self.priors["p_transit"]
        p_g = self.priors["p_guess"]
        p_s = self.priors["p_slip"]

        # Step 2: BKT posterior update
        if is_correct:
            # P(L_t | correct) = P(correct | L) * P(L) / P(correct)
            p_correct_given_l = 1.0 - p_s
            p_correct_given_not_l = p_g
            p_correct = p_l * p_correct_given_l + (1 - p_l) * p_correct_given_not_l

            if p_correct > 0:
                p_l_given_obs = (p_l * p_correct_given_l) / p_correct
            else:
                p_l_given_obs = p_l
        else:
            # P(L_t | incorrect) = P(incorrect | L) * P(L) / P(incorrect)
            p_incorrect_given_l = p_s
            p_incorrect_given_not_l = 1.0 - p_g
            p_incorrect = p_l * p_incorrect_given_l + (1 - p_l) * p_incorrect_given_not_l

            if p_incorrect > 0:
                p_l_given_obs = (p_l * p_incorrect_given_l) / p_incorrect
            else:
                p_l_given_obs = p_l

        # Apply learning transition: even if the student didn't know it,
        # there's a probability they learned from this attempt.
        p_l_new = p_l_given_obs + (1 - p_l_given_obs) * p_t

        # Clamp to [0.01, 0.99] to avoid certainty
        p_l_new = max(0.01, min(0.99, p_l_new))

        # Step 3: Update counters
        total_attempts += 1
        if is_correct:
            correct_attempts += 1
        cumulative_time += time_taken_ms
        avg_time = cumulative_time / total_attempts if total_attempts > 0 else 0

        # Step 4: Behavior classification
        behavior = self._classify_behavior(
            accuracy=correct_attempts / total_attempts if total_attempts > 0 else 0,
            avg_time_ms=avg_time,
            p_mastery=p_l_new,
        )

        # Step 5: Persist to database
        self._upsert_profile(
            user_id=user_id,
            subject=subject,
            topic=topic,
            subtopic=subtopic,
            concept_tag=concept_tag,
            mastery=round(p_l_new, 6),
            total_attempts=total_attempts,
            correct_attempts=correct_attempts,
            avg_time_ms=round(avg_time, 2),
            behavior=behavior,
        )

        return round(p_l_new, 4)

    def predict_correct(self, mastery_p):
        """
        Predict the probability of a correct answer given mastery probability.

        P(correct) = P(L) * (1 - P(S)) + (1 - P(L)) * P(G)
        """
        p_s = self.priors["p_slip"]
        p_g = self.priors["p_guess"]
        return mastery_p * (1 - p_s) + (1 - mastery_p) * p_g

    # ─── Internal Helpers ──────────────────────────────────────────────────

    def _classify_behavior(self, accuracy, avg_time_ms, p_mastery):
        """Classify behavior using BKT mastery + response patterns."""
        FAST_MS = 8000
        SLOW_MS = 15000

        if p_mastery >= 0.8 and avg_time_ms < FAST_MS:
            return "mastery"
        elif p_mastery >= 0.7 and avg_time_ms > SLOW_MS:
            return "careful"
        elif p_mastery < 0.3 and avg_time_ms < FAST_MS:
            return "guessing"
        elif p_mastery < 0.4 and avg_time_ms > SLOW_MS:
            return "struggling"
        elif p_mastery >= 0.4:
            return "developing"
        else:
            return "weak"

    def _get_current_state(self, user_id, subject, topic):
        """Fetch current mastery state from the database."""
        query = """
            SELECT mastery_probability, total_attempts, correct_attempts,
                   avg_time_taken_ms * total_attempts AS cumulative_time
            FROM student_knowledge_profiles
            WHERE user_id = %s AND subject = %s AND topic = %s
        """
        try:
            with db.telemetry_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (str(user_id), subject, topic))
                    row = cur.fetchone()
                    if row:
                        return {
                            "mastery": float(row[0]),
                            "total_attempts": int(row[1]),
                            "correct_attempts": int(row[2]),
                            "cumulative_time": float(row[3] or 0),
                        }
        except Exception as e:
            print(f"[BKT] DB read error: {e}")
        return None

    def _upsert_profile(self, user_id, subject, topic, subtopic,
                        concept_tag, mastery, total_attempts,
                        correct_attempts, avg_time_ms, behavior):
        """Write updated mastery state to the database."""
        query = """
            INSERT INTO student_knowledge_profiles
                (user_id, subject, topic, subtopic, concept_tag,
                 mastery_probability, total_attempts, correct_attempts,
                 avg_time_taken_ms, behavior_label, last_attempted_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            ON CONFLICT (user_id, subject, topic)
            DO UPDATE SET
                subtopic = EXCLUDED.subtopic,
                concept_tag = EXCLUDED.concept_tag,
                mastery_probability = EXCLUDED.mastery_probability,
                total_attempts = EXCLUDED.total_attempts,
                correct_attempts = EXCLUDED.correct_attempts,
                avg_time_taken_ms = EXCLUDED.avg_time_taken_ms,
                behavior_label = EXCLUDED.behavior_label,
                last_attempted_at = NOW(),
                updated_at = NOW()
        """
        try:
            with db.telemetry_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (
                        str(user_id), subject, topic, subtopic, concept_tag,
                        mastery, total_attempts, correct_attempts,
                        avg_time_ms, behavior,
                    ))
        except Exception as e:
            print(f"[BKT] DB write error: {e}")
