const pool = require('../config/db');

// Confirms the farm exists AND belongs to the logged-in user, before we
// let them touch anything inside it. Every crop route checks this first.
async function verifyFarmOwnership(farmId, userId) {
  const result = await pool.query(
    'SELECT id FROM farms WHERE id = $1 AND user_id = $2',
    [farmId, userId]
  );
  return result.rows.length > 0;
}

async function createCrop(req, res) {
  const userId = req.user.userId;
  const { farmId } = req.params;
  const { crop_name, planting_date, harvest_date, status } = req.body;

  if (!crop_name) {
    return res.status(400).json({ error: 'crop_name is required' });
  }

  try {
    const ownsFarm = await verifyFarmOwnership(farmId, userId);
    if (!ownsFarm) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    const result = await pool.query(
      `INSERT INTO crops (farm_id, crop_name, planting_date, harvest_date, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, farm_id, crop_name, planting_date, harvest_date, status, created_at`,
      [farmId, crop_name, planting_date || null, harvest_date || null, status || 'planted']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create crop error:', err);
    res.status(500).json({ error: 'Something went wrong creating the crop' });
  }
}

async function getCrops(req, res) {
  const userId = req.user.userId;
  const { farmId } = req.params;

  try {
    const ownsFarm = await verifyFarmOwnership(farmId, userId);
    if (!ownsFarm) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    const result = await pool.query(
      'SELECT id, farm_id, crop_name, planting_date, harvest_date, status, created_at FROM crops WHERE farm_id = $1 ORDER BY created_at DESC',
      [farmId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get crops error:', err);
    res.status(500).json({ error: 'Something went wrong fetching crops' });
  }
}

async function getCropById(req, res) {
  const userId = req.user.userId;
  const { farmId, id } = req.params;

  try {
    const ownsFarm = await verifyFarmOwnership(farmId, userId);
    if (!ownsFarm) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    const result = await pool.query(
      'SELECT id, farm_id, crop_name, planting_date, harvest_date, status, created_at FROM crops WHERE id = $1 AND farm_id = $2',
      [id, farmId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Crop not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get crop error:', err);
    res.status(500).json({ error: 'Something went wrong fetching the crop' });
  }
}

async function updateCrop(req, res) {
  const userId = req.user.userId;
  const { farmId, id } = req.params;
  const { crop_name, planting_date, harvest_date, status } = req.body;

  try {
    const ownsFarm = await verifyFarmOwnership(farmId, userId);
    if (!ownsFarm) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    const result = await pool.query(
      `UPDATE crops SET crop_name = COALESCE($1, crop_name), planting_date = COALESCE($2, planting_date),
       harvest_date = COALESCE($3, harvest_date), status = COALESCE($4, status)
       WHERE id = $5 AND farm_id = $6
       RETURNING id, farm_id, crop_name, planting_date, harvest_date, status, created_at`,
      [crop_name, planting_date, harvest_date, status, id, farmId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Crop not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update crop error:', err);
    res.status(500).json({ error: 'Something went wrong updating the crop' });
  }
}

async function deleteCrop(req, res) {
  const userId = req.user.userId;
  const { farmId, id } = req.params;

  try {
    const ownsFarm = await verifyFarmOwnership(farmId, userId);
    if (!ownsFarm) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    const result = await pool.query(
      'DELETE FROM crops WHERE id = $1 AND farm_id = $2 RETURNING id',
      [id, farmId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Crop not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('Delete crop error:', err);
    res.status(500).json({ error: 'Something went wrong deleting the crop' });
  }
}

module.exports = { createCrop, getCrops, getCropById, updateCrop, deleteCrop };
