const fs = require('fs');
const path = require('path');
const db = require('../database.cjs');

const ROOT_PATH = 'C:\\Intranet\\Documentos';

const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.doc', '.docx', '.xls', '.xlsx'];

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function parseDepartmentFolder(folderName) {
  const cleanName = String(folderName || '').trim();
  const match = cleanName.match(/^(\d+)\s*[-_]?\s*(.+)$/);

  if (match) {
    return {
      code: match[1].trim(),
      name: match[2].trim(),
    };
  }

  return {
    code: `AUTO_${slugify(cleanName).toUpperCase()}`,
    name: cleanName,
  };
}

function parseDocumentFile(fileNameWithoutExt) {
  const clean = String(fileNameWithoutExt || '').trim();
  const parts = clean.split(/\s-\s(.+)/);
  if (parts.length >= 3) {
    return {
      code: parts[0].trim(),
      title: parts[1].trim(),
    };
  }

  const match = clean.match(/^(\d+)\s*[-_]?\s*(.*)$/);

  if (match && match[2].trim()) {
    return {
      code: match[1].trim(),
      title: match[2].trim(),
    };
  }

  return {
    code: '',
    title: clean,
  };
}

const rootResolved = () => path.resolve(ROOT_PATH);

function normalizeKey(p) {
  return path.resolve(String(p || '')).toLowerCase();
}

function isPathUnderDocumentos(absPath) {
  const root = rootResolved();
  const file = path.resolve(absPath);
  return file === root || file.startsWith(root + path.sep);
}

const persistMeta = db.prepare(`
  INSERT INTO home_content (key, content) VALUES (?, ?)
  ON CONFLICT(key) DO UPDATE SET content = excluded.content
`);

function persistIntranetSync(stats) {
  const nowIso = new Date().toISOString();
  persistMeta.run('last_sync_intranet_at', nowIso);
  persistMeta.run('last_sync_intranet_stats', JSON.stringify(stats));
}

function persistDocumentsSync(stats) {
  const nowIso = new Date().toISOString();
  persistMeta.run('last_sync_documents_at', nowIso);
  persistMeta.run('last_sync_documents_stats', JSON.stringify(stats));
}

/** PDF mínimo válido para placeholder */
const MINIMAL_PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\nxref\n0 3\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \ntrailer<</Size 3/Root 1 0 R>>\nstartxref\n106\n%%EOF\n',
  'utf8'
);

function writePlaceholderFile(filePath, fileType) {
  const ext = String(fileType || '').toLowerCase().replace(/^\./, '');
  const parent = path.dirname(filePath);
  fs.mkdirSync(parent, { recursive: true });

  let buf;
  if (ext === 'pdf') {
    buf = MINIMAL_PDF;
  } else if (ext === 'txt') {
    buf = Buffer.from(
      'Placeholder — substitua este ficheiro na pasta Documentos e use "Sincronizar a Intranet" para atualizar o site.\n',
      'utf8'
    );
  } else {
    buf = Buffer.from(
      'Placeholder (Intranet). Substitua o ficheiro e sincronize a Intranet.\n',
      'utf8'
    );
  }

  fs.writeFileSync(filePath, buf);
}

function walkDocumentFiles(dir, out) {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walkDocumentFiles(full, out);
    } else if (ent.isFile() && !ent.name.startsWith('~$')) {
      const ext = path.extname(ent.name).toLowerCase();
      if (ALLOWED_EXTENSIONS.includes(ext)) {
        out.push(full);
      }
    }
  }
  return out;
}

function addPathAndParents(targetSet, absPath) {
  let cur = path.resolve(absPath);
  const root = rootResolved();
  while (cur && (cur === root || cur.startsWith(root + path.sep))) {
    targetSet.add(cur.toLowerCase());
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
}

/**
 * Pasta Documentos → base de dados (website / intranet)
 */
function syncFoldersToDatabase() {
  if (!fs.existsSync(ROOT_PATH)) {
    throw new Error(`Caminho não encontrado: ${ROOT_PATH}`);
  }

  const stats = {
    processedFiles: 0,
    removed: 0,
    totalDocs: 0,
    totalDepts: 0,
  };

  const scannedDocumentPaths = new Set();

  const upsertDepartment = db.prepare(`
    INSERT INTO departments (code, name, slug, folder_path)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(code) DO UPDATE SET
      name = excluded.name,
      slug = excluded.slug,
      folder_path = excluded.folder_path
  `);

  const getDepartmentByCode = db.prepare(`
    SELECT id FROM departments WHERE code = ?
  `);

  const upsertGroup = db.prepare(`
    INSERT INTO groups (department_id, name, folder_path)
    VALUES (?, ?, ?)
    ON CONFLICT(department_id, name) DO UPDATE SET
      folder_path = excluded.folder_path
  `);

  const getGroupByDeptAndName = db.prepare(`
    SELECT id FROM groups WHERE department_id = ? AND name = ?
  `);

  const upsertDocument = db.prepare(`
    INSERT INTO documents (group_id, code, title, file_path, file_type)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(file_path) DO UPDATE SET
      group_id = excluded.group_id,
      code = excluded.code,
      title = excluded.title,
      file_type = excluded.file_type
  `);

  const getAllDocuments = db.prepare(`
    SELECT id, file_path FROM documents
  `);

  const deleteDocumentById = db.prepare(`
    DELETE FROM documents WHERE id = ?
  `);

  const transaction = db.transaction(() => {
    const rootEntries = fs.readdirSync(ROOT_PATH, { withFileTypes: true });
    const departmentDirs = rootEntries.filter((entry) => entry.isDirectory());

    stats.totalDepts = departmentDirs.length;

    for (const deptEntry of departmentDirs) {
      const deptFolder = deptEntry.name;
      const deptPath = path.join(ROOT_PATH, deptFolder);

      const { code, name } = parseDepartmentFolder(deptFolder);

      if (!name) continue;

      const slug = slugify(`${code}-${name}`);

      upsertDepartment.run(code, name, slug, deptPath);

      const department = getDepartmentByCode.get(code);
      if (!department) continue;

      const deptId = department.id;

      const deptEntries = fs.readdirSync(deptPath, { withFileTypes: true });
      const groupDirs = deptEntries.filter((entry) => entry.isDirectory());

      for (const groupEntry of groupDirs) {
        const groupName = groupEntry.name.trim();
        const groupPath = path.join(deptPath, groupEntry.name);

        if (!groupName) continue;

        upsertGroup.run(deptId, groupName, groupPath);

        const group = getGroupByDeptAndName.get(deptId, groupName);
        if (!group) continue;

        const groupId = group.id;

        const fileEntries = fs.readdirSync(groupPath, { withFileTypes: true });

        for (const fileEntry of fileEntries) {
          if (!fileEntry.isFile()) continue;
          if (fileEntry.name.startsWith('~$')) continue;

          const ext = path.extname(fileEntry.name).toLowerCase();
          if (!ALLOWED_EXTENSIONS.includes(ext)) continue;

          const fullPath = path.join(groupPath, fileEntry.name);
          const baseName = path.parse(fileEntry.name).name;

          const { code: fileCode, title } = parseDocumentFile(baseName);

          upsertDocument.run(
            groupId,
            fileCode,
            title || baseName,
            fullPath,
            ext.replace('.', '')
          );

          scannedDocumentPaths.add(fullPath);
          stats.totalDocs += 1;
          stats.processedFiles += 1;
        }
      }
    }

    const existingDocs = getAllDocuments.all();

    for (const doc of existingDocs) {
      if (!scannedDocumentPaths.has(doc.file_path)) {
        deleteDocumentById.run(doc.id);
        stats.removed += 1;
      }
    }
  });

  transaction();

  persistIntranetSync({
    totalDepts: stats.totalDepts,
    totalDocs: stats.totalDocs,
    removed: stats.removed,
    processedFiles: stats.processedFiles,
  });

  return stats;
}

/**
 * Base de dados → pasta Documentos (cria pastas/ficheiros em falta, remove ficheiros extra)
 */
function syncDatabaseToDocumentos() {
  if (!fs.existsSync(ROOT_PATH)) {
    fs.mkdirSync(ROOT_PATH, { recursive: true });
  }

  const stats = {
    foldersEnsured: 0,
    filesCreated: 0,
    filesDeleted: 0,
    totalDepts: 0,
    totalGroups: 0,
    totalDocs: 0,
  };

  const departments = db.prepare(`SELECT id, folder_path FROM departments`).all();
  const groups = db.prepare(`SELECT id, folder_path FROM groups`).all();
  const documents = db.prepare(`SELECT file_path, file_type FROM documents`).all();

  stats.totalDepts = departments.length;
  stats.totalGroups = groups.length;
  stats.totalDocs = documents.length;

  const keepDirs = new Set();
  const expectedFileKeys = new Set();

  for (const d of departments) {
    if (!d.folder_path || !isPathUnderDocumentos(d.folder_path)) {
      throw new Error(`Departamento id=${d.id}: folder_path inválido ou fora de Documentos: ${d.folder_path}`);
    }
    fs.mkdirSync(d.folder_path, { recursive: true });
    stats.foldersEnsured += 1;
    addPathAndParents(keepDirs, d.folder_path);
  }

  for (const g of groups) {
    if (!g.folder_path || !isPathUnderDocumentos(g.folder_path)) {
      throw new Error(`Grupo id=${g.id}: folder_path inválido ou fora de Documentos: ${g.folder_path}`);
    }
    fs.mkdirSync(g.folder_path, { recursive: true });
    stats.foldersEnsured += 1;
    addPathAndParents(keepDirs, g.folder_path);
  }

  for (const doc of documents) {
    if (!doc.file_path || !isPathUnderDocumentos(doc.file_path)) {
      throw new Error(`Documento com caminho inválido ou fora de Documentos: ${doc.file_path}`);
    }
    addPathAndParents(keepDirs, path.dirname(doc.file_path));
    expectedFileKeys.add(normalizeKey(doc.file_path));

    const dir = path.dirname(doc.file_path);
    fs.mkdirSync(dir, { recursive: true });

    if (!fs.existsSync(doc.file_path)) {
      writePlaceholderFile(doc.file_path, doc.file_type);
      stats.filesCreated += 1;
    }
  }

  const onDisk = [];
  walkDocumentFiles(ROOT_PATH, onDisk);

  for (const filePath of onDisk) {
    const key = normalizeKey(filePath);
    if (!expectedFileKeys.has(key)) {
      fs.unlinkSync(filePath);
      stats.filesDeleted += 1;
    }
  }

  function pruneEmptyDirs(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.isDirectory()) {
        pruneEmptyDirs(path.join(dir, ent.name));
      }
    }
    const rel = normalizeKey(dir);
    if (rel === normalizeKey(ROOT_PATH)) return;
    if (keepDirs.has(rel)) return;
    try {
      const left = fs.readdirSync(dir);
      if (left.length === 0) {
        fs.rmdirSync(dir);
      }
    } catch (_) {
      /* ignore */
    }
  }

  pruneEmptyDirs(ROOT_PATH);

  persistDocumentsSync({
    totalDepts: stats.totalDepts,
    totalGroups: stats.totalGroups,
    totalDocs: stats.totalDocs,
    foldersEnsured: stats.foldersEnsured,
    filesCreated: stats.filesCreated,
    filesDeleted: stats.filesDeleted,
  });

  return stats;
}

module.exports = {
  syncFoldersToDatabase,
  syncDatabaseToDocumentos,
  ROOT_PATH,
};
