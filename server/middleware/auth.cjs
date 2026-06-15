const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Segredo do JWT: usa JWT_SECRET do ambiente; senão, gera um forte uma única vez
 * e persiste em server/jwt-secret.txt (fora do git). Remove o segredo fixo do código.
 */
function resolveSecret() {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 16) return process.env.JWT_SECRET;
  const file = path.join(__dirname, '..', 'jwt-secret.txt');
  try {
    if (fs.existsSync(file)) {
      const s = fs.readFileSync(file, 'utf8').trim();
      if (s) return s;
    }
    const s = crypto.randomBytes(48).toString('hex');
    fs.writeFileSync(file, s, { mode: 0o600 });
    return s;
  } catch (e) {
    console.error('Não foi possível persistir o JWT secret, usando fallback temporário:', e.message);
    return crypto.randomBytes(48).toString('hex');
  }
}

const JWT_SECRET = resolveSecret();

/** Papéis: owner > admin > user. 'super' (legado) vira owner; desconhecido vira user (menor privilégio). */
function normRole(role) {
  if (role === 'owner' || role === 'super') return 'owner';
  if (role === 'admin') return 'admin';
  return 'user';
}

const isAdminRole = (role) => role === 'owner' || role === 'admin';

/** Exige um token JWT válido (qualquer usuário logado). */
function requireAuth(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Não autorizado.' });
  }
  try {
    const payload = jwt.verify(h.slice(7), JWT_SECRET);
    req.admin = { ...payload, role: normRole(payload.role) };
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Sessão inválida ou expirada.' });
  }
}

/** Exige papel admin ou owner (painel administrativo). */
function requireAdmin(req, res, next) {
  if (!req.admin || !isAdminRole(req.admin.role)) {
    return res.status(403).json({ success: false, message: 'Acesso restrito a administradores.' });
  }
  next();
}

/** Exige papel owner. */
function requireOwner(req, res, next) {
  if (!req.admin || req.admin.role !== 'owner') {
    return res.status(403).json({ success: false, message: 'Apenas o Owner pode fazer isto.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin, requireOwner, normRole, isAdminRole, JWT_SECRET };
