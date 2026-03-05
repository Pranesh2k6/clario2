"""
Clario Analytics Engine — Configuration
Loads environment variables and provides typed config access.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Central configuration for the Analytics Engine."""

    # ─── Database URLs ─────────────────────────────────────────────────────
    PRIMARY_DATABASE_URL = os.getenv(
        "PRIMARY_DATABASE_URL",
        "postgresql://user:password@localhost:5432/clario_primary"
    )
    TELEMETRY_DATABASE_URL = os.getenv(
        "TELEMETRY_DATABASE_URL",
        "postgresql://user:password@localhost:5432/clario_telemetry"
    )
    TIMESCALE_DATABASE_URL = os.getenv(
        "TIMESCALE_DATABASE_URL",
        "postgresql://user:password@localhost:5433/clario_timescale"
    )
    CLICKHOUSE_HOST = os.getenv("CLICKHOUSE_HOST", "localhost")
    CLICKHOUSE_PORT = int(os.getenv("CLICKHOUSE_PORT", "9000"))
    CLICKHOUSE_DATABASE = os.getenv("CLICKHOUSE_DATABASE", "clario_analytics")

    # ─── Redis ─────────────────────────────────────────────────────────────
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # ─── Analytics Thresholds ──────────────────────────────────────────────
    MIN_ATTEMPTS_THRESHOLD = int(os.getenv("MIN_ATTEMPTS_THRESHOLD", "10"))
    WEAK_TOPIC_ACCURACY_THRESHOLD = float(os.getenv("WEAK_TOPIC_ACCURACY_THRESHOLD", "0.5"))
    STRONG_TOPIC_ACCURACY_THRESHOLD = float(os.getenv("STRONG_TOPIC_ACCURACY_THRESHOLD", "0.8"))

    # ─── ELO / TrueSkill ─────────────────────────────────────────────────────
    ELO_K_FACTOR = int(os.getenv("ELO_K_FACTOR", "32"))
    TRUESKILL_MU = float(os.getenv("TRUESKILL_MU", "1200.0"))
    TRUESKILL_SIGMA = float(os.getenv("TRUESKILL_SIGMA", "400.0"))

    # ─── Ollama (NLG Formatting) ──────────────────────────────────────────
    OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")

    # ─── API ───────────────────────────────────────────────────────────────
    API_HOST = os.getenv("API_HOST", "0.0.0.0")
    API_PORT = int(os.getenv("API_PORT", "8000"))


config = Config()
