"""
Clario Analytics Engine — Database Connection Manager
Manages connection pools for Primary, Telemetry, and TimescaleDB clusters.
"""

import psycopg2
from psycopg2 import pool
from contextlib import contextmanager
from .config import config


class DatabaseManager:
    """Manages PostgreSQL connection pools for all database clusters."""

    def __init__(self):
        self._primary_pool = None
        self._telemetry_pool = None
        self._timescale_pool = None

    def initialize(self):
        """Create connection pools for all clusters."""
        print("[DB] Initializing connection pools...")

        self._primary_pool = pool.ThreadedConnectionPool(
            minconn=2,
            maxconn=10,
            dsn=config.PRIMARY_DATABASE_URL
        )
        print(f"  ✅ Primary cluster connected")

        self._telemetry_pool = pool.ThreadedConnectionPool(
            minconn=2,
            maxconn=10,
            dsn=config.TELEMETRY_DATABASE_URL
        )
        print(f"  ✅ Telemetry cluster connected")

        try:
            self._timescale_pool = pool.ThreadedConnectionPool(
                minconn=1,
                maxconn=5,
                dsn=config.TIMESCALE_DATABASE_URL
            )
            print(f"  ✅ TimescaleDB connected")
        except Exception as e:
            print(f"  ⚠️  TimescaleDB not available (will use fallback): {e}")
            self._timescale_pool = None

    def close(self):
        """Close all connection pools."""
        for pool_obj in [self._primary_pool, self._telemetry_pool, self._timescale_pool]:
            if pool_obj:
                pool_obj.closeall()
        print("[DB] All connection pools closed.")

    @contextmanager
    def primary_conn(self):
        """Get a connection from the Primary cluster pool."""
        conn = self._primary_pool.getconn()
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            self._primary_pool.putconn(conn)

    @contextmanager
    def telemetry_conn(self):
        """Get a connection from the Telemetry cluster pool."""
        conn = self._telemetry_pool.getconn()
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            self._telemetry_pool.putconn(conn)

    @contextmanager
    def timescale_conn(self):
        """Get a connection from the TimescaleDB pool (falls back to telemetry)."""
        target_pool = self._timescale_pool or self._telemetry_pool
        conn = target_pool.getconn()
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            target_pool.putconn(conn)


# Singleton instance
db = DatabaseManager()
