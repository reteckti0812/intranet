const db = require('../database.cjs');
const { isAdminRole } = require('../middleware/auth.cjs');

const selUserDepts = db.prepare('SELECT department_id FROM user_departments WHERE user_id = ?');

/**
 * IDs de departamentos que o usuário pode ver.
 * - admin/owner → null (significa "todos").
 * - user → array de ids vinculados (pode ser vazio = não vê nada).
 */
function allowedDeptIds(admin) {
  if (!admin) return [];
  if (isAdminRole(admin.role)) return null;
  return selUserDepts.all(admin.id).map((r) => r.department_id);
}

/** True se o usuário pode acessar o departamento dado. */
function canAccessDept(admin, departmentId) {
  const allowed = allowedDeptIds(admin);
  if (allowed === null) return true;
  return allowed.includes(Number(departmentId));
}

module.exports = { allowedDeptIds, canAccessDept };
