const express = require('express');
const router = express.Router();
const db = require('../database.cjs');
const audit = require('../services/auditLog.cjs');
const monitor = require('../services/isoMonitor.cjs');
const { requireAuth, requireAdmin } = require('../middleware/auth.cjs');

router.use(requireAuth, requireAdmin);

const FIELDS = ['name', 'standard', 'cert_number', 'certifier', 'issued_date', 'expiry_date', 'url', 'notes'];

function pick(body) {
  const out = {};
  for (const f of FIELDS) out[f] = body[f] != null && String(body[f]).trim() !== '' ? String(body[f]).trim() : null;
  return out;
}

router.get('/', (req, res) => {
  try {
    const rows = db
      .prepare(`SELECT * FROM iso_certifications ORDER BY (expiry_date IS NULL), expiry_date ASC, name ASC`)
      .all();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', (req, res) => {
  try {
    const d = pick(req.body);
    if (!d.name) return res.status(400).json({ success: false, message: 'Nome é obrigatório.' });
    const info = db
      .prepare(`INSERT INTO iso_certifications (name, standard, cert_number, certifier, issued_date, expiry_date, url, notes)
                VALUES (@name, @standard, @cert_number, @certifier, @issued_date, @expiry_date, @url, @notes)`)
      .run(d);
    audit.log(req.admin, 'create_iso', 'iso', info.lastInsertRowid, { name: d.name });
    monitor.checkOne(info.lastInsertRowid).catch(() => {});
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const exists = db.prepare(`SELECT id FROM iso_certifications WHERE id = ?`).get(id);
    if (!exists) return res.status(404).json({ success: false, message: 'Certificação não encontrada.' });
    const d = pick(req.body);
    if (!d.name) return res.status(400).json({ success: false, message: 'Nome é obrigatório.' });
    db.prepare(`UPDATE iso_certifications SET name=@name, standard=@standard, cert_number=@cert_number,
                certifier=@certifier, issued_date=@issued_date, expiry_date=@expiry_date, url=@url, notes=@notes
                WHERE id=@id`).run({ ...d, id });
    audit.log(req.admin, 'update_iso', 'iso', id, { name: d.name });
    monitor.checkOne(id).catch(() => {});
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    db.prepare(`DELETE FROM iso_certifications WHERE id = ?`).run(id);
    audit.log(req.admin, 'delete_iso', 'iso', id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/** Verifica o link de uma certificação agora (em tempo real). */
router.post('/:id/check', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const r = await monitor.checkOne(id);
    if (!r) return res.status(404).json({ success: false, message: 'Certificação não encontrada.' });
    res.json({ success: true, cert: db.prepare(`SELECT * FROM iso_certifications WHERE id = ?`).get(id) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/** Verifica todos os links agora. */
router.post('/check-all', async (req, res) => {
  try {
    const n = await monitor.checkAll();
    res.json({ success: true, checked: n });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
