"""
Clario Analytics Engine — Pipeline Orchestrator
Runs the full analytics pipeline: extract → BKT → IRT → cluster → recommend.
"""

import sys
from .db import db
from .feature_extraction import extract_user_topic_features, extract_daily_metrics
from .skill_estimation import update_knowledge_profiles
from .bkt_engine import BKTEngine
from .irt_calibration import calibrate_items
from .clustering import run_clustering
from .mab_recommender import MABRecommender
from .recommendation_engine import generate_recommendations


def run_pipeline(user_id=None):
    """
    Execute the full analytics pipeline.

    Steps:
        1. Initialize database connections
        2. Extract features from attempt_history
        3. Compute and update knowledge profiles (BKT + rule-based)
        4. Run IRT calibration on question pool (batch)
        5. Run K-Means behavioral clustering
        6. Generate personalized recommendations (MAB)
        7. Log summary

    Args:
        user_id: Optional UUID string. If provided, runs for a single user.
                 If None, runs for all users with recent activity.
    """
    print("=" * 60)
    print("  Clario Learning Intelligence — Analytics Pipeline")
    print("=" * 60)

    # Step 1: Initialize
    print("\n[1/6] Initializing database connections...")
    db.initialize()

    try:
        # Step 2: Feature extraction
        print("\n[2/6] Extracting features from attempt_history...")
        features = extract_user_topic_features(user_id=user_id)
        print(f"  → Extracted {len(features)} feature rows")

        if not features:
            print("\n⚠️  No attempt data found. Pipeline complete (no-op).")
            return

        # Step 3: Skill estimation → update knowledge profiles
        print("\n[3/6] Computing skill estimations & updating knowledge profiles...")
        updated = update_knowledge_profiles(features)
        print(f"  → Updated {updated} knowledge profile rows")

        # Step 4: IRT Calibration (batch — runs on all questions)
        print("\n[4/6] Running IRT calibration on question pool...")
        irt_result = calibrate_items(min_responses=10)
        print(f"  → IRT: {irt_result.get('status', 'unknown')}")

        # Step 5: Behavioral Clustering
        print("\n[5/6] Running K-Means behavioral clustering...")
        cluster_result = run_clustering()
        print(f"  → Clustering: {cluster_result.get('status', 'unknown')}")

        # Step 6: Recommendations (MAB)
        print("\n[6/6] Generating MAB recommendations...")
        user_ids = list(set(f["user_id"] for f in features))
        if user_id:
            user_ids = [user_id]

        total_recs = 0
        mab = MABRecommender()
        for uid in user_ids:
            # Use existing rule-based as fallback, MAB as primary
            try:
                from .skill_estimation import get_weak_topics
                weak = get_weak_topics(str(uid))
                if weak:
                    recs = mab.recommend(str(uid), weak, archetype="developing", n=5)
                    total_recs += len(recs)
                else:
                    recs = generate_recommendations(str(uid))
                    total_recs += len(recs)
            except Exception as e:
                print(f"  ⚠️ Recommendation error for {str(uid)[:8]}…: {e}")
                recs = generate_recommendations(str(uid))
                total_recs += len(recs)

        print(f"  → Generated {total_recs} total recommendations for {len(user_ids)} users")

        # Summary
        print("\n" + "=" * 60)
        print(f"  Pipeline complete!")
        print(f"  Features extracted:     {len(features)}")
        print(f"  Profiles updated:       {updated}")
        print(f"  IRT status:             {irt_result.get('status')}")
        print(f"  Clustering status:      {cluster_result.get('status')}")
        print(f"  Recommendations:        {total_recs}")
        print(f"  Users processed:        {len(user_ids)}")
        print("=" * 60)

    finally:
        db.close()


if __name__ == "__main__":
    # Allow passing a user_id as CLI argument
    uid = sys.argv[1] if len(sys.argv) > 1 else None
    run_pipeline(user_id=uid)

