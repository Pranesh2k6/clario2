'use strict';

/**
 * Clario — Redis Streams Event Producer
 *
 * Pushes structured events to Redis Streams for the Python
 * Analytics Engine to consume. The Node.js backend calls
 * these functions after duel events occur.
 */

const Redis = require('ioredis');

const STREAM_KEY = 'clario:events';
const MAX_STREAM_LENGTH = 10000; // Trim stream to prevent unbounded growth

let redis = null;

function getRedis() {
    if (!redis) {
        const url = process.env.REDIS_URL || 'redis://localhost:6379';
        redis = new Redis(url, {
            maxRetriesPerRequest: 3,
            retryDelayOnFailover: 100,
            lazyConnect: true,
        });

        redis.on('error', (err) => {
            console.error('[EventStream] Redis error:', err.message);
        });

        redis.on('connect', () => {
            console.log('[EventStream] Connected to Redis');
        });

        redis.connect().catch(() => { });
    }
    return redis;
}

/**
 * Emit a QuestionAttempt event to the analytics stream.
 *
 * @param {Object} data
 * @param {string} data.user_id - UUID of the student
 * @param {string} data.question_id - UUID of the question
 * @param {string} data.subject - Physics/Chemistry/Math
 * @param {string} data.topic - e.g. "Integration"
 * @param {string} [data.subtopic]
 * @param {string} [data.concept_tag]
 * @param {boolean} data.is_correct
 * @param {number} data.time_taken_ms
 * @param {string} [data.duel_id]
 * @param {string} [data.difficulty]
 */
async function emitQuestionAttempt(data) {
    try {
        const r = getRedis();
        await r.xadd(
            STREAM_KEY,
            'MAXLEN', '~', MAX_STREAM_LENGTH,
            '*',
            'type', 'question_attempt',
            'payload', JSON.stringify(data),
            'timestamp', Date.now().toString(),
        );
    } catch (err) {
        console.error('[EventStream] Failed to emit question_attempt:', err.message);
    }
}

/**
 * Emit a DuelResult event to the analytics stream.
 *
 * @param {Object} data
 * @param {string} data.duel_id - UUID of the duel
 * @param {string} data.winner_id - UUID of the winner
 * @param {string} data.loser_id - UUID of the loser
 * @param {boolean} [data.is_draw=false]
 * @param {number} [data.winner_score]
 * @param {number} [data.loser_score]
 */
async function emitDuelResult(data) {
    try {
        const r = getRedis();
        await r.xadd(
            STREAM_KEY,
            'MAXLEN', '~', MAX_STREAM_LENGTH,
            '*',
            'type', 'duel_result',
            'payload', JSON.stringify(data),
            'timestamp', Date.now().toString(),
        );
    } catch (err) {
        console.error('[EventStream] Failed to emit duel_result:', err.message);
    }
}

/**
 * Graceful shutdown — close the Redis connection.
 */
async function closeEventStream() {
    if (redis) {
        await redis.quit();
        redis = null;
    }
}

module.exports = {
    emitQuestionAttempt,
    emitDuelResult,
    closeEventStream,
};
