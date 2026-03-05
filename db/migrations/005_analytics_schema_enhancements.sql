-- =============================================================================
-- Migration 005: Analytics Schema Enhancements
-- Learning Intelligence System — Phase 1
-- Date: 2026-03-05
--
-- Enhances the duel_questions_pool and attempt_history tables with the
-- rich metadata required by the analytics & recommendation engines.
-- Also creates new analytics-specific tables: student_knowledge_profiles,
-- student_skill_ratings, and learning_recommendations.
-- =============================================================================

-- =============================================================================
-- 1. DUEL QUESTIONS POOL — Add Analytics Metadata
-- =============================================================================
ALTER TABLE duel_questions_pool ADD COLUMN IF NOT EXISTS subtopic TEXT;
ALTER TABLE duel_questions_pool ADD COLUMN IF NOT EXISTS concept_tag TEXT;
ALTER TABLE duel_questions_pool ADD COLUMN IF NOT EXISTS estimated_time_s INT DEFAULT 15;

-- Indexes for analytics queries on the new columns
CREATE INDEX IF NOT EXISTS idx_dqp_concept_tag ON duel_questions_pool (concept_tag) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_dqp_subtopic ON duel_questions_pool (subtopic) WHERE is_active = TRUE;

-- =============================================================================
-- 2. ATTEMPT HISTORY (Telemetry Cluster) — Add Rich Context
-- =============================================================================
ALTER TABLE attempt_history ADD COLUMN IF NOT EXISTS duel_id UUID;
ALTER TABLE attempt_history ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE attempt_history ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE attempt_history ADD COLUMN IF NOT EXISTS subtopic TEXT;
ALTER TABLE attempt_history ADD COLUMN IF NOT EXISTS concept_tag TEXT;
ALTER TABLE attempt_history ADD COLUMN IF NOT EXISTS attempt_number INT DEFAULT 1;
ALTER TABLE attempt_history ADD COLUMN IF NOT EXISTS power_card_used VARCHAR(50);
ALTER TABLE attempt_history ADD COLUMN IF NOT EXISTS duel_result VARCHAR(20);

-- Indexes for analytics on attempt_history
CREATE INDEX IF NOT EXISTS idx_attempt_subject ON attempt_history (subject, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempt_topic ON attempt_history (topic, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempt_concept_tag ON attempt_history (concept_tag, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempt_duel ON attempt_history (duel_id, created_at DESC);

-- =============================================================================
-- 3. STUDENT KNOWLEDGE PROFILES
-- Stores the computed mastery probability vector per student per concept.
-- Updated by the Analytics Engine based on attempt_history aggregations.
-- =============================================================================
CREATE TABLE IF NOT EXISTS student_knowledge_profiles (
    user_id UUID NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    subtopic TEXT,
    concept_tag TEXT,
    mastery_probability FLOAT NOT NULL DEFAULT 0.5,
    total_attempts INT NOT NULL DEFAULT 0,
    correct_attempts INT NOT NULL DEFAULT 0,
    avg_time_taken_ms FLOAT NOT NULL DEFAULT 0.0,
    behavior_label VARCHAR(50),
        -- 'guessing', 'careful', 'mastery', 'struggling'
    last_attempted_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, subject, topic)
);

-- Find weakest topics for a user
CREATE INDEX IF NOT EXISTS idx_skp_user_mastery
    ON student_knowledge_profiles (user_id, mastery_probability ASC);

-- =============================================================================
-- 4. STUDENT SKILL RATINGS (ELO)
-- Tracks ELO-style rating for duel matchmaking fairness.
-- =============================================================================
CREATE TABLE IF NOT EXISTS student_skill_ratings (
    user_id UUID NOT NULL PRIMARY KEY,
    rating FLOAT NOT NULL DEFAULT 1200.0,
    total_duels INT NOT NULL DEFAULT 0,
    wins INT NOT NULL DEFAULT 0,
    losses INT NOT NULL DEFAULT 0,
    last_duel_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 5. LEARNING RECOMMENDATIONS
-- Stores generated recommendations per student.
-- Written by the Recommendation Engine, read by the Dashboard API.
-- =============================================================================
CREATE TABLE IF NOT EXISTS learning_recommendations (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    recommendation_type VARCHAR(50) NOT NULL,
        -- 'practice_weak_topic', 'timed_practice', 'revision_before_duel',
        -- 'concept_review', 'duel_suggestion'
    subject TEXT,
    topic TEXT,
    subtopic TEXT,
    concept_tag TEXT,
    title TEXT NOT NULL,
    description TEXT,
    priority INT NOT NULL DEFAULT 5,       -- 1 (highest) to 10 (lowest)
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_lr_user_active
    ON learning_recommendations (user_id, is_completed, priority ASC)
    WHERE is_completed = FALSE;

-- =============================================================================
-- 6. DAILY LEARNING METRICS (Time-series aggregated by day)
-- Stores pre-computed daily metrics for the progress tracking dashboard.
-- =============================================================================
CREATE TABLE IF NOT EXISTS daily_learning_metrics (
    user_id UUID NOT NULL,
    metric_date DATE NOT NULL,
    total_attempts INT NOT NULL DEFAULT 0,
    correct_attempts INT NOT NULL DEFAULT 0,
    accuracy FLOAT NOT NULL DEFAULT 0.0,
    avg_time_taken_ms FLOAT NOT NULL DEFAULT 0.0,
    duels_played INT NOT NULL DEFAULT 0,
    duels_won INT NOT NULL DEFAULT 0,
    duel_win_rate FLOAT NOT NULL DEFAULT 0.0,
    questions_by_subject JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_dlm_user_date
    ON daily_learning_metrics (user_id, metric_date DESC);
