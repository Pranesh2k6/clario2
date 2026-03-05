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
