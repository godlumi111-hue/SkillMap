const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { getDb } = require('../config/database');

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/register
async function register(req, res) {
  const { email, password, full_name, role = 'client', city, phone,
          title, description, hourly_rate, neighborhood } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Email, mot de passe et nom requis' });
  }
  if (!['client', 'provider'].includes(role)) {
    return res.status(400).json({ error: 'Rôle invalide' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Mot de passe trop court (6 caractères minimum)' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Cet email est déjà utilisé' });
  }

  const hash = await bcrypt.hash(password, 10);
  const insertUser = db.prepare(
    'INSERT INTO users (email, password, role, full_name, city, phone) VALUES (?,?,?,?,?,?)'
  );
  const result = insertUser.run(email, hash, role, full_name, city || 'Abidjan', phone || null);

  if (role === 'provider') {
    if (!title) return res.status(400).json({ error: 'Le titre du métier est requis pour les prestataires' });
    db.prepare(
      'INSERT INTO providers (user_id, title, description, city, neighborhood, hourly_rate) VALUES (?,?,?,?,?,?)'
    ).run(result.lastInsertRowid, title, description || null, city || 'Abidjan', neighborhood || null, hourly_rate || null);
  }

  const user = db.prepare('SELECT id, email, role, full_name, city FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = signToken(user);

  let providerProfile = null;
  if (role === 'provider') {
    providerProfile = db.prepare('SELECT * FROM providers WHERE user_id = ?').get(user.id);
  }

  res.status(201).json({ token, user, provider: providerProfile });
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email);
  if (!user) return res.status(401).json({ error: 'Identifiants incorrects' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Identifiants incorrects' });

  const { password: _, ...safeUser } = user;
  const token = signToken(safeUser);

  let providerProfile = null;
  if (user.role === 'provider') {
    providerProfile = db.prepare('SELECT * FROM providers WHERE user_id = ?').get(user.id);
  }

  res.json({ token, user: safeUser, provider: providerProfile });
}

// GET /api/auth/me
function me(req, res) {
  const db = getDb();
  const user = db.prepare('SELECT id, email, role, full_name, city, phone, avatar_url, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

  let providerProfile = null;
  if (user.role === 'provider') {
    providerProfile = db.prepare('SELECT * FROM providers WHERE user_id = ?').get(user.id);
  }
  res.json({ user, provider: providerProfile });
}

// PUT /api/auth/password
async function changePassword(req, res) {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ error: 'Nouveau mot de passe trop court' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const valid = await bcrypt.compare(current_password, user.password);
  if (!valid) return res.status(401).json({ error: 'Mot de passe actuel incorrect' });

  const hash = await bcrypt.hash(new_password, 10);
  db.prepare('UPDATE users SET password = ?, updated_at = datetime(\'now\') WHERE id = ?').run(hash, req.user.id);
  res.json({ message: 'Mot de passe mis à jour' });
}

module.exports = { register, login, me, changePassword };
