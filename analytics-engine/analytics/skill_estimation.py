"""
Clario Analytics Engine — Rule-Based Skill Estimation
Computes mastery probability per student per topic using deterministic rules.
Updates student_knowledge_profiles table.
"""

from .config import config
from .db import db


def classify_mastery(accuracy, total_attempts, avg_time_ms):
    """
    Determine mastery probability and behavior label.

    Rule-based classification:
        - accuracy < 0.5 AND attempts > threshold → weak (mastery ~0.2–0.4)
        - accuracy > 0.8 AND attempts > threshold → strong (mastery ~0.8–0.95)
        - otherwise → developing (mastery ~0.4–0.7)

    Behavior labels:
        - fast + inaccurate → 'guessing'
        - slow + accurate   → 'careful'
        - fast + accurate   → 'mastery'
        - slow + inaccurate → 'struggling'
    """
    min_attempts = config.MIN_ATTEMPTS_THRESHOLD
    weak_threshold = config.WEAK_TOPIC_ACCURACY_THRESHOLD
    strong_threshold = config.STRONG_TOPIC_ACCURACY_THRESHOLD

    # ── Mastery probability ────────────────────────────────────────────────
    if total_attempts < min_attempts:
        # Not enough data — assign neutral mastery
        mastery = 0.5
    elif accuracy >= strong_threshold:
        mastery = 0.8 + (accuracy - strong_threshold) * 0.75  # cap at ~0.95
        mastery = min(mastery, 0.95)
    elif accuracy < weak_threshold:
        mastery = accuracy * 0.8  # scale down further
        mastery = max(mastery, 0.05)
    else:
        # Developing range
        mastery = 0.4 + (accuracy - weak_threshold) * (0.4 / (strong_threshold - weak_threshold))

    # ── Behavior label ─────────────────────────────────────────────────────
    # Define "fast" as < 8000ms avg, "slow" as > 15000ms avg
    FAST_MS = 8000
    SLOW_MS = 15000

    if avg_time_ms < FAST_MS and accuracy < weak_threshold:
        behavior = "guessing"
    elif avg_time_ms > SLOW_MS and accuracy >= strong_threshold:
        behavior = "careful"
    elif avg_time_ms < FAST_MS and accuracy >= strong_threshold:
        behavior = "mastery"
    elif avg_time_ms > SLOW_MS and accuracy < weak_threshold:
        behavior = "struggling"
    else:
        behavior = "developing"

    return round(mastery, 4), behavior


def update_knowledge_profiles(features):
    """
    Write computed features into the student_knowledge_profiles table.

    Args:
        features: List of dicts from feature_extraction.extract_user_topic_features()
    """
    if not features:
        print("[Skill] No features to process.")
        return 0

    upsert_query = """
        INSERT INTO student_knowledge_profiles
            (user_id, subject, topic, subtopic, concept_tag,
             mastery_probability, total_attempts, correct_attempts,
             avg_time_taken_ms, behavior_label, last_attempted_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
        ON CONFLICT (user_id, subject, topic)
        DO UPDATE SET
            subtopic = EXCLUDED.subtopic,
            concept_tag = EXCLUDED.concept_tag,
            mastery_probability = EXCLUDED.mastery_probability,
            total_attempts = EXCLUDED.total_attempts,
            correct_attempts = EXCLUDED.correct_attempts,
            avg_time_taken_ms = EXCLUDED.avg_time_taken_ms,
            behavior_label = EXCLUDED.behavior_label,
            last_attempted_at = EXCLUDED.last_attempted_at,
            updated_at = NOW()
    """

    updated = 0
    with db.telemetry_conn() as conn:
        with conn.cursor() as cur:
            for f in features:
                accuracy = float(f.get("accuracy", 0))
                total = int(f.get("total_attempts", 0))
                avg_time = float(f.get("avg_time_taken_ms", 0))

                mastery, behavior = classify_mastery(accuracy, total, avg_time)

                cur.execute(upsert_query, (
                    str(f["user_id"]),
                    f["subject"],
                    f["topic"],
                    f.get("subtopic"),
                    f.get("concept_tag"),
                    mastery,
                    total,
                    int(f.get("correct_attempts", 0)),
                    avg_time,
                    behavior,
                    f.get("last_attempted_at"),
                ))
                updated += 1

    print(f"[Skill] Updated {updated} knowledge profile rows.")
    return updated


def get_weak_topics(user_id):
    """
    Retrieve weak topics for a specific student.

    Returns topics where:
        - mastery_probability < WEAK_TOPIC_ACCURACY_THRESHOLD
        - total_attempts >= MIN_ATTEMPTS_THRESHOLD
    """
    query = """
        SELECT subject, topic, subtopic, concept_tag,
               mastery_probability, total_attempts, behavior_label
        FROM student_knowledge_profiles
        WHERE user_id = %s
          AND mastery_probability < %s
          AND total_attempts >= %s
        ORDER BY mastery_probability ASC
    """

    with db.telemetry_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (
                str(user_id),
                config.WEAK_TOPIC_ACCURACY_THRESHOLD,
                config.MIN_ATTEMPTS_THRESHOLD,
            ))
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()

    return [dict(zip(columns, row)) for row in rows]


def get_strong_topics(user_id):
    """
    Retrieve strong topics for a specific student.

    Returns topics where:
        - mastery_probability >= STRONG_TOPIC_ACCURACY_THRESHOLD
        - total_attempts >= MIN_ATTEMPTS_THRESHOLD
    """
    query = """
        SELECT subject, topic, subtopic, concept_tag,
               mastery_probability, total_attempts, behavior_label
        FROM student_knowledge_profiles
        WHERE user_id = %s
          AND mastery_probability >= %s
          AND total_attempts >= %s
        ORDER BY mastery_probability DESC
    """

    with db.telemetry_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (
                str(user_id),
                config.STRONG_TOPIC_ACCURACY_THRESHOLD,
                config.MIN_ATTEMPTS_THRESHOLD,
            ))
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()

    return [dict(zip(columns, row)) for row in rows]


def get_knowledge_vector(user_id):
    """
    Retrieve the full knowledge vector for a student.

    Returns all topics with mastery probabilities, organized by subject.
    """
    query = """
        SELECT subject, topic, subtopic, concept_tag,
               mastery_probability, total_attempts, correct_attempts,
               avg_time_taken_ms, behavior_label, last_attempted_at
        FROM student_knowledge_profiles
        WHERE user_id = %s
        ORDER BY subject, topic
    """

    with db.telemetry_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (str(user_id),))
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()

    # Organize by subject
    profiles = [dict(zip(columns, row)) for row in rows]
    vector = {}
    for p in profiles:
        subject = p["subject"]
        if subject not in vector:
            vector[subject] = []
        vector[subject].append(p)

    return vector
