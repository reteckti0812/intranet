const express = require('express');
const router = express.Router();
const db = require('../database.cjs');

// Buscar todo o conteúdo
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, content FROM home_content').all();
    const result = {};
    rows.forEach(row => { result[row.key] = row.content; });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Salvar múltiplos campos de uma vez
router.post('/batch', (req, res) => {
  try {
    const fields = req.body; // { mission: "...", vision: "...", ... }

    const upsert = db.prepare(`
      INSERT INTO home_content (key, content)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET content = excluded.content
    `);

    const saveAll = db.transaction((data) => {
      for (const [key, value] of Object.entries(data)) {
        upsert.run(key, value);
      }
    });

    saveAll(fields);

    res.json({ success: true, message: 'Conteúdo salvo com sucesso.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;