-- Migration 006: Add TrueSkill columns to student_skill_ratings
-- Adds mu (estimated skill mean) and sigma (uncertainty) for TrueSkill algorithm.
-- The existing 'rating' column becomes the conservative display rating (mu - 3*sigma).

-- Add TrueSkill columns
ALTER TABLE student_skill_ratings
    ADD COLUMN IF NOT EXISTS mu DOUBLE PRECISION DEFAULT 1200.0,
    ADD COLUMN IF NOT EXISTS sigma DOUBLE PRECISION DEFAULT 400.0;

-- Backfill existing rows: convert current ELO rating to TrueSkill equivalents
-- mu = current rating, sigma = large initial uncertainty
UPDATE student_skill_ratings
SET mu = rating,
    sigma = 400.0
WHERE mu IS NULL OR mu = 1200.0;

-- Add index for efficient matchmaking queries
CREATE INDEX IF NOT EXISTS idx_skill_ratings_mu
    ON student_skill_ratings (mu);
