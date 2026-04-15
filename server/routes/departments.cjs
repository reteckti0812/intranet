const express = require('express');
const router = express.Router();
const db = require('../database.cjs');

const slugify = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const isNumericCode = (code) => /^\d+$/.test(String(code || '').trim());
const buildDepartmentFolderPath = (code, name) => `C:\\Intranet\\Documentos\\${code}${name}`;
const codeWidth = (code) => Math.max(2, String(code || '').length);

// GET todos os departamentos
router.get('/', (req, res) => {
  try {
    const onlyPublic = req.query.public === '1';
    const wherePublic = onlyPublic
      ? `WHERE d.code <> '' AND d.code NOT GLOB '*[^0-9]*'`
      : '';
    const rows = db.prepare(`
      SELECT d.*,
      (SELECT COUNT(*) FROM groups g WHERE g.department_id = d.id) as group_count,
      (SELECT COUNT(*) FROM documents doc
        INNER JOIN groups g ON g.id = doc.group_id
        WHERE g.department_id = d.id) as doc_count
      FROM departments d
      ${wherePublic}
      ORDER BY d.code ASC
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

// GET todos os documentos com contexto (admin)
router.get('/documents-all', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT
        doc.id,
        doc.code,
        doc.title,
        doc.file_path,
        doc.file_type,
        doc.created_at,
        doc.observation,
        g.id as group_id,
        g.name as group_name,
        d.id as department_id,
        d.code as department_code,
        d.name as department_name,
        d.slug as department_slug
      FROM documents doc
      INNER JOIN groups g ON g.id = doc.group_id
      INNER JOIN departments d ON d.id = g.department_id
      ORDER BY
        d.code ASC,
        CASE WHEN LOWER(g.name) = 'procedimentos' THEN 0 ELSE 1 END,
        g.name COLLATE NOCASE ASC,
        doc.title COLLATE NOCASE ASC,
        doc.code COLLATE NOCASE ASC
    `).all();
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT atualizar observação de documento
router.put('/documents/:id/observation', (req, res) => {
  try {
    const id = Number(req.params.id);
    const observation = req.body?.observation == null ? null : String(req.body.observation);

    const exists = db.prepare('SELECT id FROM documents WHERE id = ?').get(id);
    if (!exists) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }

    db.prepare('UPDATE documents SET observation = ? WHERE id = ?').run(observation, id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET busca global de documentos (todos os departamentos)
router.get('/search-documents', (req, res) => {
  try {
    const rawQuery = String(req.query.q || '').trim();
    const onlyPublic = req.query.public === '1';
    if (!rawQuery) {
      return res.json([]);
    }

    const like = `%${rawQuery.toLowerCase()}%`;
    const wherePublic = onlyPublic
      ? `AND d.code <> '' AND d.code NOT GLOB '*[^0-9]*'`
      : '';
    const rows = db.prepare(`
      SELECT
        doc.id,
        doc.code,
        doc.title,
        doc.file_path,
        doc.file_type,
        g.id as group_id,
        g.name as group_name,
        d.id as department_id,
        d.code as department_code,
        d.name as department_name,
        d.slug as department_slug
      FROM documents doc
      INNER JOIN groups g ON g.id = doc.group_id
      INNER JOIN departments d ON d.id = g.department_id
      WHERE
        LOWER(doc.title) LIKE ?
        OR LOWER(COALESCE(doc.code, '')) LIKE ?
        ${wherePublic}
      ORDER BY doc.title COLLATE NOCASE ASC, doc.code COLLATE NOCASE ASC
      LIMIT 100
    `).all(like, like);

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
    const departmentId = Number(req.params.id);
    const getDept = db.prepare('SELECT id, code, name, folder_path FROM departments WHERE id = ?');
    const target = getDept.get(departmentId);
    if (!target) {
      return res.status(404).json({ error: 'Departamento não encontrado' });
    }

    const tx = db.transaction(() => {
      db.prepare('DELETE FROM departments WHERE id = ?').run(departmentId);

      if (!isNumericCode(target.code)) return;

      const removedCode = Number(target.code);
      const width = codeWidth(target.code);

      const affected = db.prepare(`
        SELECT id, code, name, slug, folder_path
        FROM departments
        WHERE code <> '' AND code NOT GLOB '*[^0-9]*' AND CAST(code AS INTEGER) > ?
        ORDER BY CAST(code AS INTEGER) ASC
      `).all(removedCode);

      const updateDept = db.prepare(`
        UPDATE departments
        SET code = ?, slug = ?, folder_path = ?
        WHERE id = ?
      `);

      const moveGroupPaths = db.prepare(`
        UPDATE groups
        SET folder_path = REPLACE(folder_path, ?, ?)
        WHERE department_id = ? AND folder_path LIKE ?
      `);

      const moveDocPaths = db.prepare(`
        UPDATE documents
        SET file_path = REPLACE(file_path, ?, ?)
        WHERE group_id IN (SELECT id FROM groups WHERE department_id = ?)
          AND file_path LIKE ?
      `);

      for (const dept of affected) {
        const oldPath = dept.folder_path || buildDepartmentFolderPath(dept.code, dept.name);
        const nextCodeNum = Number(dept.code) - 1;
        const nextCode = String(nextCodeNum).padStart(width, '0');
        const nextSlug = slugify(`${nextCode}-${dept.name}`);
        const nextPath = buildDepartmentFolderPath(nextCode, dept.name);

        updateDept.run(nextCode, nextSlug, nextPath, dept.id);
        moveGroupPaths.run(oldPath, nextPath, dept.id, `${oldPath}%`);
        moveDocPaths.run(oldPath, nextPath, dept.id, `${oldPath}%`);
      }
    });

    tx();
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
    if (!isNumericCode(department.code)) {
      return res.status(404).json({ error: 'Departamento não encontrado' });
    }

    // Busca os grupos desse departamento
    const groups = db.prepare(`
      SELECT *
      FROM groups
      WHERE department_id = ?
      ORDER BY
        CASE
          WHEN LOWER(name) = 'procedimentos' THEN 0
          WHEN LOWER(name) = 'outros' THEN 2
          ELSE 1
        END,
        name COLLATE NOCASE ASC
    `).all(department.id);

    // Para cada grupo, busca os documentos
    const groupsWithDocs = groups.map(group => {
      const docs = db.prepare(`
        SELECT *
        FROM documents
        WHERE group_id = ?
        ORDER BY
          CASE WHEN TRIM(COALESCE(code, '')) = '' THEN 1 ELSE 0 END,
          code COLLATE NOCASE ASC,
          title COLLATE NOCASE ASC
      `).all(group.id);
      return { ...group, documents: docs };
    });

    res.json({ ...department, groups: groupsWithDocs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;