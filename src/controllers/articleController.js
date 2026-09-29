const pool = require('../config/db');

async function createArticle(req, res) {
  const { title, category, body } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'title and body are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO articles (title, category, body)
       VALUES ($1, $2, $3)
       RETURNING id, title, category, body, created_at`,
      [title, category || null, body]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create article error:', err);
    res.status(500).json({ error: 'Something went wrong creating the article' });
  }
}

async function getArticles(req, res) {
  const { category } = req.query;

  try {
    let result;
    if (category) {
      result = await pool.query(
        'SELECT id, title, category, body, created_at FROM articles WHERE category = $1 ORDER BY created_at DESC',
        [category]
      );
    } else {
      result = await pool.query(
        'SELECT id, title, category, body, created_at FROM articles ORDER BY created_at DESC'
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error('Get articles error:', err);
    res.status(500).json({ error: 'Something went wrong fetching articles' });
  }
}

async function getArticleById(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, title, category, body, created_at FROM articles WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get article error:', err);
    res.status(500).json({ error: 'Something went wrong fetching the article' });
  }
}

async function updateArticle(req, res) {
  const { id } = req.params;
  const { title, category, body } = req.body;

  try {
    const result = await pool.query(
      `UPDATE articles SET title = COALESCE($1, title), category = COALESCE($2, category), body = COALESCE($3, body)
       WHERE id = $4
       RETURNING id, title, category, body, created_at`,
      [title, category, body, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update article error:', err);
    res.status(500).json({ error: 'Something went wrong updating the article' });
  }
}

async function deleteArticle(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM articles WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('Delete article error:', err);
    res.status(500).json({ error: 'Something went wrong deleting the article' });
  }
}

module.exports = { createArticle, getArticles, getArticleById, updateArticle, deleteArticle };
