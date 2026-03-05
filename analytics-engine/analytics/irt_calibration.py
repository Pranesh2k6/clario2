"""
Clario Analytics Engine — 2-Parameter Logistic IRT Calibration
Dynamically estimates question difficulty and discrimination from attempt data.

The 2PL IRT Model:
    P(correct | θ, a, b) = 1 / (1 + exp(-a * (θ - b)))

    θ — student ability (latent trait)
    a — item discrimination (how well question separates strong/weak)
    b — item difficulty (ability level needed for 50% chance)

This module runs as a batch job: it reads attempt_history, estimates
parameters via Joint Maximum Likelihood (JML), and writes back to
duel_questions_pool.
"""

import math
import numpy as np
from .config import config
from .db import db


# ─── IRT Model ─────────────────────────────────────────────────────────────────

def sigmoid(x):
    """Numerically stable sigmoid."""
    return np.where(x >= 0,
                    1.0 / (1.0 + np.exp(-x)),
                    np.exp(x) / (1.0 + np.exp(x)))


def irt_probability(theta, a, b):
    """P(correct) under 2PL IRT model."""
    return sigmoid(a * (theta - b))


def calibrate_items(min_responses=20, max_iterations=50, learning_rate=0.01):
    """
    Run 2PL IRT calibration using Joint Maximum Likelihood Estimation.

    Steps:
        1. Fetch response matrix from attempt_history
        2. Initialize student abilities (θ) and item parameters (a, b)
        3. Alternate between estimating θ and (a, b) until convergence
        4. Write calibrated difficulty/discrimination back to duel_questions_pool

    Args:
        min_responses: minimum attempts per question to include in calibration
        max_iterations: max JML iterations
        learning_rate: gradient descent step size

    Returns:
        dict with calibration summary
    """
    print("[IRT] Starting 2PL Item Response Theory calibration...")

    # Step 1: Fetch response data
    responses = _fetch_response_matrix(min_responses)
    if not responses:
        print("[IRT] Not enough data for calibration.")
        return {"status": "skipped", "reason": "insufficient_data"}

    # Build matrices
    students = sorted(set(r["user_id"] for r in responses))
    items = sorted(set(r["question_id"] for r in responses))

    student_idx = {sid: i for i, sid in enumerate(students)}
    item_idx = {qid: i for i, qid in enumerate(items)}

    n_students = len(students)
    n_items = len(items)

    print(f"[IRT] Response matrix: {n_students} students × {n_items} items, "
          f"{len(responses)} total responses")

    # Response/mask matrices (NaN = unobserved)
    Y = np.full((n_students, n_items), np.nan)
    for r in responses:
        si = student_idx[r["user_id"]]
        qi = item_idx[r["question_id"]]
        Y[si, qi] = 1.0 if r["is_correct"] else 0.0

    # Step 2: Initialize parameters
    # θ: initial ability from proportion correct
    theta = np.zeros(n_students)
    for i in range(n_students):
        observed = Y[i, ~np.isnan(Y[i, :])]
        if len(observed) > 0:
            prop = np.mean(observed)
            prop = np.clip(prop, 0.01, 0.99)
            theta[i] = math.log(prop / (1 - prop))  # logit transform

    # a (discrimination): start at 1.0 for all items
    a = np.ones(n_items)
    # b (difficulty): init from proportion correct (inverted logit)
    b = np.zeros(n_items)
    for j in range(n_items):
        observed = Y[~np.isnan(Y[:, j]), j]
        if len(observed) > 0:
            prop = np.mean(observed)
            prop = np.clip(prop, 0.01, 0.99)
            b[j] = -math.log(prop / (1 - prop))  # harder = higher b

    # Step 3: JML iteration
    mask = ~np.isnan(Y)

    for iteration in range(max_iterations):
        old_b = b.copy()

        # E-step: update θ given (a, b)
        for i in range(n_students):
            obs_mask = mask[i, :]
            if not np.any(obs_mask):
                continue
            y_i = Y[i, obs_mask]
            a_i = a[obs_mask]
            b_i = b[obs_mask]

            p = irt_probability(theta[i], a_i, b_i)
            gradient = np.sum(a_i * (y_i - p))
            theta[i] += learning_rate * gradient

        # M-step: update (a, b) given θ
        for j in range(n_items):
            obs_mask = mask[:, j]
            if not np.any(obs_mask):
                continue
            y_j = Y[obs_mask, j]
            theta_j = theta[obs_mask]

            p = irt_probability(theta_j, a[j], b[j])
            residual = y_j - p

            # Gradient for b (difficulty)
            grad_b = -a[j] * np.sum(residual)
            b[j] += learning_rate * grad_b

            # Gradient for a (discrimination) — with regularization
            grad_a = np.sum(residual * (theta_j - b[j]))
            a[j] += learning_rate * grad_a
            a[j] = np.clip(a[j], 0.1, 5.0)  # bound discrimination

        # Check convergence
        delta = np.max(np.abs(b - old_b))
        if delta < 1e-4:
            print(f"[IRT] Converged at iteration {iteration + 1} (δ={delta:.6f})")
            break

    # Step 4: Write calibrated parameters to DB
    calibrated = 0
    for j, qid in enumerate(items):
        difficulty_float = round(float(b[j]), 4)
        discrimination = round(float(a[j]), 4)
        _update_question_irt(qid, difficulty_float, discrimination)
        calibrated += 1

    summary = {
        "status": "completed",
        "items_calibrated": calibrated,
        "students_in_model": n_students,
        "iterations": iteration + 1 if 'iteration' in dir() else max_iterations,
        "difficulty_range": [round(float(b.min()), 4), round(float(b.max()), 4)],
        "discrimination_range": [round(float(a.min()), 4), round(float(a.max()), 4)],
    }

    print(f"[IRT] Calibration complete: {calibrated} items updated")
    print(f"[IRT] Difficulty range: [{summary['difficulty_range'][0]}, {summary['difficulty_range'][1]}]")
    print(f"[IRT] Discrimination range: [{summary['discrimination_range'][0]}, {summary['discrimination_range'][1]}]")

    return summary


def predict_student_score(theta, question_id):
    """
    Predict the probability of a student with ability θ answering
    a specific question correctly.
    """
    params = _get_question_irt(question_id)
    if not params:
        return 0.5  # no data
    return float(irt_probability(theta, params["discrimination"], params["difficulty"]))


# ─── Database Helpers ──────────────────────────────────────────────────────────

def _fetch_response_matrix(min_responses):
    """Fetch question-level response data from attempt_history."""
    query = """
        SELECT ah.user_id, ah.question_id, ah.is_correct
        FROM attempt_history ah
        WHERE ah.question_id IN (
            SELECT question_id FROM attempt_history
            GROUP BY question_id
            HAVING COUNT(*) >= %s
        )
        ORDER BY ah.user_id, ah.attempted_at
    """
    try:
        with db.telemetry_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (min_responses,))
                columns = [desc[0] for desc in cur.description]
                rows = cur.fetchall()
                return [dict(zip(columns, row)) for row in rows]
    except Exception as e:
        print(f"[IRT] Failed to fetch responses: {e}")
        return []


def _update_question_irt(question_id, difficulty, discrimination):
    """Write IRT parameters back to duel_questions_pool."""
    query = """
        UPDATE duel_questions_pool
        SET irt_difficulty = %s,
            irt_discrimination = %s,
            irt_calibrated_at = NOW()
        WHERE id = %s
    """
    try:
        with db.telemetry_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (difficulty, discrimination, question_id))
    except Exception as e:
        print(f"[IRT] Failed to update question {question_id}: {e}")


def _get_question_irt(question_id):
    """Get IRT parameters for a question."""
    query = """
        SELECT irt_difficulty, irt_discrimination
        FROM duel_questions_pool
        WHERE id = %s
    """
    try:
        with db.telemetry_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (question_id,))
                row = cur.fetchone()
                if row:
                    return {"difficulty": float(row[0]), "discrimination": float(row[1])}
    except Exception:
        pass
    return None


if __name__ == "__main__":
    db.initialize()
    try:
        result = calibrate_items()
        print(f"\nResult: {result}")
    finally:
        db.close()
