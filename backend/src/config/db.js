'use strict';

const { Pool } = require('pg');

// A single connection pool shared across the entire application.
// pg reads the DATABASE_URL from the environment automatically.
const config = {
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
};

// Add SSL for remote/hosted databases if not in dev
if (process.env.NODE_ENV !== 'development' || (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech'))) {
    config.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(config);

pool.on('error', (err) => {
    console.error('[DB] Unexpected idle client error:', err.message);
    process.exit(1);
});

/**
 * Execute a parameterised SQL query.
 * @param {string} text  - SQL query string with $1, $2... placeholders
 * @param {Array}  params - Parameter values
 */
const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
