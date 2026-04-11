const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'intranet.db');
const db = new Database(dbPath);

console.log('--- Inicializando Banco de Dados ---');

db.prepare(`
  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    expiry_date DATE,
    status TEXT DEFAULT 'active',
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
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_extension TEXT,
    last_sync DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
  )
`).run();

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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

const seedHomeContent = db.prepare('INSERT OR IGNORE INTO home_content (key, content) VALUES (?, ?)');
seedHomeContent.run('mission', 'Sua Missão aqui...');
seedHomeContent.run('vision', 'Sua Visão aqui...');
seedHomeContent.run('values', 'Seus Valores aqui...');
seedHomeContent.run('commitment', 'Seu Compromisso aqui...');
seedHomeContent.run('quality_policy', 'Sua Política da Qualidade aqui...');
seedHomeContent.run('reteck_way', 'Jeito Re-Teck de Ser aqui...');
seedHomeContent.run('contacts', 'Contatos aqui...');
seedHomeContent.run('external_calls', 'Instruções para ligações externas aqui...');
seedHomeContent.run('official_documents', 'Texto sobre Documentos Oficiais aqui...');

console.log('✅ Banco de Dados configurado e tabelas criadas com sucesso.');

module.exports = db;