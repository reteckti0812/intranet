const express = require('express');
const router = express.Router();
const db = require('../database.cjs');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { requireAuth, requireAdmin } = require('../middleware/auth.cjs');

const DOCS_ROOT = 'C:\\Intranet\\Documentos';
const HOME_ROOT = path.join(DOCS_ROOT, '_Home');
const MASTER_DIR = path.join(HOME_ROOT, 'ListaMestra');
const GENERAL_DIR = path.join(HOME_ROOT, 'DocumentosGerais');

for (const dir of [HOME_ROOT, MASTER_DIR, GENERAL_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

function keyByType(type) {
  if (type === 'master') return 'master_list_files';
  if (type === 'general') return 'general_documents_files';
  return null;
}

function diskDirByType(type) {
  if (type === 'master') return MASTER_DIR;
  if (type === 'general') return GENERAL_DIR;
  return null;
}

function publicFolderByType(type) {
  if (type === 'master') return '_Home/ListaMestra';
  if (type === 'general') return '_Home/DocumentosGerais';
  return null;
}

function readJsonList(key) {
  const row = db.prepare('SELECT content FROM home_content WHERE key = ?').get(key);
  if (!row || !row.content) return [];
  try {
    const parsed = JSON.parse(row.content);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJsonList(key, items) {
  db.prepare(`
    INSERT INTO home_content (key, content)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET content = excluded.content
  `).run(key, JSON.stringify(items));
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = diskDirByType(req.params.type);
      if (!dir) return cb(new Error('Tipo de arquivo inválido'));
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '');
      const base = path.basename(file.originalname || 'arquivo', ext)
        .replace(/[^\w\-.\s]/g, '')
        .trim()
        .replace(/\s+/g, '_');
      const ts = Date.now();
      cb(null, `${base || 'arquivo'}_${ts}${ext}`);
    },
  }),
});

// Buscar todo o conteúdo (qualquer usuário logado)
router.get('/', requireAuth, (req, res) => {
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
router.post('/batch', requireAuth, requireAdmin, (req, res) => {
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

router.post('/files/:type', requireAuth, requireAdmin, upload.single('file'), (req, res) => {
  try {
    const { type } = req.params;
    const key = keyByType(type);
    const publicFolder = publicFolderByType(type);

    if (!key || !publicFolder) {
      return res.status(400).json({ success: false, message: 'Tipo inválido.' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Arquivo não enviado.' });
    }

    const list = readJsonList(key);
    const item = {
      id: Date.now(),
      name: req.file.originalname || req.file.filename,
      stored_name: req.file.filename,
      url: `/docs/${encodeURIComponent(publicFolder).replace(/%2F/g, '/')}/${encodeURIComponent(req.file.filename)}`,
      uploaded_at: new Date().toISOString(),
    };
    list.push(item);
    writeJsonList(key, list);

    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/files/:type/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    const { type, id } = req.params;
    const key = keyByType(type);
    const dir = diskDirByType(type);
    if (!key || !dir) {
      return res.status(400).json({ success: false, message: 'Tipo inválido.' });
    }

    const numericId = Number(id);
    const list = readJsonList(key);
    const target = list.find((item) => Number(item.id) === numericId);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Arquivo não encontrado.' });
    }

    const next = list.filter((item) => Number(item.id) !== numericId);
    writeJsonList(key, next);

    if (target.stored_name) {
      const absPath = path.join(dir, target.stored_name);
      if (fs.existsSync(absPath)) {
        fs.unlinkSync(absPath);
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;