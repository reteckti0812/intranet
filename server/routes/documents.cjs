const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('../database.cjs');
const blob = require('../services/blobStore.cjs');
const audit = require('../services/auditLog.cjs');
const { requireAuth, requireAdmin, requireOwner } = require('../middleware/auth.cjs');
const { canAccessDept, allowedDeptIds } = require('../services/access.cjs');

const EXT_MIME = {
  pdf: 'application/pdf',
  txt: 'text/plain; charset=utf-8',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};
const ALLOWED_EXT = Object.keys(EXT_MIME);
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB
const VALID_STATUS = ['rascunho', 'em_revisao', 'aprovado', 'obsoleto'];

const extOf = (name) => String(name || '').split('.').pop().toLowerCase();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_EXT.includes(extOf(file.originalname))) {
      return cb(new Error(`Tipo não permitido. Aceitos: ${ALLOWED_EXT.join(', ')}.`));
    }
    cb(null, true);
  },
});

/** Envolve o multer para devolver erros como JSON em vez de estourar. */
function uploadSingle(field) {
  return (req, res, next) => {
    upload.single(field)(req, res, (err) => {
      if (err) {
        const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Arquivo excede 50 MB.' : err.message;
        return res.status(400).json({ success: false, message: msg });
      }
      next();
    });
  };
}

// ---- Prepared statements ----------------------------------------------------

const getDoc = db.prepare(`SELECT * FROM documents WHERE id = ?`);
const getDocDept = db.prepare(
  `SELECT doc.id, doc.status, doc.is_deleted, doc.current_version_id, g.department_id
   FROM documents doc JOIN groups g ON g.id = doc.group_id WHERE doc.id = ?`
);
const getVersion = db.prepare(`SELECT * FROM document_versions WHERE id = ?`);
const maxVersionNumber = db.prepare(
  `SELECT COALESCE(MAX(version_number), 0) AS m FROM document_versions WHERE document_id = ?`
);
const insertVersion = db.prepare(`
  INSERT INTO document_versions
    (document_id, version_number, revision_label, blob_sha256, file_name, file_type, size, change_note, created_by, created_by_name)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const setCurrentVersion = db.prepare(`UPDATE documents SET current_version_id = ?, file_type = ? WHERE id = ?`);

const listDocs = db.prepare(`
  SELECT
    doc.id, doc.code, doc.title, doc.observation, doc.status,
    doc.effective_date, doc.review_date, doc.approved_at, doc.is_deleted,
    doc.created_at, doc.current_version_id,
    g.id AS group_id, g.name AS group_name,
    d.id AS department_id, d.code AS department_code, d.name AS department_name, d.slug AS department_slug,
    cv.version_number AS current_version_number,
    cv.file_name AS current_file_name,
    cv.file_type AS current_file_type,
    cv.size AS current_size,
    cv.created_at AS current_uploaded_at,
    (SELECT COUNT(*) FROM document_versions v WHERE v.document_id = doc.id AND v.is_deleted = 0) AS version_count
  FROM documents doc
  INNER JOIN groups g ON g.id = doc.group_id
  INNER JOIN departments d ON d.id = g.department_id
  LEFT JOIN document_versions cv ON cv.id = doc.current_version_id
  WHERE doc.is_deleted = ?
  ORDER BY d.code ASC, g.name COLLATE NOCASE ASC, doc.title COLLATE NOCASE ASC, doc.code COLLATE NOCASE ASC
`);

const listVersions = db.prepare(`
  SELECT id, document_id, version_number, revision_label, file_name, file_type, size,
         change_note, created_by, created_by_name, created_at
  FROM document_versions
  WHERE document_id = ? AND is_deleted = 0
  ORDER BY version_number DESC
`);

// ---- Helpers ----------------------------------------------------------------

function nowIso() {
  return new Date().toISOString();
}

function serveVersion(res, versionId, admin, expectDocId) {
  const v = getVersion.get(versionId);
  if (!v || (expectDocId != null && v.document_id !== expectDocId)) {
    return res.status(404).json({ error: 'Versão não encontrada.' });
  }
  const row = blob.readBytes(v.blob_sha256);
  if (!row) {
    return res.status(404).json({ error: 'Conteúdo não encontrado.' });
  }
  const ext = (v.file_type || '').toLowerCase();
  const contentType = row.mime_type || EXT_MIME[ext] || 'application/octet-stream';
  const fileName = v.file_name || `documento.${ext || 'bin'}`;
  const asciiName = fileName.replace(/[^\x20-\x7e]/g, '_');

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', row.size);
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
  );
  if (admin) audit.log(admin, 'download', 'version', versionId, { document_id: v.document_id });
  res.send(row.bytes);
}

// Tudo em /api/documents exige login.
router.use(requireAuth);

// ---- Visualização/download para usuários (respeita o setor) ----------------
// O documento precisa estar aprovado e pertencer a um setor que o usuário pode ver.
router.get('/public/:id/download', (req, res) => {
  const doc = getDocDept.get(Number(req.params.id));
  if (!doc || doc.is_deleted || !doc.current_version_id) {
    return res.status(404).json({ error: 'Documento não disponível.' });
  }
  if (!canAccessDept(req.admin, doc.department_id)) {
    return res.status(403).json({ error: 'Sem acesso a este setor.' });
  }
  serveVersion(res, doc.current_version_id, req.admin);
});

/** Documentos atualizados recentemente (aprovados, dentro do escopo do usuário). */
router.get('/recent', (req, res) => {
  try {
    const allowed = allowedDeptIds(req.admin); // null = todos
    if (allowed && allowed.length === 0) return res.json([]);
    const limit = Math.min(Number(req.query.limit) || 8, 30);
    const deptFilter = allowed ? ` AND d.id IN (${allowed.map(() => '?').join(',')})` : '';
    const rows = db.prepare(`
      SELECT doc.id, doc.code, doc.title,
        cv.version_number, cv.file_name, cv.file_type, cv.created_at AS updated_at,
        d.id AS department_id, d.name AS department_name, d.slug AS department_slug
      FROM documents doc
      JOIN groups g ON g.id = doc.group_id
      JOIN departments d ON d.id = g.department_id
      JOIN document_versions cv ON cv.id = doc.current_version_id
      WHERE doc.is_deleted = 0${deptFilter}
      ORDER BY cv.created_at DESC
      LIMIT ?
    `).all(...(allowed ? [...allowed, limit] : [limit]));
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---- A partir daqui, somente administradores (gestão de documentos) --------
router.use(requireAdmin);

/** Lista documentos (ativos por padrão; ?trash=1 para a lixeira). */
router.get('/', (req, res) => {
  try {
    const trash = req.query.trash === '1' ? 1 : 0;
    res.json(listDocs.all(trash));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Cria um documento lógico (sem versões ainda). */
router.post('/', (req, res) => {
  try {
    const { group_id, code, title, status } = req.body;
    if (!group_id || !title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: 'Grupo e título são obrigatórios.' });
    }
    const finalStatus = VALID_STATUS.includes(status) ? status : 'rascunho';
    const info = db
      .prepare(`INSERT INTO documents (group_id, code, title, status) VALUES (?, ?, ?, ?)`)
      .run(Number(group_id), code ? String(code).trim() : null, String(title).trim(), finalStatus);
    audit.log(req.admin, 'create_document', 'document', info.lastInsertRowid, { title });
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/** Atualiza metadados / status / aprovação de um documento. */
router.patch('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const doc = getDoc.get(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Documento não encontrado.' });

    const b = req.body || {};
    const fields = [];
    const vals = [];

    if (b.title !== undefined) {
      if (!String(b.title).trim()) {
        return res.status(400).json({ success: false, message: 'Título não pode ficar vazio.' });
      }
      fields.push('title = ?');
      vals.push(String(b.title).trim());
    }
    if (b.code !== undefined) {
      fields.push('code = ?');
      vals.push(b.code ? String(b.code).trim() : null);
    }
    if (b.observation !== undefined) {
      fields.push('observation = ?');
      vals.push(b.observation == null ? null : String(b.observation));
    }
    if (b.effective_date !== undefined) {
      fields.push('effective_date = ?');
      vals.push(b.effective_date || null);
    }
    if (b.review_date !== undefined) {
      fields.push('review_date = ?');
      vals.push(b.review_date || null);
    }
    if (b.status !== undefined) {
      const st = VALID_STATUS.includes(b.status) ? b.status : doc.status;
      fields.push('status = ?');
      vals.push(st);
      if (st === 'aprovado') {
        fields.push('approved_by = ?', 'approved_at = ?');
        vals.push(req.admin.id, nowIso());
      }
    }

    if (!fields.length) return res.json({ success: true });

    vals.push(id);
    db.prepare(`UPDATE documents SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
    audit.log(req.admin, 'update_document', 'document', id, b);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/** Lixeira (soft-delete). */
router.delete('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    db.prepare(`UPDATE documents SET is_deleted = 1, deleted_at = ? WHERE id = ?`).run(nowIso(), id);
    audit.log(req.admin, 'delete_document', 'document', id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/** Restaura da lixeira. */
router.post('/:id/restore', (req, res) => {
  try {
    const id = Number(req.params.id);
    db.prepare(`UPDATE documents SET is_deleted = 0, deleted_at = NULL WHERE id = ?`).run(id);
    audit.log(req.admin, 'restore_document', 'document', id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/** Exclusão permanente (Owner): remove documento, versões e libera blobs. */
router.delete('/:id/permanent', requireOwner, (req, res) => {
  try {
    const id = Number(req.params.id);
    const versions = db.prepare(`SELECT blob_sha256 FROM document_versions WHERE document_id = ?`).all(id);
    const tx = db.transaction(() => {
      db.prepare(`DELETE FROM document_versions WHERE document_id = ?`).run(id);
      db.prepare(`DELETE FROM documents WHERE id = ?`).run(id);
      for (const v of versions) blob.release(v.blob_sha256);
    });
    tx();
    audit.log(req.admin, 'purge_document', 'document', id, { versions: versions.length });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/** Histórico de versões. */
router.get('/:id/versions', (req, res) => {
  try {
    const id = Number(req.params.id);
    const doc = getDoc.get(id);
    if (!doc) return res.status(404).json({ error: 'Documento não encontrado.' });
    const rows = listVersions.all(id).map((v) => ({
      ...v,
      is_current: v.id === doc.current_version_id,
    }));
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Sobe uma nova versão (vira a versão atual). */
router.post('/:id/versions', uploadSingle('file'), (req, res) => {
  try {
    const id = Number(req.params.id);
    const doc = getDoc.get(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Documento não encontrado.' });
    if (!req.file) return res.status(400).json({ success: false, message: 'Arquivo não enviado.' });

    const ext = extOf(req.file.originalname);
    const mimeType = req.file.mimetype || EXT_MIME[ext] || 'application/octet-stream';
    const note = req.body.change_note ? String(req.body.change_note).trim() : null;
    const revision = req.body.revision_label ? String(req.body.revision_label).trim() : null;

    let newVersionId;
    const tx = db.transaction(() => {
      const hash = blob.storeBytes(req.file.buffer, mimeType);
      blob.retain(hash);
      const vnum = maxVersionNumber.get(id).m + 1;
      const info = insertVersion.run(
        id, vnum, revision, hash, req.file.originalname, ext, req.file.size, note, req.admin.id, req.admin.name
      );
      newVersionId = info.lastInsertRowid;
      setCurrentVersion.run(newVersionId, ext, id);
    });
    tx();

    audit.log(req.admin, 'upload_version', 'document', id, {
      version_id: newVersionId,
      file: req.file.originalname,
    });
    res.json({ success: true, version_id: newVersionId });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/** Reverte para uma versão anterior, criando uma nova versão (preserva a linha do tempo). */
router.post('/:id/versions/:vid/restore', (req, res) => {
  try {
    const id = Number(req.params.id);
    const vid = Number(req.params.vid);
    const src = db.prepare(`SELECT * FROM document_versions WHERE id = ? AND document_id = ?`).get(vid, id);
    if (!src) return res.status(404).json({ success: false, message: 'Versão não encontrada.' });

    let newVersionId;
    const tx = db.transaction(() => {
      blob.retain(src.blob_sha256);
      const vnum = maxVersionNumber.get(id).m + 1;
      const note = `Revertido para a versão ${src.version_number}`;
      const info = insertVersion.run(
        id, vnum, src.revision_label, src.blob_sha256, src.file_name, src.file_type, src.size,
        note, req.admin.id, req.admin.name
      );
      newVersionId = info.lastInsertRowid;
      setCurrentVersion.run(newVersionId, src.file_type, id);
    });
    tx();

    audit.log(req.admin, 'rollback_version', 'document', id, { from_version: vid, new_version: newVersionId });
    res.json({ success: true, version_id: newVersionId });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/** Exclui uma versão (não pode ser a atual). Libera o blob. */
router.delete('/:id/versions/:vid', (req, res) => {
  try {
    const id = Number(req.params.id);
    const vid = Number(req.params.vid);
    const doc = getDoc.get(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Documento não encontrado.' });
    if (doc.current_version_id === vid) {
      return res.status(400).json({ success: false, message: 'Não é possível excluir a versão atual.' });
    }
    const v = db.prepare(`SELECT * FROM document_versions WHERE id = ? AND document_id = ?`).get(vid, id);
    if (!v) return res.status(404).json({ success: false, message: 'Versão não encontrada.' });

    const tx = db.transaction(() => {
      db.prepare(`DELETE FROM document_versions WHERE id = ?`).run(vid);
      blob.release(v.blob_sha256);
    });
    tx();

    audit.log(req.admin, 'delete_version', 'document', id, { version: vid });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/** Download da versão atual (admin). */
router.get('/:id/download', (req, res) => {
  const doc = getDoc.get(Number(req.params.id));
  if (!doc || !doc.current_version_id) {
    return res.status(404).json({ error: 'Documento sem versão.' });
  }
  serveVersion(res, doc.current_version_id, req.admin);
});

/** Download de uma versão específica (admin). */
router.get('/:id/versions/:vid/download', (req, res) => {
  serveVersion(res, Number(req.params.vid), req.admin, Number(req.params.id));
});

module.exports = router;
