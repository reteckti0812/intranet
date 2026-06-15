const express = require('express');
const router = express.Router();
const db = require('../database.cjs');
const { requireAuth, requireAdmin } = require('../middleware/auth.cjs');

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

router.get('/', requireAuth, requireAdmin, (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const rows = db
      .prepare(`SELECT * FROM audit_log ORDER BY created_at DESC, id DESC LIMIT ?`)
      .all(limit);
    res.json(rows.map((r) => ({ ...r, details: r.details ? safeParse(r.details) : null })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
