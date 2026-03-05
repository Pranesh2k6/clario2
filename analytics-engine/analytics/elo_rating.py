"""
Clario Analytics Engine — ELO Duel Skill Rating System
Implements ELO-style rating updates for duel matchmaking fairness.
"""

import math
from .config import config
from .db import db


def calculate_expected_score(player_rating, opponent_rating):
    """
    Calculate the expected score for a player given both ratings.

    Formula: E = 1 / (1 + 10^((opponent_rating - player_rating) / 400))

    Args:
        player_rating: float, the player's current ELO rating
        opponent_rating: float, the opponent's current ELO rating

    Returns:
        float: expected score between 0 and 1
    """
    exponent = (opponent_rating - player_rating) / 400.0
    return 1.0 / (1.0 + math.pow(10, exponent))


def calculate_new_rating(current_rating, expected_score, actual_score, k_factor=None):
    """
    Calculate the new ELO rating after a match.

    Formula: new_rating = rating + K * (actual_score - expected_score)

    Args:
        current_rating: float
        expected_score: float (from calculate_expected_score)
        actual_score: float (1.0 for win, 0.0 for loss, 0.5 for draw)
        k_factor: int (default from config)

    Returns:
        float: new rating
    """
    if k_factor is None:
        k_factor = config.ELO_K_FACTOR

    return current_rating + k_factor * (actual_score - expected_score)


def process_duel_result(winner_id, loser_id, duel_id=None):
    """
    Process a duel result: update both players' ELO ratings.

    Args:
        winner_id: UUID string of the winning player
        loser_id: UUID string of the losing player
        duel_id: optional UUID string for logging

    Returns:
        dict with both players' old and new ratings
    """
    # Fetch current ratings (or initialize at 1200)
    winner_rating = _get_or_create_rating(winner_id)
    loser_rating = _get_or_create_rating(loser_id)

    # Calculate expected scores
    winner_expected = calculate_expected_score(winner_rating, loser_rating)
    loser_expected = calculate_expected_score(loser_rating, winner_rating)

    # Calculate new ratings
    winner_new = calculate_new_rating(winner_rating, winner_expected, 1.0)
    loser_new = calculate_new_rating(loser_rating, loser_expected, 0.0)

    # Ensure ratings don't drop below 100
    winner_new = max(100.0, round(winner_new, 2))
    loser_new = max(100.0, round(loser_new, 2))

    # Update database
    _update_rating(winner_id, winner_new, is_win=True)
    _update_rating(loser_id, loser_new, is_win=False)

    result = {
        "winner": {
            "user_id": winner_id,
            "old_rating": winner_rating,
            "new_rating": winner_new,
            "change": round(winner_new - winner_rating, 2),
        },
        "loser": {
            "user_id": loser_id,
            "old_rating": loser_rating,
            "new_rating": loser_new,
            "change": round(loser_new - loser_rating, 2),
        },
    }

    print(f"[ELO] Duel {duel_id or 'N/A'}: "
          f"Winner {winner_id[:8]}… {winner_rating} → {winner_new} "
          f"(+{result['winner']['change']}), "
          f"Loser {loser_id[:8]}… {loser_rating} → {loser_new} "
          f"({result['loser']['change']})")

    return result


def get_rating(user_id):
    """Get a student's current ELO rating."""
    query = """
        SELECT rating, total_duels, wins, losses, last_duel_at
        FROM student_skill_ratings
        WHERE user_id = %s
    """
    with db.telemetry_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (str(user_id),))
            row = cur.fetchone()

    if not row:
        return {
            "user_id": user_id,
            "rating": 1200.0,
            "total_duels": 0,
            "wins": 0,
            "losses": 0,
            "last_duel_at": None,
        }

    return {
        "user_id": user_id,
        "rating": row[0],
        "total_duels": row[1],
        "wins": row[2],
        "losses": row[3],
        "last_duel_at": row[4],
    }


def find_fair_opponents(user_id, rating_range=100, limit=10):
    """
    Find opponents within a fair rating range for matchmaking.

    Args:
        user_id: UUID string
        rating_range: max ELO distance from the player's rating
        limit: max number of opponents to return

    Returns:
        list of dicts with opponent info
    """
    player = get_rating(user_id)
    player_rating = player["rating"]

    query = """
        SELECT user_id, rating, total_duels, wins, losses
        FROM student_skill_ratings
        WHERE user_id != %s
          AND rating BETWEEN %s AND %s
        ORDER BY ABS(rating - %s) ASC
        LIMIT %s
    """

    with db.telemetry_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (
                str(user_id),
                player_rating - rating_range,
                player_rating + rating_range,
                player_rating,
                limit,
            ))
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()

    return [dict(zip(columns, row)) for row in rows]


# ─── Internal Helpers ──────────────────────────────────────────────────────────

def _get_or_create_rating(user_id):
    """Get the current rating or initialize at 1200."""
    query = "SELECT rating FROM student_skill_ratings WHERE user_id = %s"
    insert_query = """
        INSERT INTO student_skill_ratings (user_id, rating)
        VALUES (%s, 1200.0)
        ON CONFLICT (user_id) DO NOTHING
    """

    with db.telemetry_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (str(user_id),))
            row = cur.fetchone()
            if row:
                return float(row[0])

            # Create new rating entry
            cur.execute(insert_query, (str(user_id),))
            return 1200.0


def _update_rating(user_id, new_rating, is_win):
    """Update a player's rating after a duel."""
    query = """
        UPDATE student_skill_ratings
        SET rating = %s,
            total_duels = total_duels + 1,
            wins = wins + %s,
            losses = losses + %s,
            last_duel_at = NOW(),
            updated_at = NOW()
        WHERE user_id = %s
    """

    with db.telemetry_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (
                new_rating,
                1 if is_win else 0,
                0 if is_win else 1,
                str(user_id),
            ))
