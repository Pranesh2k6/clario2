"""
Clario Analytics Engine — K-Means Behavioral Clustering
Dynamically identifies student learning archetypes by clustering
multi-dimensional behavioral vectors instead of hardcoded thresholds.

Features per student:
    - Average accuracy (overall)
    - Average response time (ms)
    - BKT mastery (mean across topics)
    - Time-of-day preference (encoded)
    - Consistency score (stdev of accuracy across topics)
"""

import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from .config import config
from .db import db


# ── Archetype label mapping (assigned after clustering) ───────────────────────
# After K-Means runs, each cluster centroid is analyzed and mapped to a
# human-readable archetype label based on the centroid's feature values.
ARCHETYPE_LABELS = [
    "mastery",        # high accuracy, fast, high mastery
    "careful",        # high accuracy, slow, high mastery
    "developing",     # medium accuracy, medium speed
    "guessing",       # low accuracy, fast
    "struggling",     # low accuracy, slow
]

N_CLUSTERS = 5


def run_clustering():
    """
    Run K-Means clustering on student behavioral features.

    Steps:
        1. Extract feature vectors from student_knowledge_profiles
        2. Standardize features
        3. Run K-Means with k=5
        4. Map cluster centroids to archetype labels
        5. Write assigned labels back to the database

    Returns:
        dict with clustering summary
    """
    print("[Clustering] Starting K-Means behavioral clustering...")

    # Step 1: Extract features
    features, user_ids = _extract_features()
    if len(features) < N_CLUSTERS:
        print(f"[Clustering] Only {len(features)} students — need at least {N_CLUSTERS}.")
        return {"status": "skipped", "reason": "insufficient_students"}

    X = np.array(features)
    print(f"[Clustering] Feature matrix: {X.shape[0]} students × {X.shape[1]} features")

    # Step 2: Standardize
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Step 3: K-Means
    kmeans = KMeans(n_clusters=N_CLUSTERS, random_state=42, n_init=10, max_iter=300)
    labels = kmeans.fit_predict(X_scaled)

    # Step 4: Map clusters to archetypes based on centroids
    # Inverse-transform centroids to interpret in original scale
    centroids = scaler.inverse_transform(kmeans.cluster_centers_)
    cluster_map = _map_centroids_to_archetypes(centroids)

    # Step 5: Write labels back
    updated = 0
    for i, uid in enumerate(user_ids):
        cluster_id = labels[i]
        archetype = cluster_map.get(cluster_id, "developing")
        _update_behavior_label(uid, archetype)
        updated += 1

    summary = {
        "status": "completed",
        "students_clustered": updated,
        "cluster_distribution": {},
    }

    for cluster_id in range(N_CLUSTERS):
        label = cluster_map.get(cluster_id, f"cluster_{cluster_id}")
        count = int(np.sum(labels == cluster_id))
        summary["cluster_distribution"][label] = count
        print(f"[Clustering]   {label}: {count} students")

    print(f"[Clustering] Complete: {updated} students classified")
    return summary


def _extract_features():
    """Extract behavioral feature vectors per student."""
    query = """
        SELECT user_id,
               AVG(mastery_probability) AS avg_mastery,
               AVG(avg_time_taken_ms) AS avg_time,
               SUM(total_attempts) AS total_attempts,
               SUM(correct_attempts) AS correct_attempts,
               STDDEV(mastery_probability) AS mastery_stdev,
               COUNT(*) AS topic_count
        FROM student_knowledge_profiles
        WHERE total_attempts >= %s
        GROUP BY user_id
        HAVING COUNT(*) >= 3
    """
    features = []
    user_ids = []

    try:
        with db.telemetry_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (config.MIN_ATTEMPTS_THRESHOLD,))
                rows = cur.fetchall()

                for row in rows:
                    uid = row[0]
                    avg_mastery = float(row[1] or 0)
                    avg_time = float(row[2] or 0)
                    total = int(row[3] or 0)
                    correct = int(row[4] or 0)
                    mastery_std = float(row[5] or 0)
                    topic_count = int(row[6] or 0)

                    accuracy = correct / total if total > 0 else 0

                    features.append([
                        accuracy,
                        avg_time / 1000.0,   # convert to seconds for scale
                        avg_mastery,
                        mastery_std,
                        topic_count,
                    ])
                    user_ids.append(uid)

    except Exception as e:
        print(f"[Clustering] Feature extraction error: {e}")

    return features, user_ids


def _map_centroids_to_archetypes(centroids):
    """
    Map K-Means clusters to human-readable labels based on centroid features.

    Feature order: [accuracy, avg_time_sec, avg_mastery, mastery_stdev, topic_count]
    """
    cluster_map = {}
    assigned = set()

    # Sort by a heuristic to assign labels deterministically
    # Rank by mastery (index 2) — highest mastery = "mastery", etc.
    rankings = []
    for i, c in enumerate(centroids):
        accuracy, avg_time, avg_mastery, stdev, topics = c
        rankings.append((i, accuracy, avg_time, avg_mastery))

    # Assign archetypes based on feature combinations
    for cluster_id, acc, time_s, mastery in sorted(rankings, key=lambda x: -x[3]):
        if "mastery" not in assigned and mastery > 0.7 and time_s < 12:
            cluster_map[cluster_id] = "mastery"
            assigned.add("mastery")
        elif "careful" not in assigned and mastery > 0.6 and time_s >= 12:
            cluster_map[cluster_id] = "careful"
            assigned.add("careful")
        elif "developing" not in assigned and 0.35 <= mastery <= 0.7:
            cluster_map[cluster_id] = "developing"
            assigned.add("developing")
        elif "guessing" not in assigned and mastery < 0.35 and time_s < 10:
            cluster_map[cluster_id] = "guessing"
            assigned.add("guessing")
        elif "struggling" not in assigned and mastery < 0.4:
            cluster_map[cluster_id] = "struggling"
            assigned.add("struggling")
        else:
            # Fallback for any unmatched cluster
            remaining = [l for l in ARCHETYPE_LABELS if l not in assigned]
            if remaining:
                cluster_map[cluster_id] = remaining[0]
                assigned.add(remaining[0])
            else:
                cluster_map[cluster_id] = "developing"

    return cluster_map


def _update_behavior_label(user_id, label):
    """Write the cluster-assigned behavior label to all profiles for a user."""
    query = """
        UPDATE student_knowledge_profiles
        SET behavior_label = %s, updated_at = NOW()
        WHERE user_id = %s
    """
    try:
        with db.telemetry_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (label, str(user_id)))
    except Exception as e:
        print(f"[Clustering] Failed to update label for {user_id}: {e}")


if __name__ == "__main__":
    db.initialize()
    try:
        result = run_clustering()
        print(f"\nResult: {result}")
    finally:
        db.close()
