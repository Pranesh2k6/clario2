"""
Clario Analytics Engine — Feature Extraction
Extracts computed features from raw attempt_history data.
Computes per-user-per-topic aggregations: accuracy, avg_time, attempt_count.
"""

from .db import db


def extract_user_topic_features(user_id=None):
    """
    Extract per-user, per-topic performance features from attempt_history.

    Returns a list of dicts:
    [
        {
            "user_id": "uuid",
            "subject": "Physics",
            "topic": "Mechanics",
            "subtopic": "Rotational Mechanics",
            "concept_tag": "moment_of_inertia",
            "total_attempts": 25,
            "correct_attempts": 18,
            "accuracy": 0.72,
            "avg_time_taken_ms": 8500.0,
            "last_attempted_at": "2026-03-05T10:22:12"
        },
        ...
    ]
    """
    query = """
        SELECT
            user_id,
            COALESCE(subject, 'Unknown') AS subject,
            COALESCE(topic, 'Unknown') AS topic,
            subtopic,
            concept_tag,
            COUNT(*) AS total_attempts,
            SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct_attempts,
            ROUND(
                SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0),
                4
            ) AS accuracy,
            ROUND(AVG(time_taken_ms)::NUMERIC, 2) AS avg_time_taken_ms,
            MAX(created_at) AS last_attempted_at
        FROM attempt_history
        {where_clause}
        GROUP BY user_id, subject, topic, subtopic, concept_tag
        ORDER BY user_id, subject, topic
    """

    where_clause = ""
    params = ()
    if user_id:
        where_clause = "WHERE user_id = %s"
        params = (user_id,)

    query = query.format(where_clause=where_clause)

    with db.telemetry_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()

    return [dict(zip(columns, row)) for row in rows]


def extract_user_duel_stats(user_id=None):
    """
    Extract duel win/loss statistics per user from attempt_history duel results.

    Returns a list of dicts:
    [
        {
            "user_id": "uuid",
            "total_duels": 15,
            "wins": 10,
            "losses": 5,
            "win_rate": 0.6667,
            "avg_duel_accuracy": 0.75,
            "avg_duel_time_ms": 9200.0
        },
        ...
    ]
    """
    query = """
        WITH duel_attempts AS (
            SELECT
                user_id,
                duel_id,
                COUNT(*) AS questions_in_duel,
                SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct_in_duel,
                AVG(time_taken_ms) AS avg_time_in_duel,
                MAX(duel_result) AS duel_result
            FROM attempt_history
            WHERE duel_id IS NOT NULL
            {user_filter}
            GROUP BY user_id, duel_id
        )
        SELECT
            user_id,
            COUNT(DISTINCT duel_id) AS total_duels,
            SUM(CASE WHEN duel_result = 'win' THEN 1 ELSE 0 END) AS wins,
            SUM(CASE WHEN duel_result = 'loss' THEN 1 ELSE 0 END) AS losses,
            ROUND(
                SUM(CASE WHEN duel_result = 'win' THEN 1 ELSE 0 END)::NUMERIC
                / NULLIF(COUNT(DISTINCT duel_id), 0),
                4
            ) AS win_rate,
            ROUND(AVG(correct_in_duel::NUMERIC / NULLIF(questions_in_duel, 0)), 4) AS avg_duel_accuracy,
            ROUND(AVG(avg_time_in_duel)::NUMERIC, 2) AS avg_duel_time_ms
        FROM duel_attempts
        GROUP BY user_id
        ORDER BY user_id
    """

    user_filter = ""
    params = ()
    if user_id:
        user_filter = "AND user_id = %s"
        params = (user_id,)

    query = query.format(user_filter=user_filter)

    with db.telemetry_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()

    return [dict(zip(columns, row)) for row in rows]


def extract_daily_metrics(user_id=None, days=30):
    """
    Extract daily aggregated learning metrics for dashboard time-series.

    Returns a list of dicts with daily stats.
    """
    query = """
        SELECT
            user_id,
            DATE(created_at) AS metric_date,
            COUNT(*) AS total_attempts,
            SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct_attempts,
            ROUND(
                SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0),
                4
            ) AS accuracy,
            ROUND(AVG(time_taken_ms)::NUMERIC, 2) AS avg_time_taken_ms,
            COUNT(DISTINCT CASE WHEN duel_id IS NOT NULL THEN duel_id END) AS duels_played,
            COUNT(DISTINCT CASE WHEN duel_result = 'win' THEN duel_id END) AS duels_won
        FROM attempt_history
        WHERE created_at >= NOW() - INTERVAL '%s days'
        {user_filter}
        GROUP BY user_id, DATE(created_at)
        ORDER BY user_id, metric_date DESC
    """

    user_filter = ""
    params = (days,)
    if user_id:
        user_filter = "AND user_id = %s"
        params = (days, user_id)

    query = query.format(user_filter=user_filter)

    with db.telemetry_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()

    return [dict(zip(columns, row)) for row in rows]


# ─── Duel Performance Signals (Teacher-Style Feedback) ────────────────────────

def extract_duel_performance_signals(user_id, duel_id=None):
    """
    Extract structured performance signals from a specific duel (or latest duel).

    These signals are discrete string labels — NOT raw numbers — designed to be
    mapped directly to teacher-style feedback templates by the NLG layer.

    Returns:
        dict with keys:
            weak_topic:               str | None — topic with lowest accuracy in this duel
            strong_topic:             str | None — topic with highest accuracy + fastest speed
            speed_pattern:            str — one of 'fast_correct', 'fast_incorrect',
                                              'slow_correct', 'slow_incorrect', 'balanced'
            difficulty_pattern:       str — e.g. 'easy_fast_medium_slow', 'uniform', ...
            consistent_accuracy_topic: str | None — topic with 100% accuracy (≥2 questions)
    """
    # ── Fetch per-question attempt data for this duel ─────────────────────
    if duel_id:
        query = """
            SELECT topic, difficulty_at_time AS difficulty, is_correct, time_taken_ms
            FROM attempt_history
            WHERE user_id = %s AND duel_id = %s
            ORDER BY created_at
        """
        params = (str(user_id), str(duel_id))
    else:
        # Use the most recent duel
        query = """
            SELECT topic, difficulty_at_time AS difficulty, is_correct, time_taken_ms
            FROM attempt_history
            WHERE user_id = %s
              AND duel_id = (
                  SELECT duel_id FROM attempt_history
                  WHERE user_id = %s AND duel_id IS NOT NULL
                  ORDER BY created_at DESC LIMIT 1
              )
            ORDER BY created_at
        """
        params = (str(user_id), str(user_id))

    with db.telemetry_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()

    attempts = [dict(zip(columns, row)) for row in rows]

    if not attempts:
        return {
            "weak_topic": None,
            "strong_topic": None,
            "speed_pattern": "balanced",
            "difficulty_pattern": "uniform",
            "consistent_accuracy_topic": None,
        }

    # ── Classify per-topic accuracy ───────────────────────────────────────
    topic_stats = {}
    for a in attempts:
        topic = a.get("topic") or "General"
        if topic not in topic_stats:
            topic_stats[topic] = {"correct": 0, "total": 0, "total_time_ms": 0}
        topic_stats[topic]["total"] += 1
        topic_stats[topic]["total_time_ms"] += float(a.get("time_taken_ms") or 0)
        if a.get("is_correct"):
            topic_stats[topic]["correct"] += 1

    # Compute accuracy per topic
    for stats in topic_stats.values():
        stats["accuracy"] = stats["correct"] / stats["total"] if stats["total"] > 0 else 0
        stats["avg_time_ms"] = stats["total_time_ms"] / stats["total"] if stats["total"] > 0 else 0

    # weak_topic: lowest accuracy (must have at least 1 incorrect)
    weak_candidates = [(t, s) for t, s in topic_stats.items() if s["correct"] < s["total"]]
    weak_topic = min(weak_candidates, key=lambda x: x[1]["accuracy"])[0] if weak_candidates else None

    # strong_topic: highest accuracy with fastest avg speed
    strong_candidates = [(t, s) for t, s in topic_stats.items() if s["accuracy"] >= 0.8]
    if strong_candidates:
        strong_topic = min(strong_candidates, key=lambda x: x[1]["avg_time_ms"])[0]
    else:
        strong_topic = None

    # consistent_accuracy_topic: 100% accuracy with ≥2 questions
    consistent_topic = None
    for t, s in topic_stats.items():
        if s["accuracy"] == 1.0 and s["total"] >= 2:
            consistent_topic = t
            break

    # ── Speed pattern (overall) ───────────────────────────────────────────
    FAST_MS = 8000
    total_correct = sum(1 for a in attempts if a.get("is_correct"))
    total_incorrect = len(attempts) - total_correct
    avg_time = sum(float(a.get("time_taken_ms") or 0) for a in attempts) / len(attempts)
    overall_accuracy = total_correct / len(attempts) if attempts else 0

    if avg_time < FAST_MS and overall_accuracy >= 0.7:
        speed_pattern = "fast_correct"
    elif avg_time < FAST_MS and overall_accuracy < 0.5:
        speed_pattern = "fast_incorrect"
    elif avg_time >= 15000 and overall_accuracy >= 0.7:
        speed_pattern = "slow_correct"
    elif avg_time >= 15000 and overall_accuracy < 0.5:
        speed_pattern = "slow_incorrect"
    else:
        speed_pattern = "balanced"

    # ── Difficulty pattern ────────────────────────────────────────────────
    def _classify_difficulty(val):
        """Convert difficulty_at_time float to Easy/Medium/Hard label."""
        if val is None:
            return "medium"
        if isinstance(val, (int, float)):
            if val <= 0.33:
                return "easy"
            elif val <= 0.66:
                return "medium"
            else:
                return "hard"
        return str(val).lower() or "medium"

    diff_stats = {}
    for a in attempts:
        diff = _classify_difficulty(a.get("difficulty"))
        if diff not in diff_stats:
            diff_stats[diff] = {"total_time": 0, "count": 0}
        diff_stats[diff]["total_time"] += float(a.get("time_taken_ms") or 0)
        diff_stats[diff]["count"] += 1

    for d in diff_stats.values():
        d["avg_time"] = d["total_time"] / d["count"] if d["count"] > 0 else 0

    easy_time = diff_stats.get("easy", {}).get("avg_time", 0)
    medium_time = diff_stats.get("medium", {}).get("avg_time", 0)
    hard_time = diff_stats.get("hard", {}).get("avg_time", 0)

    if easy_time > 0 and medium_time > 0 and medium_time > easy_time * 1.5:
        difficulty_pattern = "easy_fast_medium_slow"
    elif hard_time > 0 and hard_time > medium_time * 1.5:
        difficulty_pattern = "hard_slow"
    elif easy_time > 0 and medium_time > 0 and hard_time > 0:
        max_t = max(easy_time, medium_time, hard_time)
        min_t = min(easy_time, medium_time, hard_time)
        if max_t < min_t * 1.3:
            difficulty_pattern = "uniform"
        else:
            difficulty_pattern = "progressive_slower"
    else:
        difficulty_pattern = "uniform"

    return {
        "weak_topic": weak_topic,
        "strong_topic": strong_topic,
        "speed_pattern": speed_pattern,
        "difficulty_pattern": difficulty_pattern,
        "consistent_accuracy_topic": consistent_topic,
    }
