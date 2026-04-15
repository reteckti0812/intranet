const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'intranet.db');
const db = new Database(dbPath);

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

db.prepare(`
  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    code TEXT,
    title TEXT NOT NULL,
    file_path TEXT UNIQUE NOT NULL,
    file_type TEXT,
    observation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE
  )
`).run();

(function migrateDocumentsColumns() {
  const cols = db.prepare(`PRAGMA table_info(documents)`).all();
  const names = new Set(cols.map((c) => c.name));
  if (!names.has('observation')) {
    db.exec(`ALTER TABLE documents ADD COLUMN observation TEXT`);
  }
})();

db.prepare(`
  CREATE TABLE IF NOT EXISTS home_content (
    key TEXT PRIMARY KEY,
    content TEXT NOT NULL
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

/** E-mail do único super após reseed / base vazia */
const DEFAULT_SUPER_EMAIL = 'rtbrti03@re-teckbr.com';

(function ensureSuperRoleForKnownEmail() {
  db.prepare(
    `UPDATE admins SET role = 'super' WHERE lower(trim(email)) = lower(?)`
  ).run(DEFAULT_SUPER_EMAIL);
})();

(function seedSuperAdminIfEmpty() {
  const { c } = db.prepare(`SELECT COUNT(*) as c FROM admins`).get();
  if (c > 0) return;
  const hash = bcrypt.hashSync('Brasil!23', 10);
  db.prepare(
    `INSERT INTO admins (name, email, password, role) VALUES (?, ?, ?, 'super')`
  ).run('Fabrício Dias', DEFAULT_SUPER_EMAIL, hash);
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

console.log('✅ Banco de Dados configurado e tabelas criadas com sucesso.');

module.exports = db;