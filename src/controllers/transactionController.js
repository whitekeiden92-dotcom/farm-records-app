const pool = require('../config/db');

async function verifyFarmOwnership(farmId, userId) {
  const result = await pool.query(
    'SELECT id FROM farms WHERE id = $1 AND user_id = $2',
    [farmId, userId]
  );
  return result.rows.length > 0;
}

function isValidTxnType(txn_type) {
  return txn_type === 'income' || txn_type === 'expense';
}

async function createTransaction(req, res) {
  const userId = req.user.userId;
  const { farmId } = req.params;
  const { txn_type, amount, txn_date, description } = req.body;

  if (!isValidTxnType(txn_type)) {
    return res.status(400).json({ error: "txn_type must be 'income' or 'expense'" });
  }
  if (amount === undefined || isNaN(amount)) {
    return res.status(400).json({ error: 'amount is required and must be a number' });
  }

  try {
    const ownsFarm = await verifyFarmOwnership(farmId, userId);
    if (!ownsFarm) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    const result = await pool.query(
      `INSERT INTO transactions (farm_id, txn_type, amount, txn_date, description)
       VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), $5)
       RETURNING id, farm_id, txn_type, amount, txn_date, description, created_at`,
      [farmId, txn_type, amount, txn_date || null, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create transaction error:', err);
    res.status(500).json({ error: 'Something went wrong creating the transaction' });
  }
}

async function getTransactions(req, res) {
  const userId = req.user.userId;
  const { farmId } = req.params;

  try {
    const ownsFarm = await verifyFarmOwnership(farmId, userId);
    if (!ownsFarm) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    const result = await pool.query(
      'SELECT id, farm_id, txn_type, amount, txn_date, description, created_at FROM transactions WHERE farm_id = $1 ORDER BY txn_date DESC',
      [farmId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get transactions error:', err);
    res.status(500).json({ error: 'Something went wrong fetching transactions' });
  }
}

async function getTransactionById(req, res) {
  const userId = req.user.userId;
  const { farmId, id } = req.params;

  try {
    const ownsFarm = await verifyFarmOwnership(farmId, userId);
    if (!ownsFarm) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    const result = await pool.query(
      'SELECT id, farm_id, txn_type, amount, txn_date, description, created_at FROM transactions WHERE id = $1 AND farm_id = $2',
      [id, farmId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get transaction error:', err);
    res.status(500).json({ error: 'Something went wrong fetching the transaction' });
  }
}

async function updateTransaction(req, res) {
  const userId = req.user.userId;
  const { farmId, id } = req.params;
  const { txn_type, amount, txn_date, description } = req.body;

  if (txn_type !== undefined && !isValidTxnType(txn_type)) {
    return res.status(400).json({ error: "txn_type must be 'income' or 'expense'" });
  }

  try {
    const ownsFarm = await verifyFarmOwnership(farmId, userId);
    if (!ownsFarm) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    const result = await pool.query(
      `UPDATE transactions SET txn_type = COALESCE($1, txn_type), amount = COALESCE($2, amount),
       txn_date = COALESCE($3, txn_date), description = COALESCE($4, description)
       WHERE id = $5 AND farm_id = $6
       RETURNING id, farm_id, txn_type, amount, txn_date, description, created_at`,
      [txn_type, amount, txn_date, description, id, farmId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update transaction error:', err);
    res.status(500).json({ error: 'Something went wrong updating the transaction' });
  }
}

async function deleteTransaction(req, res) {
  const userId = req.user.userId;
  const { farmId, id } = req.params;

  try {
    const ownsFarm = await verifyFarmOwnership(farmId, userId);
    if (!ownsFarm) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND farm_id = $2 RETURNING id',
      [id, farmId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('Delete transaction error:', err);
    res.status(500).json({ error: 'Something went wrong deleting the transaction' });
  }
}

module.exports = { createTransaction, getTransactions, getTransactionById, updateTransaction, deleteTransaction };
