const express = require('express');
const router = express.Router();
const db = require('../database.cjs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 're-teck-secret-key-2026';

function requireAuth(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Não autorizado.' });
  }
  try {
    const payload = jwt.verify(h.slice(7), JWT_SECRET);
    req.admin = { ...payload, role: payload.role || 'admin' };
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Sessão inválida ou expirada.' });
  }
}

function getAdminRowById(id) {
  return db.prepare('SELECT id, name, email, role, last_login_at, created_at FROM admins WHERE id = ?').get(id);
}

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = db.prepare('SELECT * FROM admins WHERE lower(trim(email)) = lower(trim(?))').get(email);

    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      return res.status(401).json({ success: false, message: 'E-mail ou senha inválidos.' });
    }

    const role = admin.role || 'admin';
    const token = jwt.sign(
      { id: admin.id, name: admin.name, email: admin.email, role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    db.prepare('UPDATE admins SET last_login_at = ? WHERE id = ?').run(new Date().toISOString(), admin.id);

    res.json({
      success: true,
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email, role },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/** Lista todos os admins (sem senha). */
router.get('/', requireAuth, (req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT id, name, email, role, last_login_at, created_at FROM admins
         ORDER BY CASE WHEN role = 'super' THEN 0 ELSE 1 END, name ASC`
      )
      .all();
    res.json(rows.map((r) => ({ ...r, role: r.role || 'admin' })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', requireAuth, (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Nome, e-mail e senha são obrigatórios.' });
    }

    let finalRole = role === 'super' ? 'super' : 'admin';
    if (req.admin.role !== 'super') {
      finalRole = 'admin';
      if (role === 'super') {
        return res.status(403).json({
          success: false,
          message: 'Apenas Super Admin pode criar outro Super Admin.',
        });
      }
    }

    const hashed = bcrypt.hashSync(password, 10);
    const info = db
      .prepare('INSERT INTO admins (name, email, password, role) VALUES (?, ?, ?, ?)')
      .run(name.trim(), email.trim().toLowerCase(), hashed, finalRole);

    const row = getAdminRowById(info.lastInsertRowid);
    res.json({ success: true, admin: row });
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) {
      return res.status(409).json({ success: false, message: 'Este e-mail já está em uso.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', requireAuth, (req, res) => {
  try {
    const id = Number(req.params.id);
    const target = db.prepare('SELECT * FROM admins WHERE id = ?').get(id);
    if (!target) return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });

    const isTargetSuper = (target.role || 'admin') === 'super';
    if (req.admin.role !== 'super' && isTargetSuper) {
      return res.status(403).json({
        success: false,
        message: 'Não é permitido alterar um Super Admin.',
      });
    }

    const { name, email, password, role } = req.body;
    let nextRole = target.role || 'admin';
    if (role !== undefined) {
      if (req.admin.role !== 'super') {
        if (role === 'super' || nextRole !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Apenas Super Admin pode alterar papéis de Super Admin.',
          });
        }
        nextRole = 'admin';
      } else {
        nextRole = role === 'super' ? 'super' : 'admin';
      }
    }

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Nome e e-mail são obrigatórios.' });
    }

    if (password && String(password).length > 0) {
      const hashed = bcrypt.hashSync(password, 10);
      db.prepare('UPDATE admins SET name = ?, email = ?, password = ?, role = ? WHERE id = ?').run(
        name.trim(),
        email.trim().toLowerCase(),
        hashed,
        nextRole,
        id
      );
    } else {
      db.prepare('UPDATE admins SET name = ?, email = ?, role = ? WHERE id = ?').run(
        name.trim(),
        email.trim().toLowerCase(),
        nextRole,
        id
      );
    }

    res.json({ success: true, admin: getAdminRowById(id) });
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) {
      return res.status(409).json({ success: false, message: 'Este e-mail já está em uso.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', requireAuth, (req, res) => {
  try {
    const id = Number(req.params.id);
    if (id === req.admin.id) {
      return res.status(400).json({ success: false, message: 'Não pode excluir a si mesmo.' });
    }

    const target = db.prepare('SELECT * FROM admins WHERE id = ?').get(id);
    if (!target) return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });

    const isTargetSuper = (target.role || 'admin') === 'super';
    if (req.admin.role !== 'super' && isTargetSuper) {
      return res.status(403).json({
        success: false,
        message: 'Apenas Super Admin pode excluir outro Super Admin.',
      });
    }

    db.prepare('DELETE FROM admins WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/** Desativado em produção: use a área Usuários Admin ou POST /reseed-super-only. */
router.post('/setup', (req, res) => {
  res.status(410).json({
    success: false,
    message: 'Rota desativada. Utilize o painel Usuários Admin (Super Admin) ou o reinício padrão da base.',
  });
});

module.exports = router;
