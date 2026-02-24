-- =============================================================================
-- Migration 004: Telemetry Cluster — Attempt History & Interaction Logs
-- Clario Database Architecture
-- Date: 2026-02-23
--
-- IMPORTANT: This migration targets the TELEMETRY PostgreSQL cluster,
-- which is physically separate from the Primary cluster.
-- These tables must NEVER share I/O with transactional user/XP data.
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. ATTEMPT HISTORY (Partitioned by Month)
-- Every single question attempt across the entire platform.
-- =============================================================================
CREATE TABLE attempt_history (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,                        -- No FK (users live on Primary DB)
    question_id UUID NOT NULL,                    -- No FK (questions live on Primary DB)
    is_correct BOOLEAN NOT NULL,
    selected_answer_index INT,
    time_taken_ms INT NOT NULL,
    difficulty_at_time FLOAT,                     -- Snapshot of question difficulty when attempted
    context VARCHAR(50),                          -- 'quiz', 'duel', 'practice', 'review'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Per-user attempt lookups (for progress dashboards)
CREATE INDEX idx_attempt_user ON attempt_history (user_id, created_at DESC);
-- Per-question analytics (for difficulty calibration)
CREATE INDEX idx_attempt_question ON attempt_history (question_id, created_at DESC);

-- Initial partitions
CREATE TABLE attempt_history_y2026m01 PARTITION OF attempt_history
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE attempt_history_y2026m02 PARTITION OF attempt_history
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE attempt_history_y2026m03 PARTITION OF attempt_history
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE attempt_history_y2026m04 PARTITION OF attempt_history
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE attempt_history_y2026m05 PARTITION OF attempt_history
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE attempt_history_y2026m06 PARTITION OF attempt_history
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE attempt_history_y2026m07 PARTITION OF attempt_history
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE attempt_history_y2026m08 PARTITION OF attempt_history
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

-- =============================================================================
-- 2. INTERACTION LOGS (Partitioned by Month)
-- Fine-grained user interaction telemetry for the Adaptive Engine.
-- Captures hint usage, video pauses, slider adjustments, etc.
-- =============================================================================
CREATE TABLE interaction_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    session_id UUID NOT NULL,                     -- Groups interactions within a single learning session
    event_type VARCHAR(50) NOT NULL,
        -- 'hint_opened', 'hint_closed', 'video_paused', 'video_seeked',
        -- 'slider_adjusted', 'note_highlighted', 'concept_link_clicked'
    payload JSONB NOT NULL,
        -- Example: {"hint_index": 2, "time_spent_ms": 4500, "question_id": "uuid"}
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Per-user session reconstruction
CREATE INDEX idx_interaction_user_session ON interaction_logs (user_id, session_id, created_at);
-- Per-event-type analytics
CREATE INDEX idx_interaction_event_type ON interaction_logs (event_type, created_at DESC);

-- Initial partitions
CREATE TABLE interaction_logs_y2026m01 PARTITION OF interaction_logs
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE interaction_logs_y2026m02 PARTITION OF interaction_logs
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE interaction_logs_y2026m03 PARTITION OF interaction_logs
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE interaction_logs_y2026m04 PARTITION OF interaction_logs
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE interaction_logs_y2026m05 PARTITION OF interaction_logs
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE interaction_logs_y2026m06 PARTITION OF interaction_logs
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE interaction_logs_y2026m07 PARTITION OF interaction_logs
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE interaction_logs_y2026m08 PARTITION OF interaction_logs
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

-- =============================================================================
-- 3. ADAPTIVE ENGINE SIGNALS (Partitioned by Month)
-- Computed signals derived from raw telemetry for the adaptive difficulty engine.
-- These are written by background workers, not directly by user actions.
-- =============================================================================
CREATE TABLE adaptive_signals (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    concept_id UUID NOT NULL,
    signal_type VARCHAR(50) NOT NULL,
        -- 'difficulty_adjustment', 'mastery_milestone', 'fatigue_detected',
        -- 'spaced_repetition_due', 'debt_increase', 'debt_decrease'
    signal_value FLOAT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE INDEX idx_adaptive_user_concept ON adaptive_signals (user_id, concept_id, created_at DESC);

-- Initial partitions
CREATE TABLE adaptive_signals_y2026m01 PARTITION OF adaptive_signals
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE adaptive_signals_y2026m02 PARTITION OF adaptive_signals
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE adaptive_signals_y2026m03 PARTITION OF adaptive_signals
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE adaptive_signals_y2026m04 PARTITION OF adaptive_signals
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE adaptive_signals_y2026m05 PARTITION OF adaptive_signals
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE adaptive_signals_y2026m06 PARTITION OF adaptive_signals
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE adaptive_signals_y2026m07 PARTITION OF adaptive_signals
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE adaptive_signals_y2026m08 PARTITION OF adaptive_signals
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
