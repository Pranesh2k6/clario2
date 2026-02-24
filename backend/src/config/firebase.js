'use strict';

const admin = require('firebase-admin');
const path = require('path');

// Matches the initialization pattern from the Firebase Console.
// serviceAccountKey.json path is configured via FIREBASE_SERVICE_ACCOUNT_PATH in .env
const serviceAccount = require(path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
