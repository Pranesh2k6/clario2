-- Migration 007: Add IRT calibration columns to duel_questions_pool
-- These columns store the Item Response Theory parameters computed
-- by the batch calibration job.

ALTER TABLE duel_questions_pool
    ADD COLUMN IF NOT EXISTS irt_difficulty DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS irt_discrimination DOUBLE PRECISION DEFAULT 1.0,
    ADD COLUMN IF NOT EXISTS irt_calibrated_at TIMESTAMPTZ;

-- Index for selecting questions by calibrated difficulty
CREATE INDEX IF NOT EXISTS idx_questions_irt_difficulty
    ON duel_questions_pool (irt_difficulty)
    WHERE irt_difficulty IS NOT NULL;
