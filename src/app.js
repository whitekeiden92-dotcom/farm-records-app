const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Health check: confirms the server is up AND can reach the database.
// This is the first endpoint you should hit after setup, and it's a
// useful thing to keep around for debugging deployment issues later.
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Future routes get mounted here, e.g.:
app.use('/api/auth', require('./routes/auth'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/assistant', require('./routes/assistant'));
app.use('/api/farms', require('./middleware/auth'), require('./routes/farms'));
app.use('/api/farms/:farmId/transactions', require('./middleware/auth'), require('./routes/transactions'));
app.use('/api/farms/:farmId/livestock', require('./middleware/auth'), require('./routes/livestock'));
app.use('/api/farms/:farmId/crops', require('./middleware/auth'), require('./routes/crops'));

module.exports = app;
