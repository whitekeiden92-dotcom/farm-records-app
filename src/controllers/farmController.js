const pool = require('../config/db');

async function createFarm(req, res) {
  const { name, location, size_hectares } = req.body;
  const userId = req.user.userId;

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO farms (user_id, name, location, size_hectares)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, location, size_hectares, created_at`,
      [userId, name, location || null, size_hectares || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create farm error:', err);
    res.status(500).json({ error: 'Something went wrong creating the farm' });
  }
}

async function getFarms(req, res) {
  const userId = req.user.userId;
  try {
    const result = await pool.query(
      'SELECT id, name, location, size_hectares, created_at FROM farms WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get farms error:', err);
    res.status(500).json({ error: 'Something went wrong fetching your farms' });
  }
}

async function getFarmById(req, res) {
  const userId = req.user.userId;
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, name, location, size_hectares, created_at FROM farms WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Farm not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get farm error:', err);
    res.status(500).json({ error: 'Something went wrong fetching the farm' });
  }
}

async function updateFarm(req, res) {
  const userId = req.user.userId;
  const { id } = req.params;
  const { name, location, size_hectares } = req.body;

  try {
    const result = await pool.query(
      `UPDATE farms SET name = COALESCE($1, name), location = COALESCE($2, location),
       size_hectares = COALESCE($3, size_hectares)
       WHERE id = $4 AND user_id = $5
       RETURNING id, name, location, size_hectares, created_at`,
      [name, location, size_hectares, id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Farm not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update farm error:', err);
    res.status(500).json({ error: 'Something went wrong updating the farm' });
  }
}

async function deleteFarm(req, res) {
  const userId = req.user.userId;
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM farms WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Farm not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('Delete farm error:', err);
    res.status(500).json({ error: 'Something went wrong deleting the farm' });
  }
}

module.exports = { createFarm, getFarms, getFarmById, updateFarm, deleteFarm };
