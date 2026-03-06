'use strict';

const admin = require('firebase-admin');
const path = require('path');

// ─── Firebase Credential Loading ──────────────────────────────────────────────
// Priority:
//   1. FIREBASE_CREDENTIALS env var (JSON string — for production on Render/Railway)
//   2. FIREBASE_SERVICE_ACCOUNT_PATH env var (file path — for local development)
let serviceAccount;

if (process.env.FIREBASE_CREDENTIALS) {
    // Production: parse the JSON string from the environment variable
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
    } catch (err) {
        console.error('[Firebase] Failed to parse FIREBASE_CREDENTIALS env var:', err.message);
        process.exit(1);
    }
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    // Local dev: load from a JSON file
    serviceAccount = require(path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH));
} else {
    console.error('[Firebase] Neither FIREBASE_CREDENTIALS nor FIREBASE_SERVICE_ACCOUNT_PATH is set.');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
