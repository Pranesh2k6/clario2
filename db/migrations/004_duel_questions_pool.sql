-- =============================================================================
-- Migration 004: Duel Questions Pool
-- Import JEE questions from local JSON datasets for use in duels.
-- =============================================================================

-- 1. Create the duel_questions_pool table
CREATE TABLE IF NOT EXISTS duel_questions_pool (
    id            SERIAL PRIMARY KEY,
    subject       TEXT NOT NULL,                 -- 'Physics', 'Chemistry', 'Mathematics'
    source_file   TEXT NOT NULL,                 -- 'physics.json', 'chemistry.json', 'maths.json', 'combined.jsonl'
    source_q_id   INT,                           -- original q_id from the JSON file (nullable for combined)
    question_text TEXT NOT NULL,                  -- the question text (may contain LaTeX)
    question_type TEXT NOT NULL DEFAULT 'MCQ',    -- 'MCQ' or 'SA' (fill-in-the-blank)
    options       JSONB,                          -- ["Option A", "Option B", ...] for MCQ, null for SA
    correct_answer TEXT NOT NULL,                 -- letter (A/B/C/D) for MCQ, or numeric/text for SA
    correct_option_index INT,                     -- 0-based index for MCQ, null for SA
    elo           INT DEFAULT 1200,
    difficulty    TEXT DEFAULT 'Medium',           -- 'Easy', 'Medium', 'Hard'
    topics        JSONB DEFAULT '[]',             -- ["Work, Energy, and Power", "Kinematics"]
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient duel question selection
CREATE INDEX IF NOT EXISTS idx_dqp_subject ON duel_questions_pool (subject) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_dqp_type ON duel_questions_pool (question_type) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_dqp_difficulty ON duel_questions_pool (difficulty) WHERE is_active = TRUE;

-- 2. Alter duels table: change duel_questions and subject_ids from UUID[] to TEXT[]
ALTER TABLE duels ALTER COLUMN duel_questions TYPE TEXT[] USING duel_questions::TEXT[];
ALTER TABLE duels ALTER COLUMN subject_ids TYPE TEXT[] USING subject_ids::TEXT[];

-- 3. Add time-tracking columns for two-phase duel completion
ALTER TABLE duels ADD COLUMN IF NOT EXISTS player_1_finished_at TIMESTAMPTZ;
ALTER TABLE duels ADD COLUMN IF NOT EXISTS player_2_finished_at TIMESTAMPTZ;
ALTER TABLE duels ADD COLUMN IF NOT EXISTS player_1_total_time_ms INTEGER DEFAULT 0;
ALTER TABLE duels ADD COLUMN IF NOT EXISTS player_2_total_time_ms INTEGER DEFAULT 0;
