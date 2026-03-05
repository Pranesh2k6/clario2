"""
Clario Analytics Engine — Dashboard API
FastAPI endpoints serving analytics data for the student dashboard.
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from .db import db
from .config import config
from .skill_estimation import get_knowledge_vector, get_weak_topics, get_strong_topics
from .elo_rating import get_rating, find_fair_opponents
from .recommendation_engine import get_active_recommendations, complete_recommendation
from .behavioral_analytics import compute_learning_velocity
from .feature_extraction import extract_user_duel_stats, extract_daily_metrics

app = FastAPI(
    title="Clario Analytics API",
    description="Learning Intelligence System — Analytics Dashboard Endpoints",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    db.initialize()


@app.on_event("shutdown")
async def shutdown():
    db.close()


# ─── Student Dashboard ────────────────────────────────────────────────────────

@app.get("/api/v1/analytics/dashboard/{user_id}")
async def get_dashboard(user_id: str):
    """
    Comprehensive dashboard data for a student.

    Returns:
        - Knowledge vector (mastery per topic)
        - Weak and strong topics
        - Duel statistics and ELO rating
        - Daily metrics for timeline charts
        - Learning velocity
        - Active recommendations
    """
    try:
        knowledge = get_knowledge_vector(user_id)
        weak = get_weak_topics(user_id)
        strong = get_strong_topics(user_id)
        rating = get_rating(user_id)
        duel_stats = extract_user_duel_stats(user_id=user_id)
        daily = extract_daily_metrics(user_id=user_id, days=30)
        recommendations = get_active_recommendations(user_id)

        # Compute learning velocity from daily metrics
        velocity = compute_learning_velocity(daily)

        # Compute overall accuracy across all topics
        all_topics = []
        for subject_topics in knowledge.values():
            all_topics.extend(subject_topics)

        total_attempts = sum(t.get("total_attempts", 0) for t in all_topics)
        correct_attempts = sum(t.get("correct_attempts", 0) for t in all_topics)
        overall_accuracy = (
            correct_attempts / total_attempts if total_attempts > 0 else 0.0
        )
        avg_time = (
            sum(t.get("avg_time_taken_ms", 0) for t in all_topics) / len(all_topics)
            if all_topics else 0.0
        )

        return {
            "user_id": user_id,
            "overview": {
                "overall_accuracy": round(overall_accuracy, 4),
                "total_attempts": total_attempts,
                "average_response_time_ms": round(avg_time, 2),
                "learning_velocity": velocity,
                "elo_rating": rating["rating"],
            },
            "knowledge_vector": knowledge,
            "weak_topics": weak,
            "strong_topics": strong,
            "duel_stats": duel_stats[0] if duel_stats else {
                "total_duels": 0, "wins": 0, "losses": 0,
                "win_rate": 0.0, "avg_duel_accuracy": 0.0,
            },
            "skill_rating": rating,
            "daily_metrics": daily,
            "recommendations": recommendations,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Knowledge Profile ────────────────────────────────────────────────────────

@app.get("/api/v1/analytics/knowledge/{user_id}")
async def get_knowledge(user_id: str):
    """Get the full knowledge vector (radar chart data) for a student."""
    return get_knowledge_vector(user_id)


@app.get("/api/v1/analytics/weak-topics/{user_id}")
async def get_weak(user_id: str):
    """Get weak topics for a student."""
    return get_weak_topics(user_id)


@app.get("/api/v1/analytics/strong-topics/{user_id}")
async def get_strong(user_id: str):
    """Get strong topics for a student."""
    return get_strong_topics(user_id)


# ─── ELO & Matchmaking ────────────────────────────────────────────────────────

@app.get("/api/v1/analytics/rating/{user_id}")
async def get_skill_rating(user_id: str):
    """Get ELO skill rating for a student."""
    return get_rating(user_id)


@app.get("/api/v1/analytics/matchmaking/{user_id}")
async def get_matchmaking(
    user_id: str,
    rating_range: int = Query(default=100, ge=50, le=500),
    limit: int = Query(default=10, ge=1, le=50),
):
    """Find fair opponents within a rating range."""
    return find_fair_opponents(user_id, rating_range=rating_range, limit=limit)


# ─── Recommendations ──────────────────────────────────────────────────────────

@app.get("/api/v1/analytics/recommendations/{user_id}")
async def get_recommendations(user_id: str):
    """Get active recommendations for a student."""
    return get_active_recommendations(user_id)


@app.post("/api/v1/analytics/recommendations/{recommendation_id}/complete")
async def mark_recommendation_complete(recommendation_id: str):
    """Mark a recommendation as completed."""
    complete_recommendation(recommendation_id)
    return {"status": "completed", "id": recommendation_id}


# ─── Daily Metrics (Timeline) ─────────────────────────────────────────────────

@app.get("/api/v1/analytics/daily-metrics/{user_id}")
async def get_daily(
    user_id: str,
    days: int = Query(default=30, ge=1, le=365),
):
    """Get daily learning metrics for timeline charts."""
    return extract_daily_metrics(user_id=user_id, days=days)


# ─── Health Check ─────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "analytics-engine"}


if __name__ == "__main__":
    uvicorn.run(
        "analytics.api:app",
        host=config.API_HOST,
        port=config.API_PORT,
        reload=True,
    )
