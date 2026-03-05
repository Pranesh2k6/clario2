'use strict';

/**
 * Clario Analytics API Routes
 *
 * Serves analytics data for the student dashboard.
 * In production, this proxies requests to the Python Analytics Engine.
 * For MVP, it queries the analytics tables directly.
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const firebaseAuth = require('../middleware/firebaseAuth');

// ─── Dashboard Overview ──────────────────────────────────────────────────────

/**
 * GET /api/v1/analytics/dashboard
 * Returns comprehensive analytics data for the authenticated student.
 */
router.get('/dashboard', firebaseAuth, async (req, res) => {
    try {
        const userId = req.user.dbId;

        // Knowledge profile
        const knowledgeResult = await pool.query(
            `SELECT subject, topic, subtopic, concept_tag,
                    mastery_probability, total_attempts, correct_attempts,
                    avg_time_taken_ms, behavior_label, last_attempted_at
             FROM student_knowledge_profiles
             WHERE user_id = $1
             ORDER BY subject, topic`,
            [userId]
        );

        // Skill rating
        const ratingResult = await pool.query(
            `SELECT rating, total_duels, wins, losses, last_duel_at
             FROM student_skill_ratings
             WHERE user_id = $1`,
            [userId]
        );

        // Active recommendations
        const recsResult = await pool.query(
            `SELECT id, recommendation_type, subject, topic, subtopic,
                    concept_tag, title, description, priority, created_at
             FROM learning_recommendations
             WHERE user_id = $1
               AND is_completed = FALSE
               AND (expires_at IS NULL OR expires_at > NOW())
             ORDER BY priority ASC, created_at DESC
             LIMIT 20`,
            [userId]
        );

        // Daily metrics (last 30 days)
        const dailyResult = await pool.query(
            `SELECT metric_date, total_attempts, correct_attempts, accuracy,
                    avg_time_taken_ms, duels_played, duels_won, duel_win_rate
             FROM daily_learning_metrics
             WHERE user_id = $1
               AND metric_date >= NOW() - INTERVAL '30 days'
             ORDER BY metric_date DESC`,
            [userId]
        );

        // Organize knowledge by subject (for radar chart)
        const knowledgeVector = {};
        let totalAttempts = 0;
        let correctAttempts = 0;
        let totalTime = 0;

        for (const row of knowledgeResult.rows) {
            if (!knowledgeVector[row.subject]) {
                knowledgeVector[row.subject] = [];
            }
            knowledgeVector[row.subject].push(row);
            totalAttempts += row.total_attempts || 0;
            correctAttempts += row.correct_attempts || 0;
            totalTime += row.avg_time_taken_ms || 0;
        }

        const profileCount = knowledgeResult.rows.length;
        const overallAccuracy = totalAttempts > 0 ? correctAttempts / totalAttempts : 0;
        const avgTime = profileCount > 0 ? totalTime / profileCount : 0;

        const rating = ratingResult.rows[0] || {
            rating: 1200,
            total_duels: 0,
            wins: 0,
            losses: 0,
            last_duel_at: null,
        };

        // Weak topics
        const weakTopics = knowledgeResult.rows.filter(
            r => r.mastery_probability < 0.5 && r.total_attempts >= 10
        );

        // Strong topics
        const strongTopics = knowledgeResult.rows.filter(
            r => r.mastery_probability >= 0.8 && r.total_attempts >= 10
        );

        res.json({
            user_id: userId,
            overview: {
                overall_accuracy: Math.round(overallAccuracy * 10000) / 10000,
                total_attempts: totalAttempts,
                average_response_time_ms: Math.round(avgTime * 100) / 100,
                elo_rating: rating.rating,
            },
            knowledge_vector: knowledgeVector,
            weak_topics: weakTopics,
            strong_topics: strongTopics,
            duel_stats: {
                total_duels: rating.total_duels,
                wins: rating.wins,
                losses: rating.losses,
                win_rate: rating.total_duels > 0
                    ? Math.round((rating.wins / rating.total_duels) * 10000) / 10000
                    : 0,
            },
            skill_rating: rating,
            daily_metrics: dailyResult.rows,
            recommendations: recsResult.rows,
        });
    } catch (err) {
        console.error('[Analytics] Dashboard error:', err);
        res.status(500).json({ error: 'Failed to load analytics dashboard' });
    }
});

// ─── Knowledge Profile ───────────────────────────────────────────────────────

/**
 * GET /api/v1/analytics/knowledge
 * Returns the full knowledge vector for the authenticated student.
 */
router.get('/knowledge', firebaseAuth, async (req, res) => {
    try {
        const userId = req.user.dbId;
        const result = await pool.query(
            `SELECT subject, topic, subtopic, concept_tag,
                    mastery_probability, total_attempts, correct_attempts,
                    avg_time_taken_ms, behavior_label
             FROM student_knowledge_profiles
             WHERE user_id = $1
             ORDER BY subject, topic`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('[Analytics] Knowledge error:', err);
        res.status(500).json({ error: 'Failed to load knowledge profile' });
    }
});

// ─── Weak Topics ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/analytics/weak-topics
 * Returns weak topics for the authenticated student.
 */
router.get('/weak-topics', firebaseAuth, async (req, res) => {
    try {
        const userId = req.user.dbId;
        const result = await pool.query(
            `SELECT subject, topic, subtopic, concept_tag,
                    mastery_probability, total_attempts, behavior_label
             FROM student_knowledge_profiles
             WHERE user_id = $1
               AND mastery_probability < 0.5
               AND total_attempts >= 10
             ORDER BY mastery_probability ASC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('[Analytics] Weak topics error:', err);
        res.status(500).json({ error: 'Failed to load weak topics' });
    }
});

// ─── Skill Rating ────────────────────────────────────────────────────────────

/**
 * GET /api/v1/analytics/rating
 * Returns ELO skill rating for the authenticated student.
 */
router.get('/rating', firebaseAuth, async (req, res) => {
    try {
        const userId = req.user.dbId;
        const result = await pool.query(
            `SELECT rating, total_duels, wins, losses, last_duel_at
             FROM student_skill_ratings
             WHERE user_id = $1`,
            [userId]
        );
        res.json(result.rows[0] || {
            rating: 1200,
            total_duels: 0,
            wins: 0,
            losses: 0,
        });
    } catch (err) {
        console.error('[Analytics] Rating error:', err);
        res.status(500).json({ error: 'Failed to load skill rating' });
    }
});

// ─── Recommendations ─────────────────────────────────────────────────────────

/**
 * GET /api/v1/analytics/recommendations
 * Returns active recommendations for the authenticated student.
 */
router.get('/recommendations', firebaseAuth, async (req, res) => {
    try {
        const userId = req.user.dbId;
        const result = await pool.query(
            `SELECT id, recommendation_type, subject, topic, subtopic,
                    concept_tag, title, description, priority, created_at
             FROM learning_recommendations
             WHERE user_id = $1
               AND is_completed = FALSE
               AND (expires_at IS NULL OR expires_at > NOW())
             ORDER BY priority ASC, created_at DESC
             LIMIT 20`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('[Analytics] Recommendations error:', err);
        res.status(500).json({ error: 'Failed to load recommendations' });
    }
});

/**
 * POST /api/v1/analytics/recommendations/:id/complete
 * Mark a recommendation as completed.
 */
router.post('/recommendations/:id/complete', firebaseAuth, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(
            `UPDATE learning_recommendations
             SET is_completed = TRUE, completed_at = NOW()
             WHERE id = $1 AND user_id = $2`,
            [id, req.user.dbId]
        );
        res.json({ status: 'completed', id });
    } catch (err) {
        console.error('[Analytics] Complete recommendation error:', err);
        res.status(500).json({ error: 'Failed to complete recommendation' });
    }
});

module.exports = router;
