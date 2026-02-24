'use strict';

const { Router } = require('express');
const { query } = require('../config/db');
const firebaseAuth = require('../middleware/firebaseAuth');
const { randomUUID } = require('crypto');

const router = Router();

// ─── POST /api/v1/duels/request ──────────────────────────────────────────────
// Initiates a duel challenge from the authenticated user to a target player.
// Creates a 'pending' duel record in Postgres.
// Body: { targetUserId: string }
router.post('/request', firebaseAuth, async (req, res) => {
    const { uid: player1Id } = req.user;
    const { targetUserId: player2Id } = req.body;

    if (!player2Id) {
        return res.status(400).json({ error: 'targetUserId is required' });
    }
    if (player1Id === player2Id) {
        return res.status(400).json({ error: 'Cannot duel yourself.' });
    }

    try {
        const duelId = randomUUID();
        const result = await query(
            `INSERT INTO duels (id, player_1_id, player_2_id, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id, player_1_id, player_2_id, status, created_at`,
            [duelId, player1Id, player2Id]
        );

        const duel = result.rows[0];
        console.log(`[Duels] New duel requested: ${duelId} by ${player1Id}`);
        return res.status(201).json({ duel });
    } catch (err) {
        console.error('[Duels /request] DB error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ─── POST /api/v1/duels/:id/accept ───────────────────────────────────────────
// Called by player_2 to accept a pending challenge.
// Transitions the duel to 'active' with a started_at timestamp.
router.post('/:id/accept', firebaseAuth, async (req, res) => {
    const { uid } = req.user;
    const { id: duelId } = req.params;

    try {
        // Ensure only the challenged player (player_2) can accept.
        const result = await query(
            `UPDATE duels
       SET status = 'active', started_at = NOW()
       WHERE id = $1
         AND player_2_id = $2
         AND status = 'pending'
       RETURNING id, player_1_id, player_2_id, status, started_at`,
            [duelId, uid]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Duel not found, or you are not the challenged player, or duel is not pending.',
            });
        }

        const duel = result.rows[0];
        console.log(`[Duels] Duel accepted: ${duelId} by ${uid}`);

        // Notify the other player via WebSocket (see the WS handler in index.js).
        req.app.get('io')?.to(duelId).emit('duel:accepted', { duel });

        return res.status(200).json({ duel });
    } catch (err) {
        console.error('[Duels /:id/accept] DB error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ─── POST /api/v1/duels/:id/submit ───────────────────────────────────────────
// Called when a player submits an answer during an active duel.
// Persists to duel_events and broadcasts the result via WebSocket.
// Body: { questionId: string, selectedAnswerIndex: number }
router.post('/:id/submit', firebaseAuth, async (req, res) => {
    const { uid: playerId } = req.user;
    const { id: duelId } = req.params;
    const { questionId, selectedAnswerIndex } = req.body;

    if (questionId === undefined || selectedAnswerIndex === undefined) {
        return res.status(400).json({ error: 'questionId and selectedAnswerIndex are required' });
    }

    try {
        // 1. Verify the duel is active and the player is a participant.
        const duelCheck = await query(
            `SELECT id FROM duels
       WHERE id = $1 AND status = 'active'
         AND (player_1_id = $2 OR player_2_id = $2)`,
            [duelId, playerId]
        );
        if (duelCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Duel not found or you are not a participant.' });
        }

        // 2. Look up the correct answer from the questions table.
        const questionResult = await query(
            `SELECT correct_answer_index FROM questions WHERE id = $1`,
            [questionId]
        );
        if (questionResult.rows.length === 0) {
            return res.status(404).json({ error: 'Question not found.' });
        }

        const isCorrect = questionResult.rows[0].correct_answer_index === selectedAnswerIndex;

        // 3. Persist this event to duel_events as an immutable audit log.
        await query(
            `INSERT INTO duel_events (id, duel_id, player_id, event_type, payload)
       VALUES (gen_random_uuid(), $1, $2, 'question_answered', $3)`,
            [duelId, playerId, JSON.stringify({ questionId, selectedAnswerIndex, isCorrect })]
        );

        // 4. Broadcast the result to all clients in the duel room via WebSocket.
        req.app.get('io')?.to(duelId).emit('duel:answer_submitted', {
            playerId,
            questionId,
            isCorrect,
        });

        return res.status(200).json({ isCorrect });
    } catch (err) {
        console.error('[Duels /:id/submit] DB error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
