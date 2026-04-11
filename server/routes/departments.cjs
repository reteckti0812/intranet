const express = require('express');
const router = express.Router();
const db = require('../database.cjs');

const slugify = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// GET todos os departamentos
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT d.*,
      (SELECT COUNT(*) FROM groups g WHERE g.department_id = d.id) as group_count,
      (SELECT COUNT(*) FROM documents doc
        INNER JOIN groups g ON g.id = doc.group_id
        WHERE g.department_id = d.id) as doc_count
      FROM departments d ORDER BY d.code ASC
    `).all();
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET todos os grupos
router.get('/groups-all', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT g.*, d.name as department_name,
      (SELECT COUNT(*) FROM documents doc WHERE doc.group_id = g.id) as doc_count
      FROM groups g
      JOIN departments d ON g.department_id = d.id
      ORDER BY d.name ASC, g.name ASC
    `).all();
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST criar departamento
router.post('/', (req, res) => {
  try {
    const { code, name, slug } = req.body;
    const finalSlug = slug || slugify(name);
    const folderPath = `C:\\Intranet\\Documentos\\${code}${name}`;
    const info = db.prepare('INSERT INTO departments (code, name, slug, folder_path) VALUES (?, ?, ?, ?)')
      .run(code, name, finalSlug, folderPath);
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT editar departamento
router.put('/:id', (req, res) => {
  try {
    const { code, name, slug } = req.body;
    const finalSlug = slug || slugify(name);
    const folderPath = `C:\\Intranet\\Documentos\\${code}${name}`;
    db.prepare('UPDATE departments SET code=?, name=?, slug=?, folder_path=? WHERE id=?')
      .run(code, name, finalSlug, folderPath, req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE departamento
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM departments WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST criar grupo
router.post('/groups', (req, res) => {
  try {
    const { name, department_id } = req.body;
    const dept = db.prepare('SELECT * FROM departments WHERE id=?').get(department_id);
    const folderPath = `${dept.folder_path}\\${name}`;
    const info = db.prepare('INSERT INTO groups (department_id, name, folder_path) VALUES (?, ?, ?)')
      .run(department_id, name, folderPath);
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT editar grupo
router.put('/groups/:id', (req, res) => {
  try {
    const { name, department_id } = req.body;
    const dept = db.prepare('SELECT * FROM departments WHERE id=?').get(department_id);
    const folderPath = `${dept.folder_path}\\${name}`;
    db.prepare('UPDATE groups SET name=?, department_id=?, folder_path=? WHERE id=?')
      .run(name, department_id, folderPath, req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE grupo
router.delete('/groups/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM groups WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Buscar departamento por SLUG (necessário para a página de detalhes)
router.get('/by-slug/:slug', (req, res) => {
  try {
    const slug = req.params.slug.toLowerCase(); // Força minúsculo
    const department = db.prepare('SELECT * FROM departments WHERE LOWER(slug) = ?').get(slug);
    
    if (!department) {
      return res.status(404).json({ error: 'Departamento não encontrado' });
    }

    // Busca os grupos desse departamento
    const groups = db.prepare('SELECT * FROM groups WHERE department_id = ?').all(department.id);

    // Para cada grupo, busca os documentos
    const groupsWithDocs = groups.map(group => {
      const docs = db.prepare('SELECT * FROM documents WHERE group_id = ?').all(group.id);
      return { ...group, documents: docs };
    });

    res.json({ ...department, groups: groupsWithDocs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;