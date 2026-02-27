-- ============================================================
-- Study Planner tables
-- ============================================================

-- 1. Add target_exam_date to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS target_exam_date DATE;

-- 2. Study tasks
CREATE TABLE IF NOT EXISTS study_tasks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject     TEXT NOT NULL,               -- 'Physics', 'Chemistry', 'Math'
    chapter     TEXT NOT NULL,               -- 'Motion in 2D', 'Integration', etc.
    mode        TEXT NOT NULL DEFAULT 'Learn', -- 'Learn', 'Practice', 'Quiz', 'Revision'
    estimated_minutes INTEGER NOT NULL DEFAULT 45,
    scheduled_date DATE NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_study_tasks_user_date ON study_tasks (user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_study_tasks_user_completed ON study_tasks (user_id, is_completed);
