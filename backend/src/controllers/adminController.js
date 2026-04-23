const { getDb } = require('../config/database');

// GET /api/admin/stats
function stats(req, res) {
  const db = getDb();
  const users       = db.prepare("SELECT COUNT(*) as c FROM users WHERE is_active=1").get().c;
  const clients     = db.prepare("SELECT COUNT(*) as c FROM users WHERE role='client' AND is_active=1").get().c;
  const providers   = db.prepare("SELECT COUNT(*) as c FROM users WHERE role='provider' AND is_active=1").get().c;
  const available   = db.prepare("SELECT COUNT(*) as c FROM providers WHERE is_available=1").get().c;
  const requests    = db.prepare("SELECT COUNT(*) as c FROM service_requests").get().c;
  const completed   = db.prepare("SELECT COUNT(*) as c FROM service_requests WHERE status='completed'").get().c;
  const reviews     = db.prepare("SELECT COUNT(*) as c, ROUND(AVG(rating),2) as avg FROM reviews WHERE is_visible=1").get();
  const pendingReports = db.prepare("SELECT COUNT(*) as c FROM reports WHERE status='pending'").get().c;

  res.json({
    users: { total: users, clients, providers },
    providers: { total: providers, available },
    services: { total: requests, completed },
    reviews: { total: reviews.c, avg_rating: reviews.avg },
    pending_reports: pendingReports
  });
}

// GET /api/admin/users
function listUsers(req, res) {
  const db = getDb();
  const { role, page = 1, limit = 30, q } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  let query = 'SELECT id, email, role, full_name, city, is_active, created_at FROM users WHERE 1=1';
  const params = [];

  if (role) { query += ' AND role = ?'; params.push(role); }
  if (q) { query += ' AND (full_name LIKE ? OR email LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  res.json({ users: db.prepare(query).all(...params) });
}

// PATCH /api/admin/users/:id
function updateUser(req, res) {
  const db = getDb();
  const { is_active } = req.body;
  db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(is_active ? 1 : 0, req.params.id);
  res.json({ message: 'Utilisateur mis à jour' });
}

// PATCH /api/admin/providers/:id/verify
function verifyProvider(req, res) {
  const db = getDb();
  const { is_verified } = req.body;
  db.prepare('UPDATE providers SET is_verified = ? WHERE id = ?').run(is_verified ? 1 : 0, req.params.id);
  res.json({ message: 'Statut de vérification mis à jour' });
}

// GET /api/admin/reports
function listReports(req, res) {
  const db = getDb();
  const reports = db.prepare(`
    SELECT r.*, u.full_name as reporter_name, p.title as provider_title, pu.full_name as provider_name
    FROM reports r
    JOIN users u ON u.id = r.reporter_id
    JOIN providers p ON p.id = r.provider_id
    JOIN users pu ON pu.id = p.user_id
    WHERE r.status = 'pending'
    ORDER BY r.created_at DESC
  `).all();
  res.json({ reports });
}

// PATCH /api/admin/reports/:id
function handleReport(req, res) {
  const db = getDb();
  const { status } = req.body;
  if (!['reviewed', 'dismissed'].includes(status)) {
    return res.status(400).json({ error: 'Statut invalide' });
  }
  db.prepare('UPDATE reports SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ message: 'Signalement traité' });
}

// GET /api/admin/reviews — modération
function listReviews(req, res) {
  const db = getDb();
  const reviews = db.prepare(`
    SELECT r.*, u.full_name as client_name, pu.full_name as provider_name
    FROM reviews r JOIN users u ON u.id = r.client_id
    JOIN providers p ON p.id = r.provider_id JOIN users pu ON pu.id = p.user_id
    ORDER BY r.created_at DESC LIMIT 100
  `).all();
  res.json({ reviews });
}

// PATCH /api/admin/reviews/:id
function moderateReview(req, res) {
  const db = getDb();
  const { is_visible } = req.body;
  db.prepare('UPDATE reviews SET is_visible = ? WHERE id = ?').run(is_visible ? 1 : 0, req.params.id);
  res.json({ message: 'Avis modéré' });
}

module.exports = { stats, listUsers, updateUser, verifyProvider, listReports, handleReport, listReviews, moderateReview };
