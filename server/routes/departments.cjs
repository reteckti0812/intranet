const express = require('express');
const router = express.Router();
const db = require('../database.cjs');
const { requireAuth, requireAdmin } = require('../middleware/auth.cjs');
const { allowedDeptIds, canAccessDept } = require('../services/access.cjs');

const slugify = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const isNumericCode = (code) => /^\d+$/.test(String(code || '').trim());
const buildDepartmentFolderPath = (code, name) => `C:\\Intranet\\Documentos\\${code}${name}`;
const codeWidth = (code) => Math.max(2, String(code || '').length);

// GET todos os departamentos (escopo por setor para usuários comuns)
router.get('/', requireAuth, (req, res) => {
  try {
    const allowed = allowedDeptIds(req.admin); // null = todos
    const onlyPublic = req.query.public === '1';
    const wherePublic = onlyPublic
      ? `WHERE d.code <> '' AND d.code NOT GLOB '*[^0-9]*'`
      : '';
    // No site público só contam documentos aprovados e não excluídos.
    const docFilter = onlyPublic
      ? `AND doc.is_deleted = 0 AND doc.current_version_id IS NOT NULL`
      : `AND doc.is_deleted = 0`;
    const rows = db.prepare(`
      SELECT d.*,
      (SELECT COUNT(*) FROM groups g WHERE g.department_id = d.id) as group_count,
      (SELECT COUNT(*) FROM documents doc
        INNER JOIN groups g ON g.id = doc.group_id
        WHERE g.department_id = d.id ${docFilter}) as doc_count
      FROM departments d
      ${wherePublic}
      ORDER BY d.code ASC
    `).all();
    const scoped = allowed === null ? rows : rows.filter((r) => allowed.includes(r.id));
    res.json(scoped);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET todos os grupos
router.get('/groups-all', requireAuth, requireAdmin, (req, res) => {
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
router.get('/documents-all', requireAuth, requireAdmin, (req, res) => {
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
        CASE WHEN LOWER(g.name) LIKE 'procedimento%' THEN 0 ELSE 1 END,
        g.name COLLATE NOCASE ASC,
        doc.title COLLATE NOCASE ASC,
        doc.code COLLATE NOCASE ASC
    `).all();
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT atualizar observação de documento
router.put('/documents/:id/observation', requireAuth, requireAdmin, (req, res) => {
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

// GET busca global de documentos (escopo por setor para usuários comuns)
router.get('/search-documents', requireAuth, (req, res) => {
  try {
    const allowed = allowedDeptIds(req.admin);
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
        doc.status,
        cv.file_type as file_type,
        cv.file_name as file_name,
        g.id as group_id,
        g.name as group_name,
        d.id as department_id,
        d.code as department_code,
        d.name as department_name,
        d.slug as department_slug
      FROM documents doc
      INNER JOIN groups g ON g.id = doc.group_id
      INNER JOIN departments d ON d.id = g.department_id
      LEFT JOIN document_versions cv ON cv.id = doc.current_version_id
      WHERE
        doc.is_deleted = 0
        AND doc.current_version_id IS NOT NULL
        AND (LOWER(doc.title) LIKE ? OR LOWER(COALESCE(doc.code, '')) LIKE ?)
        ${wherePublic}
      ORDER BY doc.title COLLATE NOCASE ASC, doc.code COLLATE NOCASE ASC
      LIMIT 100
    `).all(like, like);

    const scoped = allowed === null ? rows : rows.filter((r) => allowed.includes(r.department_id));
    res.json(scoped);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST criar departamento
router.post('/', requireAuth, requireAdmin, (req, res) => {
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
router.put('/:id', requireAuth, requireAdmin, (req, res) => {
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
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
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
router.post('/groups', requireAuth, requireAdmin, (req, res) => {
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
router.put('/groups/:id', requireAuth, requireAdmin, (req, res) => {
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
router.delete('/groups/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM groups WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Buscar departamento por SLUG (necessário para a página de detalhes)
router.get('/by-slug/:slug', requireAuth, (req, res) => {
  try {
    const slug = req.params.slug.toLowerCase(); // Força minúsculo
    const department = db.prepare('SELECT * FROM departments WHERE LOWER(slug) = ?').get(slug);

    if (!department) {
      return res.status(404).json({ error: 'Departamento não encontrado' });
    }
    if (!isNumericCode(department.code)) {
      return res.status(404).json({ error: 'Departamento não encontrado' });
    }
    // Usuário comum só acessa os setores aos quais está vinculado.
    if (!canAccessDept(req.admin, department.id)) {
      return res.status(404).json({ error: 'Departamento não encontrado' });
    }

    // Busca os grupos desse departamento
    const groups = db.prepare(`
      SELECT *
      FROM groups
      WHERE department_id = ?
      ORDER BY
        CASE
          WHEN LOWER(name) LIKE 'procedimento%' THEN 0
          WHEN LOWER(name) = 'outros' THEN 2
          ELSE 1
        END,
        name COLLATE NOCASE ASC
    `).all(department.id);

    // Mostra todo documento com arquivo (qualquer status, exceto excluído na lixeira)
    const groupsWithDocs = groups.map(group => {
      const docs = db.prepare(`
        SELECT
          doc.id,
          doc.code,
          doc.title,
          doc.observation,
          doc.status,
          doc.effective_date as effective_date,
          cv.file_type as file_type,
          cv.file_name as file_name,
          cv.size as size,
          cv.version_number as version_number,
          cv.created_at as updated_at
        FROM documents doc
        LEFT JOIN document_versions cv ON cv.id = doc.current_version_id
        WHERE doc.group_id = ?
          AND doc.is_deleted = 0
          AND doc.current_version_id IS NOT NULL
        ORDER BY
          CASE WHEN TRIM(COALESCE(doc.code, '')) = '' THEN 1 ELSE 0 END,
          doc.code COLLATE NOCASE ASC,
          doc.title COLLATE NOCASE ASC
      `).all(group.id);
      return { ...group, documents: docs };
    });

    res.json({ ...department, groups: groupsWithDocs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;