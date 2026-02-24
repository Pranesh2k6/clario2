-- =============================================================================
-- Migration 002: Primary Cluster — Content Taxonomy & Question Bank
-- Clario Database Architecture
-- Date: 2026-02-23
-- =============================================================================

-- =============================================================================
-- 1. SUBJECTS
-- =============================================================================
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    order_index INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 2. CHAPTERS
-- =============================================================================
CREATE TABLE chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    order_index INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chapters_subject ON chapters (subject_id, order_index);

-- =============================================================================
-- 3. CONCEPTS
-- =============================================================================
CREATE TABLE concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_concepts_chapter ON concepts (chapter_id);

-- =============================================================================
-- 4. QUESTIONS
-- =============================================================================
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content JSONB NOT NULL,
    -- content schema example:
    -- {
    --   "text": "A ball is thrown at 45 degrees...",
    --   "image_url": "https://...",
    --   "options": ["Option A", "Option B", "Option C", "Option D"]
    -- }
    correct_answer_index INT NOT NULL,
    difficulty_weight FLOAT NOT NULL DEFAULT 1.0,
    algorithmic_hints JSONB,
    -- algorithmic_hints schema example:
    -- [
    --   {"type": "text", "content": "Think about projectile components..."},
    --   {"type": "formula", "content": "v_x = v * cos(θ)"},
    --   {"type": "image", "url": "https://..."}
    -- ]
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- GIN index for fast JSONB content searches
CREATE INDEX idx_questions_content ON questions USING GIN (content);

-- =============================================================================
-- 5. QUESTION ↔ CONCEPT TAGS (Many-to-Many)
-- A single question can test multiple concepts simultaneously.
-- =============================================================================
CREATE TABLE question_concept_tags (
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (question_id, concept_id)
);

-- Reverse lookup: find all questions for a given concept
CREATE INDEX idx_qct_concept ON question_concept_tags (concept_id);

-- =============================================================================
-- 6. CHAPTER NOTES (User-facing study material per chapter)
-- =============================================================================
CREATE TABLE chapter_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content JSONB NOT NULL,
    -- content schema example:
    -- {
    --   "sections": [
    --     {"heading": "Introduction", "body": "...", "formulas": ["F=ma"]},
    --     {"heading": "Key Points", "body": "...", "diagrams": ["url1"]}
    --   ]
    -- }
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chapter_notes_chapter ON chapter_notes (chapter_id, order_index);
