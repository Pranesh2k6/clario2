-- =============================================================================
-- Migration 003: Primary Cluster — Duels, Badges, Leaderboards, Schedules
-- Clario Database Architecture
-- Date: 2026-02-23
-- =============================================================================

-- =============================================================================
-- 1. DUELS (Source of truth for completed duels)
-- Active duel millisecond-state lives in Redis.
-- Final results are committed here on completion.
-- =============================================================================
CREATE TABLE duels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_1_id UUID NOT NULL REFERENCES users(id),
    player_2_id UUID NOT NULL REFERENCES users(id),
    winner_id UUID NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
        -- pending   → challenge sent, awaiting acceptance
        -- active    → both players are live, duel in progress
        -- completed → duel finished, winner determined
        -- cancelled → one player declined or timed out
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_duels_player1 ON duels (player_1_id, status);
CREATE INDEX idx_duels_player2 ON duels (player_2_id, status);
-- Partial index: only active duels (most common query pattern)
CREATE INDEX idx_duels_active ON duels (status) WHERE status = 'active';

-- =============================================================================
-- 2. DUEL EVENTS (Partitioned by Month)
-- Granular event log of everything that happened mid-duel.
-- Used for replay, verification, and anti-cheat auditing.
-- =============================================================================
CREATE TABLE duel_events (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    duel_id UUID NOT NULL,                        -- No FK to duels to keep partition independence
    player_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,              -- 'question_answered', 'powerup_used', 'timeout'
    payload JSONB NOT NULL,
        -- Example: {"question_id": "uuid", "is_correct": true, "time_taken_ms": 1400}
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE INDEX idx_duel_events_duel ON duel_events (duel_id, created_at DESC);

-- Initial partitions
CREATE TABLE duel_events_y2026m01 PARTITION OF duel_events
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE duel_events_y2026m02 PARTITION OF duel_events
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE duel_events_y2026m03 PARTITION OF duel_events
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE duel_events_y2026m04 PARTITION OF duel_events
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE duel_events_y2026m05 PARTITION OF duel_events
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE duel_events_y2026m06 PARTITION OF duel_events
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE duel_events_y2026m07 PARTITION OF duel_events
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE duel_events_y2026m08 PARTITION OF duel_events
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

-- =============================================================================
-- 3. BADGES & ACHIEVEMENTS
-- =============================================================================
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_url TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
        -- e.g., 'general', 'duel', 'streak', 'mastery', 'social'
    criteria JSONB NOT NULL,
        -- Machine-readable unlock conditions:
        -- {"type": "xp_threshold", "value": 10000}
        -- {"type": "duel_wins", "value": 50}
        -- {"type": "streak_days", "value": 30}
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_badges (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges (user_id, earned_at DESC);

-- =============================================================================
-- 4. CONCEPT DEBT TRACKING
-- Tracks per-concept weakness scores for each user.
-- Fed by the Adaptive Engine based on attempt_history patterns.
-- =============================================================================
CREATE TABLE user_concept_debt (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    debt_score FLOAT NOT NULL DEFAULT 0.0,
        -- 0.0 = fully mastered, 1.0 = maximum debt (needs urgent review)
    total_attempts INT NOT NULL DEFAULT 0,
    correct_attempts INT NOT NULL DEFAULT 0,
    last_attempted_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, concept_id)
);

-- Find a user's weakest concepts (sorted by debt)
CREATE INDEX idx_user_debt_score ON user_concept_debt (user_id, debt_score DESC);

-- =============================================================================
-- 5. STUDY SCHEDULES
-- Algorithmically generated study plans per user.
-- =============================================================================
CREATE TABLE study_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    concept_id UUID NOT NULL REFERENCES concepts(id),
    task_type VARCHAR(50) NOT NULL,
        -- 'review', 'practice_quiz', 'learn_new', 'duel_challenge'
    priority INT NOT NULL DEFAULT 5,              -- 1 (highest) to 10 (lowest)
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schedule_user_date ON study_schedules (user_id, scheduled_date)
    WHERE is_completed = FALSE;

-- =============================================================================
-- 6. USER STREAKS
-- Tracks consecutive daily activity for engagement/badges.
-- =============================================================================
CREATE TABLE user_streaks (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak INT NOT NULL DEFAULT 0,
    longest_streak INT NOT NULL DEFAULT 0,
    last_activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
