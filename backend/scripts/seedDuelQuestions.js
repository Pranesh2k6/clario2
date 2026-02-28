#!/usr/bin/env node
'use strict';

/**
 * Seed script: Import duel questions from local JSON/JSONL dataset files
 * into the duel_questions_pool table.
 *
 * Usage:
 *   cd backend && node scripts/seedDuelQuestions.js
 *
 * This will:
 *   1. Run the migration (CREATE TABLE IF NOT EXISTS)
 *   2. Clear any existing rows
 *   3. Insert all questions from physics.json, chemistry.json, maths.json, combined.jsonl
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool, query } = require('../src/config/db');

const DATASET_DIR = path.resolve(__dirname, '../../dataset');

// ── Load subject-specific JSON (physics.json, chemistry.json, maths.json) ───
function loadSubjectJSON(filename, subject) {
    const filepath = path.join(DATASET_DIR, filename);
    const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));

    return data.map(q => {
        const isMCQ = q.type === 'MCQ' && q.options;
        let optionsArray = null;
        let correctOptionIndex = null;

        if (isMCQ) {
            const keys = ['A', 'B', 'C', 'D'];
            optionsArray = keys.map(k => q.options[k] || '').filter(Boolean);
            correctOptionIndex = keys.indexOf(q.answer.trim().toUpperCase());
            if (correctOptionIndex < 0) correctOptionIndex = null;
        }

        return {
            subject,
            source_file: filename,
            source_q_id: q.q_id,
            question_text: q.text,
            question_type: q.type || 'MCQ',
            options: optionsArray ? JSON.stringify(optionsArray) : null,
            correct_answer: String(q.answer).trim(),
            correct_option_index: correctOptionIndex,
            elo: q.elo || 1200,
            difficulty: q.difficulty_initial || 'Medium',
            topics: JSON.stringify(q.topic || []),
        };
    });
}

// ── Load combined.jsonl ─────────────────────────────────────────────────────
function loadCombinedJSONL(filename) {
    const filepath = path.join(DATASET_DIR, filename);
    const lines = fs.readFileSync(filepath, 'utf8').split('\n').filter(Boolean);

    return lines.map((line, i) => {
        const q = JSON.parse(line);
        const hasOptions = Array.isArray(q.options) && q.options.length > 0;

        let correctOptionIndex = null;
        if (hasOptions) {
            correctOptionIndex = q.options.findIndex(
                opt => opt.trim().toLowerCase() === String(q.answer).trim().toLowerCase()
            );
            if (correctOptionIndex < 0) correctOptionIndex = null;
        }

        return {
            subject: 'Mixed',
            source_file: filename,
            source_q_id: i + 1,
            question_text: q.question,
            question_type: hasOptions ? 'MCQ' : 'SA',
            options: hasOptions ? JSON.stringify(q.options) : null,
            correct_answer: String(q.answer).trim(),
            correct_option_index: correctOptionIndex,
            elo: 1200,
            difficulty: 'Medium',
            topics: '[]',
        };
    });
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
    console.log('🔄 Running migration...');
    const migrationSQL = fs.readFileSync(
        path.resolve(__dirname, '../../db/migrations/004_duel_questions_pool.sql'),
        'utf8'
    );
    await query(migrationSQL);
    console.log('✅ Migration complete.');

    // Clear existing data
    console.log('🗑  Clearing existing duel_questions_pool...');
    await query('DELETE FROM duel_questions_pool');

    // Load all datasets
    const allQuestions = [
        ...loadSubjectJSON('physics.json', 'Physics'),
        ...loadSubjectJSON('chemistry.json', 'Chemistry'),
        ...loadSubjectJSON('maths.json', 'Mathematics'),
        ...loadCombinedJSONL('combined.jsonl'),
    ];

    console.log(`📦 Inserting ${allQuestions.length} questions...`);

    // Batch insert
    let inserted = 0;
    for (const q of allQuestions) {
        await query(
            `INSERT INTO duel_questions_pool
                (subject, source_file, source_q_id, question_text, question_type,
                 options, correct_answer, correct_option_index, elo, difficulty, topics)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
                q.subject, q.source_file, q.source_q_id, q.question_text, q.question_type,
                q.options, q.correct_answer, q.correct_option_index,
                q.elo, q.difficulty, q.topics,
            ]
        );
        inserted++;
    }

    // Verify counts
    const counts = await query(
        `SELECT subject, COUNT(*) AS count FROM duel_questions_pool GROUP BY subject ORDER BY subject`
    );
    console.log('\n📊 Questions inserted by subject:');
    for (const row of counts.rows) {
        console.log(`   ${row.subject}: ${row.count}`);
    }
    console.log(`\n✅ Total: ${inserted} questions seeded successfully.`);

    await pool.end();
}

main().catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
