"""
Clario Analytics Engine — Behavioral Analytics
Detects learning behavior patterns from performance data.
"""


def classify_behavior(accuracy, avg_time_ms):
    """
    Classify a student's learning behavior based on speed vs accuracy.

    Categories:
        - 'guessing':  fast + inaccurate (< 8s avg, < 50% accuracy)
        - 'careful':   slow + accurate   (> 15s avg, > 80% accuracy)
        - 'mastery':   fast + accurate   (< 8s avg, > 80% accuracy)
        - 'struggling': slow + inaccurate (> 15s avg, < 50% accuracy)
        - 'developing': everything else

    Args:
        accuracy: float 0.0–1.0
        avg_time_ms: float in milliseconds

    Returns:
        str: behavior label
    """
    FAST_MS = 8000
    SLOW_MS = 15000
    LOW_ACC = 0.5
    HIGH_ACC = 0.8

    if avg_time_ms < FAST_MS and accuracy < LOW_ACC:
        return "guessing"
    elif avg_time_ms > SLOW_MS and accuracy >= HIGH_ACC:
        return "careful"
    elif avg_time_ms < FAST_MS and accuracy >= HIGH_ACC:
        return "mastery"
    elif avg_time_ms > SLOW_MS and accuracy < LOW_ACC:
        return "struggling"
    else:
        return "developing"


def analyze_stress_performance(practice_accuracy, duel_accuracy):
    """
    Compare practice accuracy vs duel accuracy to measure performance under pressure.

    Args:
        practice_accuracy: float 0.0–1.0
        duel_accuracy: float 0.0–1.0

    Returns:
        dict with stress analysis:
        {
            "practice_accuracy": 0.82,
            "duel_accuracy": 0.65,
            "stress_gap": -0.17,
            "stress_label": "pressure_sensitive"
        }
    """
    gap = duel_accuracy - practice_accuracy

    if gap < -0.15:
        label = "pressure_sensitive"
    elif gap > 0.10:
        label = "pressure_performer"
    else:
        label = "pressure_neutral"

    return {
        "practice_accuracy": round(practice_accuracy, 4),
        "duel_accuracy": round(duel_accuracy, 4),
        "stress_gap": round(gap, 4),
        "stress_label": label,
    }


def compute_learning_velocity(daily_metrics):
    """
    Compute the learning velocity: the rate of accuracy improvement over time.

    Uses a simple linear regression slope on daily accuracy values.

    Args:
        daily_metrics: list of dicts with keys "metric_date" and "accuracy",
                       sorted by date ascending.

    Returns:
        float: slope per day (positive = improving, negative = declining)
    """
    if len(daily_metrics) < 2:
        return 0.0

    n = len(daily_metrics)
    x_vals = list(range(n))  # day indices
    y_vals = [float(m.get("accuracy", 0)) for m in daily_metrics]

    x_mean = sum(x_vals) / n
    y_mean = sum(y_vals) / n

    numerator = sum((x - x_mean) * (y - y_mean) for x, y in zip(x_vals, y_vals))
    denominator = sum((x - x_mean) ** 2 for x in x_vals)

    if denominator == 0:
        return 0.0

    slope = numerator / denominator
    return round(slope, 6)
