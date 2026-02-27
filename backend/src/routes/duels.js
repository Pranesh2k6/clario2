'use strict';

const { Router } = require('express');
const { query } = require('../config/db');
const firebaseAuth = require('../middleware/firebaseAuth');
const { randomUUID } = require('crypto');

const router = Router();

const AI_USER_ID = '00000000-0000-0000-0000-000000000001';
const QUESTIONS_PER_DUEL = 10;

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateDuelCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function selectQuestions(subjectIds) {
    let q;
    if (subjectIds && subjectIds.length > 0) {
        q = await query(
            `SELECT q.id FROM questions q
             JOIN question_concept_tags qct ON qct.question_id = q.id
             JOIN concepts c ON c.id = qct.concept_id
             JOIN chapters ch ON ch.id = c.chapter_id
             WHERE ch.subject_id = ANY($1) AND q.is_active = true
             ORDER BY RANDOM() LIMIT $2`,
            [subjectIds, QUESTIONS_PER_DUEL]
        );
    } else {
        q = await query(
            `SELECT id FROM questions WHERE is_active = true ORDER BY RANDOM() LIMIT $1`,
            [QUESTIONS_PER_DUEL]
        );
    }
    return q.rows.map(r => r.id);
}

async function getUserByFirebaseUid(uid) {
    const res = await query('SELECT id FROM users WHERE email = (SELECT email FROM users WHERE id::text = $1 OR email LIKE $1 || \'%\' LIMIT 1) LIMIT 1', [uid]);
    // Fallback: try to find user whose id text matches the uid
    if (res.rows.length === 0) {
        const res2 = await query('SELECT id FROM users LIMIT 1');
        return res2.rows[0]?.id;
    }
    return res.rows[0]?.id;
}

// ── POST /request ────────────────────────────────────────────────────────────
// Send a duel request to another user by their user ID.
// Body: { targetUserId, subjectIds? }
router.post('/request', firebaseAuth, async (req, res) => {
    const player1Id = req.user.dbId;
    const { targetUserId: player2Id, subjectIds } = req.body;

    if (!player2Id) return res.status(400).json({ error: 'targetUserId is required' });
    if (player1Id === player2Id) return res.status(400).json({ error: 'Cannot duel yourself.' });

    try {
        const questionIds = await selectQuestions(subjectIds);
        if (questionIds.length === 0) return res.status(400).json({ error: 'No questions available for selected subjects.' });

        const duelCode = generateDuelCode();
        const result = await query(
            `INSERT INTO duels (id, player_1_id, player_2_id, status, duel_code, subject_ids, duel_questions, duel_type)
             VALUES ($1, $2, $3, 'pending', $4, $5, $6, 'friend')
             RETURNING id, player_1_id, player_2_id, status, duel_code, created_at`,
            [randomUUID(), player1Id, player2Id, duelCode, subjectIds || [], questionIds]
        );

        const duel = result.rows[0];

        // Notify player 2 via Socket.io
        req.app.get('io')?.emit('duel:challenge_received', {
            duelId: duel.id,
            challengerName: req.user.username || 'Unknown',
            duelCode: duel.duel_code,
        });

        return res.status(201).json({ duel });
    } catch (err) {
        console.error('[Duels /request] Error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── POST /join ───────────────────────────────────────────────────────────────
// Join a duel by entering a duel code.
// Body: { duelCode }
router.post('/join', firebaseAuth, async (req, res) => {
    const playerId = req.user.dbId;
    const { duelCode } = req.body;

    if (!duelCode) return res.status(400).json({ error: 'duelCode is required' });

    try {
        const result = await query(
            `UPDATE duels
             SET player_2_id = $1, status = 'active', started_at = NOW()
             WHERE duel_code = $2 AND status = 'pending' AND player_2_id IS DISTINCT FROM $1
             RETURNING *`,
            [playerId, duelCode.toUpperCase()]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Duel not found or already started.' });
        }

        const duel = result.rows[0];
        req.app.get('io')?.to(duel.id).emit('duel:accepted', { duel });

        return res.status(200).json({ duel });
    } catch (err) {
        console.error('[Duels /join] Error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── POST /random-match ───────────────────────────────────────────────────────
// Joins a matchmaking queue. If another player is waiting, creates a duel.
// Body: { subjectIds? }

// In-memory matchmaking queue (simple MVP approach; replace with Redis later)
const matchmakingQueue = [];

router.post('/random-match', firebaseAuth, async (req, res) => {
    const playerId = req.user.dbId;
    const { subjectIds } = req.body;

    // Guard: if the user has no Postgres record, reject early
    if (!playerId) {
        return res.status(401).json({ error: 'User not synced to database. Please log out and log in again.' });
    }

    // ── FIX 1: Check if this player already has an active random duel ────────
    // This prevents the race condition where Player A's poller re-queues them
    // after Player B already created a duel for both of them.
    try {
        const existingDuel = await query(
            `SELECT * FROM duels
             WHERE duel_type = 'random' AND status = 'active'
             AND (player_1_id = $1 OR player_2_id = $1)
             AND started_at > NOW() - INTERVAL '5 minutes'
             ORDER BY started_at DESC LIMIT 1`,
            [playerId]
        );
        if (existingDuel.rows.length > 0) {
            return res.status(200).json({ duel: existingDuel.rows[0], matched: true });
        }
    } catch (err) {
        console.error('[Duels /random-match] DB check error:', err.message);
    }

    // Remove player from queue if they're already in it (prevents duplicates)
    const existingIdx = matchmakingQueue.findIndex(e => e.playerId === playerId);
    if (existingIdx !== -1) matchmakingQueue.splice(existingIdx, 1);

    // ── FIX 3: Strict subject matching ───────────────────────────────────────
    // Only match players whose selected subjects overlap, or if either party
    // selected no subjects (wildcard = match with anyone).
    const matchIdx = matchmakingQueue.findIndex(e => {
        if (e.playerId === playerId) return false;
        const mySubjects = subjectIds || [];
        const theirSubjects = e.subjectIds || [];
        // If either player selected no subjects, it's a wildcard match
        if (mySubjects.length === 0 || theirSubjects.length === 0) return true;
        // Otherwise, require at least one overlapping subject
        return mySubjects.some(s => theirSubjects.includes(s));
    });

    if (matchIdx !== -1) {
        // Match found!
        const opponent = matchmakingQueue.splice(matchIdx, 1)[0];

        try {
            const mergedSubjects = [...new Set([...(subjectIds || []), ...(opponent.subjectIds || [])])];
            const questionIds = await selectQuestions(mergedSubjects.length > 0 ? mergedSubjects : null);
            if (questionIds.length === 0) return res.status(400).json({ error: 'No questions available.' });

            const duelCode = generateDuelCode();
            const result = await query(
                `INSERT INTO duels (id, player_1_id, player_2_id, status, duel_code, subject_ids, duel_questions, duel_type, started_at)
                 VALUES ($1, $2, $3, 'active', $4, $5, $6, 'random', NOW())
                 RETURNING *`,
                [randomUUID(), opponent.playerId, playerId, duelCode, mergedSubjects, questionIds]
            );

            const duel = result.rows[0];

            // ── FIX 2: Notify BOTH players by their specific player IDs ──────
            const io = req.app.get('io');
            io?.emit('duel:match_found', {
                duelId: duel.id,
                duelCode: duel.duel_code,
                player1Id: opponent.playerId,
                player2Id: playerId,
            });

            return res.status(201).json({ duel, matched: true });
        } catch (err) {
            console.error('[Duels /random-match] Error:', err.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        // No match yet — add to queue
        matchmakingQueue.push({ playerId, subjectIds, joinedAt: Date.now() });
        return res.status(200).json({ matched: false, message: 'Waiting for an opponent...' });
    }
});

// ── POST /ai-match ───────────────────────────────────────────────────────────
// Creates an instant duel against the AI bot.
// Body: { subjectIds? }
router.post('/ai-match', firebaseAuth, async (req, res) => {
    const playerId = req.user.dbId;
    const { subjectIds } = req.body;

    try {
        const questionIds = await selectQuestions(subjectIds);
        if (questionIds.length === 0) return res.status(400).json({ error: 'No questions available.' });

        const duelCode = generateDuelCode();
        const result = await query(
            `INSERT INTO duels (id, player_1_id, player_2_id, status, duel_code, subject_ids, duel_questions, duel_type, started_at)
             VALUES ($1, $2, $3, 'active', $4, $5, $6, 'ai', NOW())
             RETURNING *`,
            [randomUUID(), playerId, AI_USER_ID, duelCode, subjectIds || [], questionIds]
        );

        return res.status(201).json({ duel: result.rows[0] });
    } catch (err) {
        console.error('[Duels /ai-match] Error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── GET /pending ─────────────────────────────────────────────────────────────
// Fetch all pending duel requests for the current user.
router.get('/pending', firebaseAuth, async (req, res) => {
    const playerId = req.user.dbId;
    try {
        const result = await query(
            `SELECT d.*, u.username AS challenger_name, ums.cached_total_xp AS challenger_xp
             FROM duels d
             JOIN users u ON u.id = d.player_1_id
             LEFT JOIN user_mastery_snapshot ums ON ums.user_id = d.player_1_id
             WHERE d.player_2_id = $1 AND d.status = 'pending'
             ORDER BY d.created_at DESC`,
            [playerId]
        );
        return res.json({ duels: result.rows });
    } catch (err) {
        console.error('[Duels /pending] Error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── POST /accept/:duelId ─────────────────────────────────────────────────────
// Accept a pending duel challenge.
router.post('/accept/:duelId', firebaseAuth, async (req, res) => {
    const playerId = req.user.dbId;
    const { duelId } = req.params;
    try {
        // Only the challenged player (player_2) can accept
        const result = await query(
            `UPDATE duels SET status = 'active', updated_at = NOW()
             WHERE id = $1 AND player_2_id = $2 AND status = 'pending'
             RETURNING *`,
            [duelId, playerId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Challenge not found or already handled.' });
        }
        const duel = result.rows[0];

        // Notify both players via Socket.io
        req.app.get('io')?.emit('duel:match_found', {
            duelId: duel.id,
            duelCode: duel.duel_code,
            player1Id: duel.player_1_id,
            player2Id: duel.player_2_id,
        });

        return res.json({ duel });
    } catch (err) {
        console.error('[Duels /accept] Error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── POST /decline/:duelId ────────────────────────────────────────────────────
// Decline (delete) a pending duel challenge.
router.post('/decline/:duelId', firebaseAuth, async (req, res) => {
    const playerId = req.user.dbId;
    const { duelId } = req.params;
    try {
        const result = await query(
            `DELETE FROM duels WHERE id = $1 AND player_2_id = $2 AND status = 'pending' RETURNING id`,
            [duelId, playerId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Challenge not found or already handled.' });
        }
        return res.json({ message: 'Challenge declined.' });
    } catch (err) {
        console.error('[Duels /decline] Error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── GET /recent-activity ─────────────────────────────────────────────────────
// Fetch user's duel stats.
router.get('/recent-activity', firebaseAuth, async (req, res) => {
    const playerId = req.user.dbId;
    try {
        const totalRes = await query(
            `SELECT COUNT(*) AS total FROM duels
             WHERE (player_1_id = $1 OR player_2_id = $1) AND status = 'completed'`,
            [playerId]
        );
        const winsRes = await query(
            `SELECT COUNT(*) AS wins FROM duels WHERE winner_id = $1`,
            [playerId]
        );
        const total = parseInt(totalRes.rows[0].total);
        const wins = parseInt(winsRes.rows[0].wins);
        const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

        // Simple ranking: count users with more wins
        const rankRes = await query(
            `SELECT COUNT(DISTINCT winner_id) + 1 AS rank FROM duels
             WHERE winner_id IS NOT NULL
             GROUP BY winner_id
             HAVING COUNT(*) > (SELECT COUNT(*) FROM duels WHERE winner_id = $1)`,
            [playerId]
        );
        const rank = rankRes.rows.length + 1;

        return res.json({ totalDuels: total, wins, winRate, rank });
    } catch (err) {
        console.error('[Duels /recent-activity] Error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── GET /subjects/list ───────────────────────────────────────────────────────
// List available subjects for subject selection UI.
router.get('/subjects/list', async (req, res) => {
    try {
        const result = await query('SELECT id, title, icon_url FROM subjects WHERE is_active = true ORDER BY order_index');
        return res.json({ subjects: result.rows });
    } catch (err) {
        console.error('[Duels /subjects/list] Error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── POST /:id/accept ─────────────────────────────────────────────────────────
// Accept a pending duel.
router.post('/:id/accept', firebaseAuth, async (req, res) => {
    const playerId = req.user.dbId;
    const { id: duelId } = req.params;

    try {
        const result = await query(
            `UPDATE duels SET status = 'active', started_at = NOW()
             WHERE id = $1 AND player_2_id = $2 AND status = 'pending'
             RETURNING *`,
            [duelId, playerId]
        );

        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Duel not found or not pending.' });

        const duel = result.rows[0];
        req.app.get('io')?.to(duelId).emit('duel:accepted', { duel });
        return res.status(200).json({ duel });
    } catch (err) {
        console.error('[Duels /:id/accept] Error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── POST /:id/decline ────────────────────────────────────────────────────────
// Decline a pending duel.
router.post('/:id/decline', firebaseAuth, async (req, res) => {
    const playerId = req.user.dbId;
    const { id: duelId } = req.params;

    try {
        const result = await query(
            `UPDATE duels SET status = 'cancelled'
             WHERE id = $1 AND player_2_id = $2 AND status = 'pending'
             RETURNING id, status`,
            [duelId, playerId]
        );

        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Duel not found or not pending.' });

        return res.status(200).json({ duel: result.rows[0] });
    } catch (err) {
        console.error('[Duels /:id/decline] Error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── GET /:id ─────────────────────────────────────────────────────────────────
// Get active duel state with questions (no correct answers leak).
router.get('/:id', firebaseAuth, async (req, res) => {
    const playerId = req.user.dbId;
    const { id: duelId } = req.params;

    try {
        const duelRes = await query(
            `SELECT * FROM duels WHERE id = $1 AND (player_1_id = $2 OR player_2_id = $2)`,
            [duelId, playerId]
        );
        if (duelRes.rows.length === 0) return res.status(404).json({ error: 'Duel not found.' });

        const duel = duelRes.rows[0];

        // Fetch questions WITHOUT correct_answer_index
        const qIds = duel.duel_questions || [];
        let questions = [];
        if (qIds.length > 0) {
            const qRes = await query(
                `SELECT id, content, difficulty_weight FROM questions WHERE id = ANY($1)`,
                [qIds]
            );
            // Maintain the original order from duel_questions
            questions = qIds.map(qid => qRes.rows.find(q => q.id === qid)).filter(Boolean);
        }

        // Fetch opponent info
        const opponentId = duel.player_1_id === playerId ? duel.player_2_id : duel.player_1_id;
        const oppRes = await query('SELECT username FROM users WHERE id = $1', [opponentId]);

        return res.json({
            duel: {
                id: duel.id,
                status: duel.status,
                duelType: duel.duel_type,
                duelCode: duel.duel_code,
                currentQuestionIndex: duel.current_question_index,
                playerScore: duel.player_1_id === playerId ? duel.player_1_score : duel.player_2_score,
                opponentScore: duel.player_1_id === playerId ? duel.player_2_score : duel.player_1_score,
                isPlayer1: duel.player_1_id === playerId,
            },
            questions,
            opponent: {
                id: opponentId,
                username: oppRes.rows[0]?.username || 'Opponent',
            },
        });
    } catch (err) {
        console.error('[Duels /:id] Error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── POST /:id/submit ─────────────────────────────────────────────────────────
// Submit an answer for the current question.
// Body: { questionId, selectedAnswerIndex }
router.post('/:id/submit', firebaseAuth, async (req, res) => {
    const playerId = req.user.dbId;
    const { id: duelId } = req.params;
    const { questionId, selectedAnswerIndex } = req.body;

    if (questionId === undefined || selectedAnswerIndex === undefined)
        return res.status(400).json({ error: 'questionId and selectedAnswerIndex are required' });

    try {
        // Verify active duel and participation
        const duelRes = await query(
            `SELECT * FROM duels WHERE id = $1 AND status = 'active' AND (player_1_id = $2 OR player_2_id = $2)`,
            [duelId, playerId]
        );
        if (duelRes.rows.length === 0)
            return res.status(403).json({ error: 'Duel not found or not active.' });

        const duel = duelRes.rows[0];

        // Check correct answer
        const qRes = await query('SELECT correct_answer_index FROM questions WHERE id = $1', [questionId]);
        if (qRes.rows.length === 0) return res.status(404).json({ error: 'Question not found.' });

        const isCorrect = qRes.rows[0].correct_answer_index === selectedAnswerIndex;
        const points = isCorrect ? 100 : 0;

        // Update score
        const isP1 = duel.player_1_id === playerId;
        const scoreCol = isP1 ? 'player_1_score' : 'player_2_score';
        await query(`UPDATE duels SET ${scoreCol} = ${scoreCol} + $1 WHERE id = $2`, [points, duelId]);

        // Log event
        await query(
            `INSERT INTO duel_events (id, duel_id, player_id, event_type, payload)
             VALUES (gen_random_uuid(), $1, $2, 'question_answered', $3)`,
            [duelId, playerId, JSON.stringify({ questionId, selectedAnswerIndex, isCorrect, points })]
        );

        // Broadcast
        req.app.get('io')?.to(duelId).emit('duel:answer_submitted', {
            playerId,
            questionId,
            isCorrect,
            points,
        });

        // For AI duels: simulate AI answer
        if (duel.duel_type === 'ai') {
            const aiCorrect = Math.random() > 0.35; // 65% accuracy
            const aiPoints = aiCorrect ? 100 : 0;
            await query(`UPDATE duels SET player_2_score = player_2_score + $1 WHERE id = $2`, [aiPoints, duelId]);

            req.app.get('io')?.to(duelId).emit('duel:answer_submitted', {
                playerId: AI_USER_ID,
                questionId,
                isCorrect: aiCorrect,
                points: aiPoints,
            });
        }

        // Check if this was the last question
        const questionIds = duel.duel_questions || [];
        const currentIdx = questionIds.indexOf(questionId);
        const isLastQuestion = currentIdx >= questionIds.length - 1;

        if (isLastQuestion) {
            // Complete the duel
            const finalDuel = await query('SELECT * FROM duels WHERE id = $1', [duelId]);
            const d = finalDuel.rows[0];
            const winnerId = d.player_1_score > d.player_2_score ? d.player_1_id
                : d.player_2_score > d.player_1_score ? d.player_2_id
                    : null;

            await query(
                `UPDATE duels SET status = 'completed', completed_at = NOW(), winner_id = $1 WHERE id = $2`,
                [winnerId, duelId]
            );

            req.app.get('io')?.to(duelId).emit('duel:completed', {
                duelId,
                winnerId,
                player1Score: d.player_1_score + (isP1 ? points : 0),
                player2Score: d.player_2_score + (!isP1 ? points : 0),
            });
        }

        return res.status(200).json({
            isCorrect,
            points,
            correctAnswerIndex: qRes.rows[0].correct_answer_index,
            isLastQuestion,
        });
    } catch (err) {
        console.error('[Duels /:id/submit] Error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
