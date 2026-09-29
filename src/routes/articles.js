const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const {
  createArticle,
  getArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
} = require('../controllers/articleController');

// Public -- anyone can read educational content, even without an account
router.get('/', getArticles);
router.get('/:id', getArticleById);

// Protected -- must be a logged-in admin to write
router.post('/', authenticateToken, requireAdmin, createArticle);
router.put('/:id', authenticateToken, requireAdmin, updateArticle);
router.delete('/:id', authenticateToken, requireAdmin, deleteArticle);

module.exports = router;
