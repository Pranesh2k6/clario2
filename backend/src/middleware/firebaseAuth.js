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
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing or malformed Authorization header. Expected: Bearer <token>',
        });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        req.user = {
            uid: decoded.uid,
            email: decoded.email,
            name: decoded.name || null,
        };
        next();
    } catch (err) {
        console.error('[Auth] Token verification failed:', err.code, err.message);
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired Firebase token.',
        });
    }
}

module.exports = firebaseAuth;
