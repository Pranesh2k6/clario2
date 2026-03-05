-- Migration 008: Create MAB arm statistics table
-- Stores Thompson Sampling Beta distribution parameters per archetype per arm.

CREATE TABLE IF NOT EXISTS mab_arm_stats (
    archetype VARCHAR(50) NOT NULL,
    arm VARCHAR(50) NOT NULL,
    alpha INTEGER NOT NULL DEFAULT 1,
    beta_param INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (archetype, arm)
);
