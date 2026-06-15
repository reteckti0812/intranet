const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'intranet.db');
const db = new Database(dbPath);

// WAL melhora concorrência de leitura/escrita (importante com blobs).
db.pragma('journal_mode = WAL');

console.log('--- Inicializando Banco de Dados ---');

db.prepare(`
  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    expires_at DATE,
    priority INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    folder_path TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    folder_path TEXT NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    UNIQUE(department_id, name)
  )
`).run();

/**
 * documents = "documento lógico". O arquivo em si vive nas versões
 * (document_versions → document_blobs). `file_path`/`file_type` ficam como
 * legado (origem da migração); não são mais a fonte da verdade.
 */
db.prepare(`
  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    code TEXT,
    title TEXT NOT NULL,
    file_path TEXT,
    file_type TEXT,
    observation TEXT,
    current_version_id INTEGER,
    status TEXT NOT NULL DEFAULT 'rascunho',
    effective_date TEXT,
    review_date TEXT,
    approved_by INTEGER,
    approved_at TEXT,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    deleted_at TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE
  )
`).run();

/**
 * Migração da tabela `documents`:
 * - DB antigo (file_path UNIQUE NOT NULL, sem colunas de versionamento) → reconstrói.
 * - DB já novo → apenas garante colunas que possam faltar.
 */
(function migrateDocumentsTable() {
  const cols = db.prepare(`PRAGMA table_info(documents)`).all();
  const names = new Set(cols.map((c) => c.name));

  if (names.has('current_version_id')) {
    const add = (name, ddl) => {
      if (!names.has(name)) db.exec(`ALTER TABLE documents ADD COLUMN ${ddl}`);
    };
    add('observation', 'observation TEXT');
    add('status', `status TEXT NOT NULL DEFAULT 'rascunho'`);
    add('effective_date', 'effective_date TEXT');
    add('review_date', 'review_date TEXT');
    add('approved_by', 'approved_by INTEGER');
    add('approved_at', 'approved_at TEXT');
    add('is_deleted', 'is_deleted INTEGER NOT NULL DEFAULT 0');
    add('deleted_at', 'deleted_at TEXT');
    return;
  }

  // Schema antigo → reconstruir preservando os dados existentes.
  const oldNames = names;
  const obsExpr = oldNames.has('observation') ? 'observation' : 'NULL';
  const rebuild = db.transaction(() => {
    db.exec(`
      CREATE TABLE documents_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        code TEXT,
        title TEXT NOT NULL,
        file_path TEXT,
        file_type TEXT,
        observation TEXT,
        current_version_id INTEGER,
        status TEXT NOT NULL DEFAULT 'rascunho',
        effective_date TEXT,
        review_date TEXT,
        approved_by INTEGER,
        approved_at TEXT,
        is_deleted INTEGER NOT NULL DEFAULT 0,
        deleted_at TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE
      )
    `);
    // Documentos pré-existentes assumem status 'aprovado' (já estavam publicados).
    db.exec(`
      INSERT INTO documents_new
        (id, group_id, code, title, file_path, file_type, observation, status, created_at)
      SELECT id, group_id, code, title, file_path, file_type, ${obsExpr}, 'aprovado', created_at
      FROM documents
    `);
    db.exec(`DROP TABLE documents`);
    db.exec(`ALTER TABLE documents_new RENAME TO documents`);
  });
  rebuild();
})();

/** Bytes únicos, endereçados por conteúdo (sha256). Dedup transparente. */
db.prepare(`
  CREATE TABLE IF NOT EXISTS document_blobs (
    sha256 TEXT PRIMARY KEY,
    bytes BLOB NOT NULL,
    size INTEGER NOT NULL,
    mime_type TEXT,
    refcount INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

/** Cada upload de versão de um documento. */
db.prepare(`
  CREATE TABLE IF NOT EXISTS document_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    version_number INTEGER NOT NULL,
    revision_label TEXT,
    blob_sha256 TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    size INTEGER,
    change_note TEXT,
    created_by INTEGER,
    created_by_name TEXT,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (blob_sha256) REFERENCES document_blobs(sha256),
    UNIQUE(document_id, version_number)
  )
`).run();

/** Trilha de auditoria: quem fez o quê e quando. */
db.prepare(`
  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER,
    admin_name TEXT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id INTEGER,
    details TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_versions_document ON document_versions(document_id);
  CREATE INDEX IF NOT EXISTS idx_versions_blob ON document_versions(blob_sha256);
  CREATE INDEX IF NOT EXISTS idx_documents_group ON documents(group_id);
  CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
`);

db.prepare(`
  CREATE TABLE IF NOT EXISTS home_content (
    key TEXT PRIMARY KEY,
    content TEXT NOT NULL
  )
`).run();

/** Certificações ISO monitoradas (validade + disponibilidade do link). */
db.prepare(`
  CREATE TABLE IF NOT EXISTS iso_certifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    standard TEXT,
    cert_number TEXT,
    certifier TEXT,
    issued_date TEXT,
    expiry_date TEXT,
    url TEXT,
    notes TEXT,
    link_status TEXT DEFAULT 'unknown',
    link_http_code INTEGER,
    link_checked_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    url_or_path TEXT NOT NULL,
    category TEXT
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    last_login_at TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

(function migrateAdminsColumns() {
  const cols = db.prepare(`PRAGMA table_info(admins)`).all();
  const names = new Set(cols.map((c) => c.name));
  if (!names.has('role')) {
    db.exec(`ALTER TABLE admins ADD COLUMN role TEXT DEFAULT 'admin'`);
    db.prepare(`UPDATE admins SET role = 'admin' WHERE role IS NULL`).run();
  }
  if (!names.has('last_login_at')) {
    db.exec(`ALTER TABLE admins ADD COLUMN last_login_at TEXT`);
  }
})();

// Nomenclatura nova: 'super' deixou de existir → vira 'owner'.
db.prepare(`UPDATE admins SET role = 'owner' WHERE role = 'super'`).run();

// Vínculo usuário (papel 'user') ↔ setores que ele pode ver. Admin/owner veem tudo.
db.prepare(`
  CREATE TABLE IF NOT EXISTS user_departments (
    user_id INTEGER NOT NULL,
    department_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, department_id),
    FOREIGN KEY (user_id) REFERENCES admins(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
  )
`).run();
db.exec(`CREATE INDEX IF NOT EXISTS idx_user_departments_user ON user_departments(user_id)`);

/** E-mail do Owner (Fabrício Dias) após reseed / base vazia */
const DEFAULT_OWNER_EMAIL = 'rtbrti03@re-teckbr.com';

(function ensureOwnerRoleForKnownEmail() {
  db.prepare(
    `UPDATE admins SET role = 'owner' WHERE lower(trim(email)) = lower(?)`
  ).run(DEFAULT_OWNER_EMAIL);
})();

(function seedOwnerIfEmpty() {
  const { c } = db.prepare(`SELECT COUNT(*) as c FROM admins`).get();
  if (c > 0) return;
  const hash = bcrypt.hashSync('Brasil!23', 10);
  db.prepare(
    `INSERT INTO admins (name, email, password, role) VALUES (?, ?, ?, 'owner')`
  ).run('Fabrício Dias', DEFAULT_OWNER_EMAIL, hash);
})();

const seedHomeContent = db.prepare('INSERT OR IGNORE INTO home_content (key, content) VALUES (?, ?)');
seedHomeContent.run('mission', '');
seedHomeContent.run('vision', '');
seedHomeContent.run('values', '');
seedHomeContent.run('commitment', '');
seedHomeContent.run('quality_policy', '');
seedHomeContent.run('reteck_way', '');
seedHomeContent.run('reteck_way_left', '');
seedHomeContent.run('reteck_way_right', '');
seedHomeContent.run('contacts', '');
seedHomeContent.run('external_calls', '');
seedHomeContent.run('official_documents', '');
seedHomeContent.run('master_list_files', '');
seedHomeContent.run('general_documents_files', '');

console.log('✅ Banco de Dados configurado e tabelas criadas com sucesso.');

module.exports = db;
