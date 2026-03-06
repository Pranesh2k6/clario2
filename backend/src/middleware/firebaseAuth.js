'use strict';

const admin = require('../config/firebase');

/**
 * Express middleware: verifies the Firebase ID Token from the Authorization header.
 *
 * On success, attaches `req.user = { uid, email, name }` and calls next().
 * On failure, responds immediately with 401 Unauthorized.
 */
async function firebaseAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('[Auth] Missing or malformed Authorization header');
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing or malformed Authorization header. Expected: Bearer <token>',
        });
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Step 1: Verify Firebase token
    let decoded;
    try {
        decoded = await admin.auth().verifyIdToken(idToken);
    } catch (err) {
        console.error('[Auth] Firebase token verification failed:', err.code, err.message);
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired Firebase token.',
        });
    }

    // Step 2: Look up the Postgres user (DB errors should NOT be 401)
    try {
        const { query } = require('../config/db');
        const dbUser = await query('SELECT id, username FROM users WHERE email = $1', [decoded.email]);
        const dbId = dbUser.rows.length > 0 ? dbUser.rows[0].id : null;

        req.user = {
            uid: decoded.uid,
            email: decoded.email,
            name: decoded.name || null,
            dbId,
            username: dbUser.rows[0]?.username || null,
        };
        next();
    } catch (err) {
        console.error('[Auth] Database lookup failed:', err.message);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to look up user in database.',
        });
    }
}

module.exports = firebaseAuth;
