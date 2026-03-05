# Analytics Engine — Clario Learning Intelligence System

A Python microservice that processes learning events and generates student analytics, knowledge profiles, skill ratings, and personalized recommendations.

## Architecture

```
Event Stream (Redis Streams / PostgreSQL polling)
        ↓
  Feature Extraction
        ↓
  Analytics Engine (Rule-Based Skill Estimation)
        ↓
  Recommendation Engine
        ↓
  Writes to: student_knowledge_profiles
             student_skill_ratings
             learning_recommendations
             daily_learning_metrics
```

## Setup

```bash
cd analytics-engine
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # configure database URLs
```

## Running

```bash
# Run the analytics pipeline (one-shot computation)
python -m analytics.pipeline

# Run the API server (serves dashboard data)
python -m analytics.api

# Run the synthetic data simulator
python -m simulator.generate
```

## Project Structure

```
analytics-engine/
├── analytics/
│   ├── __init__.py
│   ├── config.py           # Environment and DB configuration
│   ├── db.py               # Database connection management
│   ├── feature_extraction.py  # Raw data → computed features
│   ├── skill_estimation.py    # Rule-based mastery probability
│   ├── behavioral_analytics.py # Speed/accuracy pattern detection
│   ├── elo_rating.py          # ELO duel skill rating system
│   ├── recommendation_engine.py # Rule-based recommendations
│   ├── pipeline.py            # Orchestrates the full pipeline
│   └── api.py                 # FastAPI endpoints for dashboard
├── simulator/
│   ├── __init__.py
│   ├── archetypes.py       # Student archetype definitions
│   └── generate.py         # Synthetic data generation
├── requirements.txt
├── .env.example
└── README.md
```
