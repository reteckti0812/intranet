const db = require('../database.cjs');

const insert = db.prepare(`
  INSERT INTO audit_log (admin_id, admin_name, action, entity_type, entity_id, details)
  VALUES (?, ?, ?, ?, ?, ?)
`);

/**
 * Registra uma ação na trilha de auditoria. Nunca lança — falha de log não
 * deve derrubar a operação principal.
 */
function log(admin, action, entityType, entityId, details) {
  try {
    insert.run(
      admin?.id ?? null,
      admin?.name ?? null,
      action,
      entityType ?? null,
      entityId ?? null,
      details ? JSON.stringify(details) : null
    );
  } catch (e) {
    console.error('Falha ao registrar auditoria:', e.message);
  }
}

module.exports = { log };
