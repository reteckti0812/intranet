const express = require('express');
const router = express.Router();
const db = require('../database.cjs');

// Listar avisos
// Se vier ?public=1, retorna só avisos válidos para a Home
router.get('/', (req, res) => {
  try {
    const { public: isPublic } = req.query;

    if (isPublic === '1') {
      const rows = db.prepare(`
        SELECT *
        FROM announcements
        WHERE expires_at IS NULL
           OR date(expires_at) >= date('now')
        ORDER BY priority DESC, created_at DESC
      `).all();

      return res.json(rows);
    }

    const rows = db.prepare(`
      SELECT *
      FROM announcements
      ORDER BY created_at DESC
    `).all();

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar novo aviso
router.post('/', (req, res) => {
  try {
    const { title, content, expires_at, priority } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Título e descrição são obrigatórios.'
      });
    }

    const info = db.prepare(`
      INSERT INTO announcements (title, content, expires_at, priority)
      VALUES (?, ?, ?, ?)
    `).run(title, content, expires_at, priority);

    res.json({
      success: true,
      id: info.lastInsertRowid,
      message: 'Aviso criado com sucesso.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Editar aviso
router.put('/:id', (req, res) => {
  try {
    const { title, content, expires_at, priority } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Título e descrição são obrigatórios.'
      });
    }

    db.prepare(`
      UPDATE announcements
      SET title = ?, content = ?, expires_at = ?, priority = ?
      WHERE id = ?
    `).run(
      title.trim(),
      content.trim(),
      expires_at || null,
      priority || 0,
      req.params.id
    );

    res.json({
      success: true,
      message: 'Aviso atualizado com sucesso.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Excluir aviso
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Aviso excluído com sucesso.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;