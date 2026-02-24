-- =============================================================================
-- Migration 001: Primary Cluster — Users, Mastery Snapshot, XP Ledger
-- Clario Database Architecture
-- Date: 2026-02-23
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- For gen_random_uuid()

-- =============================================================================
-- 1. CORE USER IDENTITY
-- =============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast email lookups (login flow)
CREATE INDEX idx_users_email ON users (email);

-- =============================================================================
-- 2. MASTER PROGRESS SNAPSHOT
-- Updated asynchronously via trigger on xp_ledger_events.
-- Application code must NEVER write to this table directly.
-- =============================================================================
CREATE TABLE user_mastery_snapshot (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_level INT NOT NULL DEFAULT 1,
    cached_total_xp BIGINT NOT NULL DEFAULT 0,
    concept_debt_score FLOAT NOT NULL DEFAULT 0.0,
    last_recalculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 3. XP LEDGER (IMMUTABLE, PARTITIONED BY MONTH)
-- This is the ACID-safe, append-only financial ledger for all XP movement.
-- =============================================================================
CREATE TABLE xp_ledger_events (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    amount INT NOT NULL,                          -- +50, -10, etc.
    source_type VARCHAR(50) NOT NULL,             -- 'quiz_win', 'duel_win', 'chapter_complete', 'penalty'
    source_id UUID NOT NULL,                      -- FK to the exact quiz/duel/chapter that caused this
    idempotency_key VARCHAR(255) NOT NULL,         -- Prevents double-awarding
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Unique constraint on idempotency_key within partitions
-- (Global unique across partitions requires a unique index on the partition key + idempotency_key)
CREATE UNIQUE INDEX idx_xp_ledger_idempotency
    ON xp_ledger_events (idempotency_key, created_at);

-- Index for fast per-user XP aggregation
CREATE INDEX idx_xp_ledger_user_id ON xp_ledger_events (user_id, created_at DESC);

-- =============================================================================
-- 4. INITIAL PARTITIONS (pg_partman will automate future ones)
-- Creating 6 months of partitions ahead of time for safety.
-- =============================================================================
CREATE TABLE xp_ledger_events_y2026m01 PARTITION OF xp_ledger_events
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE xp_ledger_events_y2026m02 PARTITION OF xp_ledger_events
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE xp_ledger_events_y2026m03 PARTITION OF xp_ledger_events
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE xp_ledger_events_y2026m04 PARTITION OF xp_ledger_events
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE xp_ledger_events_y2026m05 PARTITION OF xp_ledger_events
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE xp_ledger_events_y2026m06 PARTITION OF xp_ledger_events
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE xp_ledger_events_y2026m07 PARTITION OF xp_ledger_events
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE xp_ledger_events_y2026m08 PARTITION OF xp_ledger_events
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

-- =============================================================================
-- 5. XP SNAPSHOT TRIGGER
-- Automatically updates cached_total_xp in user_mastery_snapshot
-- every time a new XP event is safely committed.
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_update_xp_snapshot()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_mastery_snapshot (user_id, cached_total_xp, last_recalculated_at)
    VALUES (NEW.user_id, NEW.amount, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
        cached_total_xp = user_mastery_snapshot.cached_total_xp + EXCLUDED.cached_total_xp,
        last_recalculated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_xp_ledger_snapshot
    AFTER INSERT ON xp_ledger_events
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_xp_snapshot();

-- =============================================================================
-- 6. AUTO-UPDATE updated_at ON USERS TABLE
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION fn_set_updated_at();
