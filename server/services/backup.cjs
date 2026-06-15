const fs = require('fs');
const path = require('path');
const db = require('../database.cjs');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const RETENTION = 14; // mantém os últimos 14 backups

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

function prune() {
  try {
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith('intranet-') && f.endsWith('.db'))
      .map((f) => ({ f, t: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t);
    for (const x of files.slice(RETENTION)) {
      try { fs.unlinkSync(path.join(BACKUP_DIR, x.f)); } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
}

async function runBackup() {
  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    // Garante que o WAL foi aplicado ao .db antes de copiar.
    try { db.pragma('wal_checkpoint(TRUNCATE)'); } catch { /* ignore */ }
    const dest = path.join(BACKUP_DIR, `intranet-${stamp()}.db`);
    if (fs.existsSync(dest)) return; // já há backup deste minuto
    await db.backup(dest); // cópia consistente e online (better-sqlite3)
    prune();
    console.log('🗄️  Backup do banco criado:', dest);
  } catch (e) {
    console.error('Falha ao gerar backup:', e.message);
  }
}

let started = false;
/** Agenda backup diário e um logo após o boot. */
function start() {
  if (started) return;
  started = true;
  setTimeout(() => { runBackup(); }, 60 * 1000);
  setInterval(() => { runBackup(); }, 24 * 60 * 60 * 1000);
}

module.exports = { start, runBackup };
