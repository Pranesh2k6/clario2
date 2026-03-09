"""
Clario Analytics Engine — Dashboard API
FastAPI endpoints serving analytics data for the student dashboard.
Integrates NLG (Ollama Llama 3.1) for human-readable output formatting.
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from .db import db
from .config import config
from .skill_estimation import get_knowledge_vector, get_weak_topics, get_strong_topics
from .trueskill_rating import find_fair_opponents
from .elo_rating import get_rating  # kept for backward compat display rating
from .recommendation_engine import get_active_recommendations, complete_recommendation
from .behavioral_analytics import compute_learning_velocity
from .feature_extraction import extract_user_duel_stats, extract_daily_metrics, extract_duel_performance_signals
from .nlg_formatter import format_insights, format_recommendation, format_duel_insights
from .trueskill_rating import get_match_quality

app = FastAPI(
    title="Clario Analytics API",
    description="Learning Intelligence System — ML-Powered Analytics",
    version="2.0.0",
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
    Comprehensive dashboard with NLG-formatted insights.
    """
    try:
        knowledge = get_knowledge_vector(user_id)
        weak = get_weak_topics(user_id)
        strong = get_strong_topics(user_id)
        rating = get_rating(user_id)
        duel_stats = extract_user_duel_stats(user_id=user_id)
        daily = extract_daily_metrics(user_id=user_id, days=30)
        recommendations = get_active_recommendations(user_id)

        velocity = compute_learning_velocity(daily)

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

        # NLG: generate human-readable insights
        nlg_input = {
            "overall_accuracy": round(overall_accuracy, 4),
            "weak_topics": [{"topic": t.get("topic"), "mastery": t.get("mastery_probability")} for t in weak[:3]],
            "strong_topics": [{"topic": t.get("topic")} for t in strong[:3]],
            "elo_rating": rating["rating"],
            "learning_velocity": velocity,
        }
        nlg_insights = format_insights(nlg_input, context="study_planner")

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
            "nlg_insights": nlg_insights,
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


# ─── NLG Insights ─────────────────────────────────────────────────────────────

@app.get("/api/v1/analytics/insights/{user_id}")
async def get_insights(
    user_id: str,
    context: str = Query(default="study_planner"),
    duel_id: str = Query(default=None),
):
    """
    Get NLG-formatted human-readable insights for a student.
    Context: 'duel_result', 'study_planner', or 'recommendation'.

    For 'duel_result' context, uses the new structured signal extraction
    pipeline to produce teacher-style feedback.
    """
    try:
        # ── Duel result context: use structured signals ──────────────────
        if context == "duel_result":
            signals = extract_duel_performance_signals(user_id, duel_id=duel_id)
            insights = format_duel_insights(signals)
            return {
                "user_id": user_id,
                "context": context,
                "insights": insights,
                "signals": signals,  # expose for frontend debugging
            }

        # ── Other contexts: use legacy pipeline ──────────────────────────
        weak = get_weak_topics(user_id)
        knowledge = get_knowledge_vector(user_id)
        rating = get_rating(user_id)

        all_topics = []
        for v in knowledge.values():
            all_topics.extend(v)

        total = sum(t.get("total_attempts", 0) for t in all_topics)
        correct = sum(t.get("correct_attempts", 0) for t in all_topics)
        accuracy = correct / total if total > 0 else 0

        ml_output = {
            "accuracy": round(accuracy, 4),
            "weak_topics": [{"topic": t.get("topic"), "mastery": t.get("mastery_probability"),
                            "behavior": t.get("behavior_label")} for t in weak[:5]],
            "elo_rating": rating["rating"],
            "overall_mastery": round(
                sum(t.get("mastery_probability", 0) for t in all_topics) / len(all_topics), 4
            ) if all_topics else 0,
        }

        insights = format_insights(ml_output, context=context)
        return {"user_id": user_id, "context": context, "insights": insights}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/analytics/nlg/format")
async def nlg_format(data: dict):
    """
    Direct NLG formatting endpoint. Pass raw ML metrics
    and get back human-readable text.
    """
    context = data.get("context", "study_planner")
    ml_output = data.get("ml_output", {})
    insights = format_insights(ml_output, context=context)
    return {"insights": insights}


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


# ─── TrueSkill & Matchmaking ─────────────────────────────────────────────────

@app.get("/api/v1/analytics/rating/{user_id}")
async def get_skill_rating(user_id: str):
    """Get skill rating for a student (TrueSkill display rating)."""
    return get_rating(user_id)


@app.get("/api/v1/analytics/matchmaking/{user_id}")
async def get_matchmaking(
    user_id: str,
    limit: int = Query(default=10, ge=1, le=50),
    min_quality: float = Query(default=0.3, ge=0.0, le=1.0),
):
    """Find fair opponents using TrueSkill match quality."""
    return find_fair_opponents(user_id, limit=limit, min_quality=min_quality)


@app.get("/api/v1/analytics/match-quality/{player1_id}/{player2_id}")
async def match_quality(player1_id: str, player2_id: str):
    """Get TrueSkill match quality between two players (0-1)."""
    quality = get_match_quality(player1_id, player2_id)
    return {"player1": player1_id, "player2": player2_id, "quality": quality}


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
    return {"status": "ok", "service": "analytics-engine", "version": "2.0.0"}


if __name__ == "__main__":
    uvicorn.run(
        "analytics.api:app",
        host=config.API_HOST,
        port=config.API_PORT,
        reload=True,
    )

