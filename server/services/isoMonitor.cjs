const db = require('../database.cjs');

const updateStatus = db.prepare(
  `UPDATE iso_certifications SET link_status = ?, link_http_code = ?, link_checked_at = ? WHERE id = ?`
);

/** Tenta alcançar a URL. Qualquer resposta HTTP = "online"; erro/timeout = "offline". */
async function checkUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    let res;
    try {
      res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
      if (res.status === 405 || res.status === 501) {
        res = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal });
      }
    } catch {
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal });
    }
    try { await res.body?.cancel?.(); } catch { /* ignore */ }
    return { status: 'online', code: res.status };
  } catch {
    return { status: 'offline', code: null };
  } finally {
    clearTimeout(timer);
  }
}

async function checkOne(id) {
  const cert = db.prepare(`SELECT id, url FROM iso_certifications WHERE id = ?`).get(id);
  if (!cert) return null;
  const nowIso = new Date().toISOString();
  if (!cert.url) {
    updateStatus.run('unknown', null, nowIso, id);
    return { status: 'unknown', code: null };
  }
  const r = await checkUrl(cert.url);
  updateStatus.run(r.status, r.code, nowIso, id);
  return r;
}

async function checkAll() {
  const rows = db.prepare(`SELECT id FROM iso_certifications`).all();
  for (const r of rows) {
    try { await checkOne(r.id); } catch { /* ignore */ }
  }
  return rows.length;
}

let started = false;
/** Agenda checagens periódicas (padrão: a cada 6h) e uma logo após o boot. */
function start(intervalMs = 6 * 60 * 60 * 1000) {
  if (started) return;
  started = true;
  setTimeout(() => { checkAll().catch(() => {}); }, 15000);
  setInterval(() => { checkAll().catch(() => {}); }, intervalMs);
}

module.exports = { checkOne, checkAll, start };
