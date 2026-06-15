const express = require('express');
const router = express.Router();
const db = require('../database.cjs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const audit = require('../services/auditLog.cjs');
const { requireAuth, requireAdmin, normRole, JWT_SECRET } = require('../middleware/auth.cjs');

const VALID_ROLES = ['owner', 'admin', 'user'];

// ---- Setores do usuário ----------------------------------------------------
const delUserDepts = db.prepare('DELETE FROM user_departments WHERE user_id = ?');
const insUserDept = db.prepare('INSERT OR IGNORE INTO user_departments (user_id, department_id) VALUES (?, ?)');
const deptExists = db.prepare('SELECT 1 AS ok FROM departments WHERE id = ?');
const listUserDepts = db.prepare(
  `SELECT d.id, d.code, d.name FROM user_departments ud
   JOIN departments d ON d.id = ud.department_id WHERE ud.user_id = ? ORDER BY d.code`
);

function setUserDepartments(userId, ids) {
  const tx = db.transaction(() => {
    delUserDepts.run(userId);
    if (Array.isArray(ids)) {
      for (const raw of ids) {
        const n = Number(raw);
        if (Number.isFinite(n) && deptExists.get(n)) insUserDept.run(userId, n);
      }
    }
  });
  tx();
}

function getAdminRowById(id) {
  const r = db.prepare('SELECT id, name, email, role, last_login_at, created_at FROM admins WHERE id = ?').get(id);
  if (!r) return null;
  return { ...r, role: normRole(r.role), departments: listUserDepts.all(id) };
}

// ---- Rate-limit simples no login (memória) ---------------------------------
const attempts = new Map();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000;
function rlAllowed(key) {
  const now = Date.now();
  const e = attempts.get(key);
  if (!e || now - e.first > WINDOW_MS) {
    attempts.set(key, { count: 0, first: now });
    return true;
  }
  return e.count < MAX_ATTEMPTS;
}
function rlBump(key) {
  const e = attempts.get(key);
  if (e) e.count += 1;
}

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const key = `${req.ip || 'ip'}|${String(email || '').toLowerCase().trim()}`;

    if (!rlAllowed(key)) {
      return res.status(429).json({ success: false, message: 'Muitas tentativas. Tente novamente em alguns minutos.' });
    }

    const admin = db.prepare('SELECT * FROM admins WHERE lower(trim(email)) = lower(trim(?))').get(email);
    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      rlBump(key);
      return res.status(401).json({ success: false, message: 'E-mail ou senha inválidos.' });
    }

    attempts.delete(key);
    const role = normRole(admin.role);
    const token = jwt.sign({ id: admin.id, name: admin.name, email: admin.email, role }, JWT_SECRET, { expiresIn: '8h' });
    db.prepare('UPDATE admins SET last_login_at = ? WHERE id = ?').run(new Date().toISOString(), admin.id);

    res.json({
      success: true,
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email, role, departments: listUserDepts.all(admin.id) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---- Gestão de usuários: somente admin/owner -------------------------------
router.use(requireAuth, requireAdmin);

router.get('/', (req, res) => {
  try {
    const rows = db
      .prepare(`SELECT id, name, email, role, last_login_at, created_at FROM admins
                ORDER BY CASE WHEN role = 'owner' THEN 0 WHEN role = 'admin' THEN 1 ELSE 2 END, name ASC`)
      .all();
    res.json(rows.map((r) => ({ ...r, role: normRole(r.role), departments: listUserDepts.all(r.id) })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, email, password, role, department_ids } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Nome, e-mail e senha são obrigatórios.' });
    }

    let finalRole = VALID_ROLES.includes(role) ? role : 'user';
    if (req.admin.role !== 'owner' && finalRole === 'owner') {
      return res.status(403).json({ success: false, message: 'Apenas o Owner pode criar outro Owner.' });
    }

    const hashed = bcrypt.hashSync(password, 10);
    const info = db
      .prepare('INSERT INTO admins (name, email, password, role) VALUES (?, ?, ?, ?)')
      .run(name.trim(), email.trim().toLowerCase(), hashed, finalRole);

    // Setores só fazem sentido para 'user'; admin/owner veem tudo.
    setUserDepartments(info.lastInsertRowid, finalRole === 'user' ? department_ids : []);

    const row = getAdminRowById(info.lastInsertRowid);
    audit.log(req.admin, 'create_admin', 'admin', row.id, { name: row.name, role: row.role });
    res.json({ success: true, admin: row });
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) {
      return res.status(409).json({ success: false, message: 'Este e-mail já está em uso.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const target = db.prepare('SELECT * FROM admins WHERE id = ?').get(id);
    if (!target) return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });

    const targetRole = normRole(target.role);
    if (req.admin.role !== 'owner' && targetRole === 'owner') {
      return res.status(403).json({ success: false, message: 'Não é permitido alterar o Owner.' });
    }

    const { name, email, password, role, department_ids } = req.body;
    let nextRole = targetRole;
    if (role !== undefined) {
      const wanted = VALID_ROLES.includes(role) ? role : 'user';
      if (req.admin.role !== 'owner') {
        if (wanted === 'owner') {
          return res.status(403).json({ success: false, message: 'Apenas o Owner pode definir o papel Owner.' });
        }
        nextRole = wanted === 'admin' ? 'admin' : 'user';
      } else {
        nextRole = wanted;
      }
    }

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Nome e e-mail são obrigatórios.' });
    }

    if (password && String(password).length > 0) {
      const hashed = bcrypt.hashSync(password, 10);
      db.prepare('UPDATE admins SET name = ?, email = ?, password = ?, role = ? WHERE id = ?')
        .run(name.trim(), email.trim().toLowerCase(), hashed, nextRole, id);
    } else {
      db.prepare('UPDATE admins SET name = ?, email = ?, role = ? WHERE id = ?')
        .run(name.trim(), email.trim().toLowerCase(), nextRole, id);
    }

    if (department_ids !== undefined) {
      setUserDepartments(id, nextRole === 'user' ? department_ids : []);
    } else if (nextRole !== 'user') {
      setUserDepartments(id, []);
    }

    audit.log(req.admin, 'update_admin', 'admin', id, { name: name.trim(), role: nextRole });
    res.json({ success: true, admin: getAdminRowById(id) });
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) {
      return res.status(409).json({ success: false, message: 'Este e-mail já está em uso.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/reset-password', (req, res) => {
  try {
    const id = Number(req.params.id);
    const { password } = req.body;
    if (!password || String(password).length < 6) {
      return res.status(400).json({ success: false, message: 'A nova senha precisa de ao menos 6 caracteres.' });
    }
    const target = db.prepare('SELECT * FROM admins WHERE id = ?').get(id);
    if (!target) return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    if (req.admin.role !== 'owner' && normRole(target.role) === 'owner') {
      return res.status(403).json({ success: false, message: 'Não é permitido resetar a senha do Owner.' });
    }
    const hashed = bcrypt.hashSync(String(password), 10);
    db.prepare('UPDATE admins SET password = ? WHERE id = ?').run(hashed, id);
    audit.log(req.admin, 'reset_password', 'admin', id, { name: target.name });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const target = db.prepare('SELECT * FROM admins WHERE id = ?').get(id);
    if (!target) return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    if (normRole(target.role) === 'owner') {
      return res.status(403).json({ success: false, message: 'O Owner não pode ser excluído.' });
    }
    db.prepare('DELETE FROM admins WHERE id = ?').run(id);
    delUserDepts.run(id);
    audit.log(req.admin, 'delete_admin', 'admin', id, { name: target.name });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
