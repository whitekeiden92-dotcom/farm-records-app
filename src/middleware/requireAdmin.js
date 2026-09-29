// Use AFTER authenticateToken -- relies on req.user already being set by it.
// Rejects anyone whose token doesn't carry role: 'admin'.
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = requireAdmin;
