const express = require('express');
const router = express.Router();
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const authenticateToken = require('../middleware/auth');
const { askAssistant } = require('../controllers/assistantController');

// Each question costs real money via the Claude API, so this caps how many
// a single logged-in user can ask in a 15-minute window. Keyed by user id
// (not raw IP) so one farmer's usage never affects another's limit.
const assistantLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => (req.user ? String(req.user.userId) : ipKeyGenerator(req.ip)),
  message: { error: 'Too many questions. Please wait a few minutes and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// authenticateToken runs first so req.user exists when assistantLimiter
// reads req.user.userId as the rate-limit key.
router.post('/ask', authenticateToken, assistantLimiter, askAssistant);

module.exports = router;
