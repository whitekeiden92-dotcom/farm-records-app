// This module creates ONE connection pool that the whole app shares.
require('dotenv').config();
const { Pool, types } = require('pg');

// Type 1082 is DATE. Returning the raw string instead of a JS Date
// avoids the timezone-shift bug from Lesson 7.
types.setTypeParser(1082, (value) => value);

// Local Postgres doesn't use SSL. Hosted providers like Neon require it.
// Detecting this from the URL itself means the same code works in both
// places -- nothing to remember to change when you deploy.
const isLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL || '');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Unexpected database error', err);
  process.exit(1);
});

module.exports = pool;
