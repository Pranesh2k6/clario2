"""
Clario Analytics Engine — MLFlow Experiment Tracking
Wraps pipeline steps with MLFlow logging for model versioning,
parameter tracking, and metric history.
"""

import time
import mlflow
from .config import config


MLFLOW_URI = "http://localhost:5001"
EXPERIMENT_NAME = "clario-analytics"


def init_tracking():
    """Initialize MLFlow tracking."""
    try:
        mlflow.set_tracking_uri(MLFLOW_URI)
        mlflow.set_experiment(EXPERIMENT_NAME)
        print(f"[MLFlow] Tracking URI: {MLFLOW_URI}, Experiment: {EXPERIMENT_NAME}")
    except Exception as e:
        print(f"[MLFlow] Init warning (non-fatal): {e}")


def log_irt_calibration(result):
    """Log IRT calibration results to MLFlow."""
    try:
        with mlflow.start_run(run_name="irt_calibration"):
            mlflow.log_param("algorithm", "2PL_IRT_JML")
            mlflow.log_metric("items_calibrated", result.get("items_calibrated", 0))
            mlflow.log_metric("students_in_model", result.get("students_in_model", 0))
            mlflow.log_metric("iterations", result.get("iterations", 0))

            diff_range = result.get("difficulty_range", [0, 0])
            mlflow.log_metric("difficulty_min", diff_range[0])
            mlflow.log_metric("difficulty_max", diff_range[1])

            disc_range = result.get("discrimination_range", [0, 0])
            mlflow.log_metric("discrimination_min", disc_range[0])
            mlflow.log_metric("discrimination_max", disc_range[1])

            mlflow.set_tag("status", result.get("status", "unknown"))
            print(f"[MLFlow] Logged IRT calibration run")
    except Exception as e:
        print(f"[MLFlow] IRT logging failed (non-fatal): {e}")


def log_clustering(result):
    """Log K-Means clustering results to MLFlow."""
    try:
        with mlflow.start_run(run_name="behavioral_clustering"):
            mlflow.log_param("algorithm", "K-Means")
            mlflow.log_param("n_clusters", 5)
            mlflow.log_metric("students_clustered", result.get("students_clustered", 0))

            dist = result.get("cluster_distribution", {})
            for label, count in dist.items():
                mlflow.log_metric(f"cluster_{label}", count)

            mlflow.set_tag("status", result.get("status", "unknown"))
            print(f"[MLFlow] Logged clustering run")
    except Exception as e:
        print(f"[MLFlow] Clustering logging failed (non-fatal): {e}")


def log_pipeline_run(summary):
    """Log overall pipeline execution metrics."""
    try:
        with mlflow.start_run(run_name="pipeline_full"):
            mlflow.log_metric("features_extracted", summary.get("features", 0))
            mlflow.log_metric("profiles_updated", summary.get("profiles", 0))
            mlflow.log_metric("recommendations_generated", summary.get("recommendations", 0))
            mlflow.log_metric("users_processed", summary.get("users", 0))
            mlflow.log_metric("duration_seconds", summary.get("duration_s", 0))

            mlflow.set_tag("irt_status", summary.get("irt_status", "unknown"))
            mlflow.set_tag("clustering_status", summary.get("clustering_status", "unknown"))
            print(f"[MLFlow] Logged pipeline run")
    except Exception as e:
        print(f"[MLFlow] Pipeline logging failed (non-fatal): {e}")
