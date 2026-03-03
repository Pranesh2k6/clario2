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

// FIX: UUID format validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUUID(str) {
    return typeof str === 'string' && UUID_REGEX.test(str);
}

// Map subject selection IDs to DB subject names
const SUBJECT_MAP = { physics: 'Physics', chemistry: 'Chemistry', maths: 'Mathematics' };

async function selectQuestions(subjectIds) {
    let q;
    if (subjectIds && subjectIds.length === 1 && SUBJECT_MAP[subjectIds[0]]) {
        // Single subject selected → pick from that subject's questions
        const subjectName = SUBJECT_MAP[subjectIds[0]];
        q = await query(
            `SELECT id FROM duel_questions_pool
             WHERE subject = $1 AND is_active = true
             ORDER BY RANDOM() LIMIT $2`,
            [subjectName, QUESTIONS_PER_DUEL]
        );
    } else if (subjectIds && subjectIds.length > 1) {
        // Multiple subjects → pick from those subjects
        const subjectNames = subjectIds.map(s => SUBJECT_MAP[s]).filter(Boolean);
        if (subjectNames.length > 0) {
            q = await query(
                `SELECT id FROM duel_questions_pool
                 WHERE subject = ANY($1) AND is_active = true
                 ORDER BY RANDOM() LIMIT $2`,
                [subjectNames, QUESTIONS_PER_DUEL]
            );
        }
    }

    // Fallback: no subject selected or not enough found → use combined (Mixed)
    if (!q || q.rows.length < QUESTIONS_PER_DUEL) {
        q = await query(
            `SELECT id FROM duel_questions_pool
             WHERE is_active = true
             ORDER BY RANDOM() LIMIT $1`,
            [QUESTIONS_PER_DUEL]
        );
    }
    return q.rows.map(r => r.id);
}

// ── POST /request ────────────────────────────────────────────────────────────
// Send a duel request to another user by their user ID.
// Body: { targetUserId, subjectIds? }
router.post('/request', firebaseAuth, async (req, res) => {
    const player1Id = req.user.dbId;
    const { targetUserId: player2Id, subjectIds } = req.body;

    if (!player2Id) return res.status(400).json({ error: 'targetUserId is required' });
    // FIX: Validate UUID format
    if (!isValidUUID(player2Id)) return res.status(400).json({ error: 'Invalid user ID format.' });
    if (player1Id === player2Id) return res.status(400).json({ error: 'Cannot duel yourself.' });

    // FIX: Check target user exists
    try {
        const userCheck = await query('SELECT id FROM users WHERE id = $1', [player2Id]);
        if (userCheck.rows.length === 0) return res.status(404).json({ error: 'Target user not found.' });
    } catch (err) {
        return res.status(400).json({ error: 'Invalid user ID.' });
    }

    try {
        const questionIds = await selectQuestions(subjectIds);
        // FIX: Validate minimum question count
        if (questionIds.length < QUESTIONS_PER_DUEL) {
            return res.status(400).json({ error: `Not enough questions available (found ${questionIds.length}, need ${QUESTIONS_PER_DUEL}).` });
        }

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

    // Check if this player already has an active random duel
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

    // Strict subject matching
    const matchIdx = matchmakingQueue.findIndex(e => {
        if (e.playerId === playerId) return false;
        const mySubjects = subjectIds || [];
        const theirSubjects = e.subjectIds || [];
        if (mySubjects.length === 0 || theirSubjects.length === 0) return true;
        return mySubjects.some(s => theirSubjects.includes(s));
    });

    if (matchIdx !== -1) {
        // Match found!
        const opponent = matchmakingQueue.splice(matchIdx, 1)[0];

        try {
            const mergedSubjects = [...new Set([...(subjectIds || []), ...(opponent.subjectIds || [])])];
            const questionIds = await selectQuestions(mergedSubjects.length > 0 ? mergedSubjects : null);
            if (questionIds.length < QUESTIONS_PER_DUEL) return res.status(400).json({ error: 'Not enough questions available.' });

            const duelCode = generateDuelCode();
            const result = await query(
                `INSERT INTO duels (id, player_1_id, player_2_id, status, duel_code, subject_ids, duel_questions, duel_type, started_at)
                 VALUES ($1, $2, $3, 'active', $4, $5, $6, 'random', NOW())
                 RETURNING *`,
                [randomUUID(), opponent.playerId, playerId, duelCode, mergedSubjects, questionIds]
            );

            const duel = result.rows[0];

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
        if (questionIds.length < QUESTIONS_PER_DUEL) return res.status(400).json({ error: 'Not enough questions available.' });

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

    // FIX: Validate UUID format
    if (!isValidUUID(duelId)) return res.status(400).json({ error: 'Invalid duel ID format.' });

    try {
        // Only the challenged player (player_2) can accept
        const result = await query(
            `UPDATE duels SET status = 'active', started_at = NOW()
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

    // FIX: Validate UUID format
    if (!isValidUUID(duelId)) return res.status(400).json({ error: 'Invalid duel ID format.' });

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
    return res.json({
        subjects: [
            { id: 'physics', title: 'Physics', icon_url: null },
            { id: 'chemistry', title: 'Chemistry', icon_url: null },
            { id: 'maths', title: 'Mathematics', icon_url: null },
        ]
    });
});

// ── GET /:id ─────────────────────────────────────────────────────────────────
// Get active duel state with questions (no correct answers leak).
router.get('/:id', firebaseAuth, async (req, res) => {
    const playerId = req.user.dbId;
    const { id: duelId } = req.params;

    // FIX: Validate UUID format
    if (!isValidUUID(duelId)) return res.status(400).json({ error: 'Invalid duel ID format.' });

    try {
        const duelRes = await query(
            `SELECT * FROM duels WHERE id = $1 AND (player_1_id = $2 OR player_2_id = $2)`,
            [duelId, playerId]
        );
        if (duelRes.rows.length === 0) return res.status(404).json({ error: 'Duel not found.' });

        const duel = duelRes.rows[0];

        // Fetch questions WITHOUT correct answer (prevents cheating)
        const qIds = duel.duel_questions || [];
        let questions = [];
        if (qIds.length > 0) {
            // Convert string IDs to integers for the integer PK column
            const intIds = qIds.map(id => parseInt(id, 10)).filter(n => !isNaN(n));
            const qRes = await query(
                `SELECT id, question_text, question_type, options, elo FROM duel_questions_pool WHERE id = ANY($1)`,
                [intIds]
            );
            // Maintain the original order and map to frontend-expected format
            questions = intIds.map(qid => {
                const row = qRes.rows.find(q => q.id === qid);
                if (!row) return null;
                return {
                    id: String(row.id),
                    content: {
                        text: row.question_text,
                        options: row.options || null,  // JSONB → array or null
                        image_url: null,
                    },
                    difficulty_weight: row.elo ? row.elo / 1000 : 1,
                };
            }).filter(Boolean);
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
                playerId: playerId,
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

// ── POST /:id/forfeit ────────────────────────────────────────────────────────
// Forfeit / exit a duel. The opponent wins automatically.
router.post('/:id/forfeit', firebaseAuth, async (req, res) => {
    const playerId = req.user.dbId;
    const { id: duelId } = req.params;

    if (!isValidUUID(duelId)) return res.status(400).json({ error: 'Invalid duel ID format.' });

    try {
        const duelRes = await query(
            `SELECT * FROM duels WHERE id = $1 AND status = 'active' AND (player_1_id = $2 OR player_2_id = $2)`,
            [duelId, playerId]
        );
        if (duelRes.rows.length === 0)
            return res.status(404).json({ error: 'Active duel not found.' });

        const duel = duelRes.rows[0];
        const winnerId = duel.player_1_id === playerId ? duel.player_2_id : duel.player_1_id;

        await query(
            `UPDATE duels SET status = 'completed', completed_at = NOW(), winner_id = $1 WHERE id = $2`,
            [winnerId, duelId]
        );

        // Notify the opponent that they won
        req.app.get('io')?.emit('duel:opponent_forfeited', {
            duelId,
            winnerId,
            forfeitedBy: playerId,
        });

        return res.json({ message: 'You forfeited. Opponent wins.' });
    } catch (err) {
        console.error('[Duels /:id/forfeit] Error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── POST /:id/submit ─────────────────────────────────────────────────────────
// Submit an answer for the current question.
// Body: { questionId, selectedAnswerIndex, textAnswer? }
router.post('/:id/submit', firebaseAuth, async (req, res) => {
    const playerId = req.user.dbId;
    const { id: duelId } = req.params;
    const { questionId, selectedAnswerIndex, textAnswer } = req.body;

    // FIX: Validate formats
    if (!isValidUUID(duelId)) return res.status(400).json({ error: 'Invalid duel ID format.' });
    if (!questionId) return res.status(400).json({ error: 'questionId is required' });
    if (selectedAnswerIndex === undefined && !textAnswer)
        return res.status(400).json({ error: 'selectedAnswerIndex is required' });

    try {
        // Verify duel participation (allow 'active' or 'completed' — second player may still be answering)
        const duelRes = await query(
            `SELECT * FROM duels WHERE id = $1 AND status IN ('active', 'completed') AND (player_1_id = $2 OR player_2_id = $2)`,
            [duelId, playerId]
        );
        if (duelRes.rows.length === 0)
            return res.status(403).json({ error: 'Duel not found or not active.' });

        const duel = duelRes.rows[0];

        // FIX: Validate that the question belongs to this duel
        const duelQuestionIds = (duel.duel_questions || []).map(String);
        if (!duelQuestionIds.includes(String(questionId))) {
            return res.status(400).json({ error: 'Question does not belong to this duel.' });
        }

        // FIX: Prevent double submission for the same question
        const existingAnswer = await query(
            `SELECT id FROM duel_events
             WHERE duel_id = $1 AND player_id = $2 AND event_type = 'question_answered'
             AND payload->>'questionId' = $3`,
            [duelId, playerId, String(questionId)]
        );
        if (existingAnswer.rows.length > 0) {
            return res.status(409).json({ error: 'You already answered this question.' });
        }

        // FIX: Validate question order — must answer in sequence
        const answeredCount = await query(
            `SELECT COUNT(*) AS cnt FROM duel_events
             WHERE duel_id = $1 AND player_id = $2 AND event_type = 'question_answered'`,
            [duelId, playerId]
        );
        const expectedIdx = parseInt(answeredCount.rows[0].cnt);
        const submittedIdx = duelQuestionIds.indexOf(String(questionId));
        if (submittedIdx !== expectedIdx) {
            return res.status(400).json({ error: `Expected question index ${expectedIdx}, got ${submittedIdx}.` });
        }

        // Check correct answer from duel_questions_pool
        const qRes = await query(
            'SELECT question_type, options, correct_answer, correct_option_index FROM duel_questions_pool WHERE id = $1',
            [parseInt(questionId, 10)]
        );
        if (qRes.rows.length === 0) return res.status(404).json({ error: 'Question not found.' });

        const question = qRes.rows[0];
        let isCorrect = false;

        // Handle MCQ vs fill-in-the-blank (SA)
        if (question.question_type === 'MCQ' && question.options && question.options.length > 0) {
            // MCQ: compare selectedAnswerIndex with correct_option_index
            isCorrect = question.correct_option_index === selectedAnswerIndex;
        } else if (textAnswer && typeof textAnswer === 'string') {
            // Fill-in-the-blank: normalize and compare
            const correctText = (question.correct_answer || '').trim().toLowerCase();
            const userText = textAnswer.trim().toLowerCase();
            isCorrect = correctText === userText;
        }
        // If no options and no text answer, isCorrect stays false (unanswered/skipped)

        const points = isCorrect ? 100 : 0;

        // Update score (atomic — safe for concurrent updates)
        const isP1 = duel.player_1_id === playerId;
        const scoreCol = isP1 ? 'player_1_score' : 'player_2_score';
        await query(`UPDATE duels SET ${scoreCol} = ${scoreCol} + $1 WHERE id = $2`, [points, duelId]);

        // Log event (parameterized — safe from SQL injection via textAnswer)
        await query(
            `INSERT INTO duel_events (id, duel_id, player_id, event_type, payload)
             VALUES (gen_random_uuid(), $1, $2, 'question_answered', $3)`,
            [duelId, playerId, JSON.stringify({ questionId, selectedAnswerIndex, textAnswer: textAnswer || null, isCorrect, points })]
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

        // Check if this was the last question for this player
        const currentIdx = duelQuestionIds.indexOf(String(questionId));
        const isLastQuestion = currentIdx >= duelQuestionIds.length - 1;

        let duelCompleted = false;
        let finalResult = null;

        if (isLastQuestion) {
            const isP1Finishing = duel.player_1_id === playerId;
            const finishedCol = isP1Finishing ? 'player_1_finished_at' : 'player_2_finished_at';
            const timeCol = isP1Finishing ? 'player_1_total_time_ms' : 'player_2_total_time_ms';
            const totalTimeMs = req.body.totalTimeMs || 0;

            // Mark THIS player as finished
            await query(
                `UPDATE duels SET ${finishedCol} = NOW(), ${timeCol} = $1 WHERE id = $2`,
                [totalTimeMs, duelId]
            );

            // For AI duels: simultaneously mark AI as finished
            if (duel.duel_type === 'ai') {
                const aiTimeMs = Math.floor(Math.random() * 60000) + 120000; // 120-180s random
                await query(
                    `UPDATE duels SET player_2_finished_at = NOW(), player_2_total_time_ms = $1 WHERE id = $2`,
                    [aiTimeMs, duelId]
                );
            }

            // Notify room that this player finished
            req.app.get('io')?.to(duelId).emit('duel:player_finished', {
                playerId,
                duelId,
            });

            // Re-fetch to check if BOTH players have now finished
            const updatedDuel = await query('SELECT * FROM duels WHERE id = $1 FOR UPDATE', [duelId]);
            const d = updatedDuel.rows[0];

            if (d.player_1_finished_at && d.player_2_finished_at && d.status === 'active') {
                // BOTH finished → determine winner
                let winnerId = null;
                let wonByTime = false;

                if (d.player_1_score > d.player_2_score) {
                    winnerId = d.player_1_id;
                } else if (d.player_2_score > d.player_1_score) {
                    winnerId = d.player_2_id;
                } else {
                    // Scores equal → tiebreak by time (lower = faster = winner)
                    wonByTime = true;
                    if (d.player_1_total_time_ms < d.player_2_total_time_ms) {
                        winnerId = d.player_1_id;
                    } else if (d.player_2_total_time_ms < d.player_1_total_time_ms) {
                        winnerId = d.player_2_id;
                    }
                    // If times also equal → remains null (true draw)
                }

                await query(
                    `UPDATE duels SET status = 'completed', completed_at = NOW(), winner_id = $1 WHERE id = $2`,
                    [winnerId, duelId]
                );

                finalResult = {
                    duelId,
                    winnerId,
                    player1Score: d.player_1_score,
                    player2Score: d.player_2_score,
                    player1TimeMs: d.player_1_total_time_ms,
                    player2TimeMs: d.player_2_total_time_ms,
                    wonByTime,
                };

                req.app.get('io')?.to(duelId).emit('duel:completed', finalResult);
                duelCompleted = true;
            }
        }

        // Fetch updated scores from DB
        const updatedDuel2 = await query('SELECT player_1_score, player_2_score, player_1_id FROM duels WHERE id = $1', [duelId]);
        const ud = updatedDuel2.rows[0];
        const myScore = isP1 ? ud.player_1_score : ud.player_2_score;
        const theirScore = isP1 ? ud.player_2_score : ud.player_1_score;

        return res.status(200).json({
            isCorrect,
            points,
            correctAnswerIndex: question.correct_option_index,
            correctAnswerText: question.correct_answer,
            isLastQuestion,
            playerScore: myScore,
            opponentScore: theirScore,
            duelCompleted,
            finalResult,
        });
    } catch (err) {
        console.error('[Duels /:id/submit] Error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
