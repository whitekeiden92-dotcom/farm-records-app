const pool = require('../config/db');

async function verifyFarmOwnership(farmId, userId) {
  const result = await pool.query(
    'SELECT id FROM farms WHERE id = $1 AND user_id = $2',
    [farmId, userId]
  );
  return result.rows.length > 0;
}

async function createLivestock(req, res) {
  const userId = req.user.userId;
  const { farmId } = req.params;
  const { animal_type, animal_count, health_notes } = req.body;

  if (!animal_type) {
    return res.status(400).json({ error: 'animal_type is required' });
  }

  try {
    const ownsFarm = await verifyFarmOwnership(farmId, userId);
    if (!ownsFarm) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    const result = await pool.query(
      `INSERT INTO livestock (farm_id, animal_type, animal_count, health_notes)
       VALUES ($1, $2, $3, $4)
       RETURNING id, farm_id, animal_type, animal_count, health_notes, created_at`,
      [farmId, animal_type, animal_count || 0, health_notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create livestock error:', err);
    res.status(500).json({ error: 'Something went wrong creating the livestock record' });
  }
}

async function getLivestock(req, res) {
  const userId = req.user.userId;
  const { farmId } = req.params;

  try {
    const ownsFarm = await verifyFarmOwnership(farmId, userId);
    if (!ownsFarm) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    const result = await pool.query(
      'SELECT id, farm_id, animal_type, animal_count, health_notes, created_at FROM livestock WHERE farm_id = $1 ORDER BY created_at DESC',
      [farmId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get livestock error:', err);
    res.status(500).json({ error: 'Something went wrong fetching livestock' });
  }
}

async function getLivestockById(req, res) {
  const userId = req.user.userId;
  const { farmId, id } = req.params;

  try {
    const ownsFarm = await verifyFarmOwnership(farmId, userId);
    if (!ownsFarm) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    const result = await pool.query(
      'SELECT id, farm_id, animal_type, animal_count, health_notes, created_at FROM livestock WHERE id = $1 AND farm_id = $2',
      [id, farmId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Livestock record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get livestock error:', err);
    res.status(500).json({ error: 'Something went wrong fetching the livestock record' });
  }
}

async function updateLivestock(req, res) {
  const userId = req.user.userId;
  const { farmId, id } = req.params;
  const { animal_type, animal_count, health_notes } = req.body;

  try {
    const ownsFarm = await verifyFarmOwnership(farmId, userId);
    if (!ownsFarm) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    const result = await pool.query(
      `UPDATE livestock SET animal_type = COALESCE($1, animal_type),
       animal_count = COALESCE($2, animal_count), health_notes = COALESCE($3, health_notes)
       WHERE id = $4 AND farm_id = $5
       RETURNING id, farm_id, animal_type, animal_count, health_notes, created_at`,
      [animal_type, animal_count, health_notes, id, farmId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Livestock record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update livestock error:', err);
    res.status(500).json({ error: 'Something went wrong updating the livestock record' });
  }
}

async function deleteLivestock(req, res) {
  const userId = req.user.userId;
  const { farmId, id } = req.params;

  try {
    const ownsFarm = await verifyFarmOwnership(farmId, userId);
    if (!ownsFarm) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    const result = await pool.query(
      'DELETE FROM livestock WHERE id = $1 AND farm_id = $2 RETURNING id',
      [id, farmId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Livestock record not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('Delete livestock error:', err);
    res.status(500).json({ error: 'Something went wrong deleting the livestock record' });
  }
}

module.exports = { createLivestock, getLivestock, getLivestockById, updateLivestock, deleteLivestock };
