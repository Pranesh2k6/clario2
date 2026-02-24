'use strict';

const { Pool } = require('pg');

// A single connection pool shared across the entire application.
// pg reads the DATABASE_URL from the environment automatically.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Allow up to 20 connections; good balance for a single Node process.
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

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
