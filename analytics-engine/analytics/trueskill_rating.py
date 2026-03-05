"""
Clario Analytics Engine — TrueSkill Rating System
Replaces ELO with Microsoft's TrueSkill algorithm for duel matchmaking.

TrueSkill maintains two values per player:
    μ (mu)    — estimated skill (mean)
    σ (sigma) — uncertainty (stdev)

Advantages over ELO:
    - Handles uncertainty (new players have high σ)
    - Faster convergence for new players
    - Supports draws natively
    - Match quality metric for better matchmaking
"""

import trueskill
from .config import config
from .db import db

# Initialize the TrueSkill environment
# mu=1200 to be comparable with the old ELO scale
# sigma=400 gives a wide initial uncertainty band
env = trueskill.TrueSkill(
    mu=1200.0,
    sigma=400.0,
    beta=200.0,        # performance variance (how much luck affects outcome)
    tau=4.0,            # dynamics factor (how much skill drifts over time)
    draw_probability=0.05,
)


def process_duel_result(winner_id, loser_id, duel_id=None, is_draw=False):
    """
    Process a duel result using TrueSkill.

    Args:
        winner_id: UUID string of the winning player
        loser_id: UUID string of the losing player
        duel_id: optional UUID for logging
        is_draw: if True, treat as a draw

    Returns:
        dict with both players' old and new ratings
    """
    # Fetch current ratings
    winner_mu, winner_sigma = _get_or_create_rating(winner_id)
    loser_mu, loser_sigma = _get_or_create_rating(loser_id)

    # Create TrueSkill Rating objects
    winner_rating = env.create_rating(mu=winner_mu, sigma=winner_sigma)
    loser_rating = env.create_rating(mu=loser_mu, sigma=loser_sigma)

    # Rate the match
    if is_draw:
        (new_winner,), (new_loser,) = env.rate(
            [(winner_rating,), (loser_rating,)],
            ranks=[0, 0],  # same rank = draw
        )
    else:
        (new_winner,), (new_loser,) = env.rate(
            [(winner_rating,), (loser_rating,)],
            ranks=[0, 1],  # lower rank = better
        )

    # Compute conservative skill estimate: μ - 3σ
    # This is the "display rating" (like TrueSkill's leaderboard value)
    winner_display = max(100, round(new_winner.mu - 3 * new_winner.sigma, 2))
    loser_display = max(100, round(new_loser.mu - 3 * new_loser.sigma, 2))

    old_winner_display = max(100, round(winner_mu - 3 * winner_sigma, 2))
    old_loser_display = max(100, round(loser_mu - 3 * loser_sigma, 2))

    # Update database
    _update_rating(
        winner_id,
        mu=round(new_winner.mu, 4),
        sigma=round(new_winner.sigma, 4),
        display_rating=winner_display,
        is_win=not is_draw,
        is_draw=is_draw,
    )
    _update_rating(
        loser_id,
        mu=round(new_loser.mu, 4),
        sigma=round(new_loser.sigma, 4),
        display_rating=loser_display,
        is_win=False,
        is_draw=is_draw,
    )

    result = {
        "winner": {
            "user_id": winner_id,
            "old_display": old_winner_display,
            "new_display": winner_display,
            "mu": round(new_winner.mu, 2),
            "sigma": round(new_winner.sigma, 2),
            "change": round(winner_display - old_winner_display, 2),
        },
        "loser": {
            "user_id": loser_id,
            "old_display": old_loser_display,
            "new_display": loser_display,
            "mu": round(new_loser.mu, 2),
            "sigma": round(new_loser.sigma, 2),
            "change": round(loser_display - old_loser_display, 2),
        },
    }

    print(f"[TrueSkill] Duel {duel_id or 'N/A'}: "
          f"W {winner_id[:8]}… {old_winner_display}→{winner_display} "
          f"L {loser_id[:8]}… {old_loser_display}→{loser_display}")

    return result


def get_match_quality(player1_id, player2_id):
    """
    Compute the TrueSkill match quality between two players.
    Returns a value between 0 and 1 (1 = perfectly matched).
    """
    mu1, sigma1 = _get_or_create_rating(player1_id)
    mu2, sigma2 = _get_or_create_rating(player2_id)

    r1 = env.create_rating(mu=mu1, sigma=sigma1)
    r2 = env.create_rating(mu=mu2, sigma=sigma2)

    return round(env.quality([(r1,), (r2,)]), 4)


def find_fair_opponents(user_id, limit=10, min_quality=0.3):
    """
    Find opponents with the highest match quality.
    """
    player_mu, player_sigma = _get_or_create_rating(user_id)
    player_rating = env.create_rating(mu=player_mu, sigma=player_sigma)

    query = """
        SELECT user_id, mu, sigma, rating, total_duels, wins, losses
        FROM student_skill_ratings
        WHERE user_id != %s
        ORDER BY ABS(mu - %s) ASC
        LIMIT %s
    """

    with db.telemetry_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (str(user_id), player_mu, limit * 3))
            rows = cur.fetchall()

    opponents = []
    for row in rows:
        opp_rating = env.create_rating(mu=float(row[1]), sigma=float(row[2]))
        quality = env.quality([(player_rating,), (opp_rating,)])

        if quality >= min_quality:
            opponents.append({
                "user_id": row[0],
                "display_rating": float(row[3]),
                "mu": float(row[1]),
                "sigma": float(row[2]),
                "match_quality": round(quality, 4),
                "total_duels": row[4],
            })

    # Sort by match quality (best match first)
    opponents.sort(key=lambda x: x["match_quality"], reverse=True)
    return opponents[:limit]


# ─── Internal Helpers ──────────────────────────────────────────────────────────

def _get_or_create_rating(user_id):
    """Get (mu, sigma) or create with defaults."""
    query = "SELECT mu, sigma FROM student_skill_ratings WHERE user_id = %s"
    insert_query = """
        INSERT INTO student_skill_ratings (user_id, rating, mu, sigma)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (user_id) DO NOTHING
    """

    with db.telemetry_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (str(user_id),))
            row = cur.fetchone()
            if row:
                return float(row[0]), float(row[1])

            # Initialize new player
            default_mu = env.mu
            default_sigma = env.sigma
            default_display = max(100, round(default_mu - 3 * default_sigma, 2))
            cur.execute(insert_query, (str(user_id), default_display, default_mu, default_sigma))
            return default_mu, default_sigma


def _update_rating(user_id, mu, sigma, display_rating, is_win, is_draw):
    """Update TrueSkill rating in the database."""
    query = """
        UPDATE student_skill_ratings
        SET rating = %s,
            mu = %s,
            sigma = %s,
            total_duels = total_duels + 1,
            wins = wins + %s,
            losses = losses + %s,
            last_duel_at = NOW(),
            updated_at = NOW()
        WHERE user_id = %s
    """

    win_inc = 1 if is_win else 0
    loss_inc = 0 if (is_win or is_draw) else 1

    with db.telemetry_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (
                display_rating, mu, sigma,
                win_inc, loss_inc,
                str(user_id),
            ))
