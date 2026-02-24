'use strict';

const { Router } = require('express');
const { query } = require('../config/db');
const firebaseAuth = require('../middleware/firebaseAuth');

const router = Router();

// ─── POST /api/v1/auth/sync ───────────────────────────────────────────────────
// Called by the frontend immediately after Firebase login.
// Ensures the user exists in our PostgreSQL `users` table.
// If it's a brand-new user, we insert them (upsert).
router.post('/sync', firebaseAuth, async (req, res) => {
    const { uid, email, name } = req.user;

    try {
        // Upsert: insert if not exists, otherwise update email/name in case it changed.
        const result = await query(
            `INSERT INTO users (id, username, email)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE
         SET email = EXCLUDED.email
       RETURNING id, username, email, created_at`,
            [uid, name || email.split('@')[0], email]
        );

        const user = result.rows[0];
        return res.status(200).json({ user });
    } catch (err) {
        console.error('[Auth /sync] DB error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ─── GET /api/v1/users/me ─────────────────────────────────────────────────────
// Returns the authenticated user's profile + mastery snapshot.
// Used to populate the TopBar XP pill.
router.get('/me', firebaseAuth, async (req, res) => {
    const { uid } = req.user;

    try {
        const result = await query(
            `SELECT
         u.id, u.username, u.email, u.created_at,
         s.current_level, s.cached_total_xp, s.concept_debt_score, s.last_recalculated_at
       FROM users u
       LEFT JOIN user_mastery_snapshot s ON s.user_id = u.id
       WHERE u.id = $1`,
            [uid]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({ user: result.rows[0] });
    } catch (err) {
        console.error('[Auth /me] DB error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
