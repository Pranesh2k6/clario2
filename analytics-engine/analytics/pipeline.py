"""
Clario Analytics Engine — Pipeline Orchestrator
Runs the full analytics pipeline: extract → compute → recommend.
"""

import sys
from .db import db
from .feature_extraction import extract_user_topic_features, extract_daily_metrics
from .skill_estimation import update_knowledge_profiles
from .recommendation_engine import generate_recommendations


def run_pipeline(user_id=None):
    """
    Execute the full analytics pipeline.

    Steps:
        1. Initialize database connections
        2. Extract features from attempt_history
        3. Compute and update knowledge profiles (skill estimation)
        4. Generate personalized recommendations
        5. Log summary

    Args:
        user_id: Optional UUID string. If provided, runs for a single user.
                 If None, runs for all users with recent activity.
    """
    print("=" * 60)
    print("  Clario Learning Intelligence — Analytics Pipeline")
    print("=" * 60)

    # Step 1: Initialize
    print("\n[1/4] Initializing database connections...")
    db.initialize()

    try:
        # Step 2: Feature extraction
        print("\n[2/4] Extracting features from attempt_history...")
        features = extract_user_topic_features(user_id=user_id)
        print(f"  → Extracted {len(features)} feature rows")

        if not features:
            print("\n⚠️  No attempt data found. Pipeline complete (no-op).")
            return

        # Step 3: Skill estimation → update knowledge profiles
        print("\n[3/4] Computing skill estimations & updating knowledge profiles...")
        updated = update_knowledge_profiles(features)
        print(f"  → Updated {updated} knowledge profile rows")

        # Step 4: Recommendations
        print("\n[4/4] Generating recommendations...")
        # Get unique user_ids from features
        user_ids = list(set(f["user_id"] for f in features))
        if user_id:
            user_ids = [user_id]

        total_recs = 0
        for uid in user_ids:
            recs = generate_recommendations(str(uid))
            total_recs += len(recs)

        print(f"  → Generated {total_recs} total recommendations for {len(user_ids)} users")

        # Summary
        print("\n" + "=" * 60)
        print(f"  Pipeline complete!")
        print(f"  Features extracted:     {len(features)}")
        print(f"  Profiles updated:       {updated}")
        print(f"  Recommendations:        {total_recs}")
        print(f"  Users processed:        {len(user_ids)}")
        print("=" * 60)

    finally:
        db.close()


if __name__ == "__main__":
    # Allow passing a user_id as CLI argument
    uid = sys.argv[1] if len(sys.argv) > 1 else None
    run_pipeline(user_id=uid)
