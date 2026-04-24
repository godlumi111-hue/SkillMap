const { getDb } = require('../config/database');
const COMMISSION_RATE = 0.03;

const LEVEL_THRESHOLDS = [[300,'master'],[150,'expert'],[50,'confirmé'],[0,'débutant']];
function getLevel(pts) {
  for (const [t, l] of LEVEL_THRESHOLDS) if (pts >= t) return l;
  return 'débutant';
}

function ensureWallet(db, userId) {
  db.prepare('INSERT OR IGNORE INTO wallets (user_id) VALUES (?)').run(userId);
  return db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);
}

// GET /api/appointments
function list(req, res) {
  const db = getDb();
  const { role, id: userId } = req.user;

  let rows;
  if (role === 'client') {
    rows = db.prepare(`
      SELECT a.*,
        u.full_name AS provider_name, u.phone AS provider_phone, u.avatar_url AS provider_avatar,
        p.title AS provider_title, p.neighborhood AS provider_neighborhood,
        p.lat AS provider_lat, p.lng AS provider_lng
      FROM appointments a
      JOIN providers p ON p.id = a.provider_id
      JOIN users u ON u.id = p.user_id
      WHERE a.client_id = ?
      ORDER BY a.scheduled_date DESC, a.created_at DESC
    `).all(userId);
  } else if (role === 'provider') {
    const prov = db.prepare('SELECT id FROM providers WHERE user_id = ?').get(userId);
    if (!prov) return res.json({ appointments: [] });
    rows = db.prepare(`
      SELECT a.*,
        u.full_name AS client_name, u.phone AS client_phone, u.avatar_url AS client_avatar,
        u.city AS client_city
      FROM appointments a
      JOIN users u ON u.id = a.client_id
      WHERE a.provider_id = ?
      ORDER BY a.scheduled_date DESC, a.created_at DESC
    `).all(prov.id);
  } else {
    rows = db.prepare('SELECT * FROM appointments ORDER BY created_at DESC LIMIT 100').all();
  }

  res.json({ appointments: rows });
}

// POST /api/appointments
function create(req, res) {
  const db = getDb();
  const { id: clientId } = req.user;
  const { provider_id, title, description, scheduled_date, scheduled_time, duration_hours, amount, notes } = req.body;

  if (!provider_id || !title || !scheduled_date) {
    return res.status(400).json({ error: 'provider_id, title et scheduled_date sont requis' });
  }

  const prov = db.prepare('SELECT id, user_id, hourly_rate FROM providers WHERE id = ?').get(provider_id);
  if (!prov) return res.status(404).json({ error: 'Prestataire introuvable' });

  const finalAmount = amount || (prov.hourly_rate * (duration_hours || 1)) || 0;

  const result = db.prepare(`
    INSERT INTO appointments (client_id, provider_id, title, description, scheduled_date, scheduled_time, duration_hours, amount, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(clientId, provider_id, title, description || '', scheduled_date, scheduled_time || '09:00', duration_hours || 1, finalAmount, notes || '');

  res.status(201).json({ appointment: db.prepare('SELECT * FROM appointments WHERE id = ?').get(result.lastInsertRowid) });
}

// GET /api/appointments/:id
function getOne(req, res) {
  const db = getDb();
  const appt = db.prepare(`
    SELECT a.*,
      cu.full_name AS client_name, cu.phone AS client_phone,
      pu.full_name AS provider_name, pu.phone AS provider_phone,
      p.title AS provider_title, p.neighborhood, p.lat, p.lng, p.hourly_rate
    FROM appointments a
    JOIN users cu ON cu.id = a.client_id
    JOIN providers p ON p.id = a.provider_id
    JOIN users pu ON pu.id = p.user_id
    WHERE a.id = ?
  `).get(req.params.id);
  if (!appt) return res.status(404).json({ error: 'Rendez-vous introuvable' });
  res.json({ appointment: appt });
}

// PATCH /api/appointments/:id/status
function updateStatus(req, res) {
  const db = getDb();
  const { status } = req.body;
  const valid = ['pending','confirmed','in_progress','en_route','completed','cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Statut invalide' });

  db.prepare(`UPDATE appointments SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, req.params.id);
  res.json({ message: 'Statut mis à jour' });
}

// POST /api/appointments/:id/pay
function pay(req, res) {
  const db = getDb();
  const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (!appt) return res.status(404).json({ error: 'Rendez-vous introuvable' });
  if (appt.client_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé' });
  if (appt.payment_status !== 'unpaid') return res.status(400).json({ error: 'Déjà payé' });

  const clientWallet = ensureWallet(db, req.user.id);
  if (clientWallet.balance < appt.amount) {
    return res.status(400).json({ error: `Solde insuffisant. Solde actuel : ${clientWallet.balance.toLocaleString('fr-FR')} FCFA` });
  }

  db.prepare(`UPDATE wallets SET balance = balance - ?, held_balance = held_balance + ?, total_spent = total_spent + ?, updated_at = datetime('now') WHERE user_id = ?`)
    .run(appt.amount, appt.amount, appt.amount, req.user.id);

  db.prepare(`INSERT INTO wallet_transactions (wallet_id, type, amount, net_amount, description, status, appointment_id)
    VALUES (?, 'payment', ?, ?, ?, 'completed', ?)`)
    .run(clientWallet.id, appt.amount, appt.amount, `Paiement RDV #${appt.id} — ${appt.title}`, appt.id);

  db.prepare(`UPDATE appointments SET payment_status = 'held', status = 'confirmed', updated_at = datetime('now') WHERE id = ?`).run(appt.id);

  res.json({ message: 'Paiement effectué, argent en attente de libération', new_balance: clientWallet.balance - appt.amount });
}

// POST /api/appointments/:id/confirm-complete
function confirmComplete(req, res) {
  const db = getDb();
  const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (!appt) return res.status(404).json({ error: 'Rendez-vous introuvable' });
  if (appt.client_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé' });
  if (appt.payment_status !== 'held') return res.status(400).json({ error: 'Aucun paiement en attente' });

  const commission    = Math.round(appt.amount * COMMISSION_RATE);
  const providerAmount = appt.amount - commission;

  const prov       = db.prepare('SELECT id, user_id, points FROM providers WHERE id = ?').get(appt.provider_id);
  const provWallet = ensureWallet(db, prov.user_id);
  ensureWallet(db, appt.client_id);

  // Libérer séquestre client
  db.prepare(`UPDATE wallets SET held_balance = held_balance - ?, updated_at = datetime('now') WHERE user_id = ?`)
    .run(appt.amount, appt.client_id);

  // Créditer prestataire (montant net)
  db.prepare(`UPDATE wallets SET balance = balance + ?, total_earned = total_earned + ?, updated_at = datetime('now') WHERE user_id = ?`)
    .run(providerAmount, providerAmount, prov.user_id);

  db.prepare(`INSERT INTO wallet_transactions (wallet_id, type, amount, fee, net_amount, description, status, appointment_id)
    VALUES (?, 'receipt', ?, ?, ?, ?, 'completed', ?)`)
    .run(provWallet.id, appt.amount, commission, providerAmount, `Prestation terminée — ${appt.title}`, appt.id);

  // Créditer la commission dans le portefeuille admin
  const adminUser = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
  if (adminUser && commission > 0) {
    const adminWallet = ensureWallet(db, adminUser.id);
    db.prepare(`UPDATE wallets SET balance = balance + ?, total_earned = total_earned + ?, updated_at = datetime('now') WHERE user_id = ?`)
      .run(commission, commission, adminUser.id);
    db.prepare(`INSERT INTO wallet_transactions (wallet_id, type, amount, net_amount, description, status, appointment_id)
      VALUES (?, 'commission', ?, ?, ?, 'completed', ?)`)
      .run(adminWallet.id, commission, commission, `Commission 3% — ${appt.title}`, appt.id);
  }

  // Attribuer des points au prestataire (+10 par mission terminée)
  const newPoints = (prov.points || 0) + 10;
  const newLevel  = getLevel(newPoints);
  db.prepare("UPDATE providers SET points = ?, level = ?, updated_at = datetime('now') WHERE id = ?")
    .run(newPoints, newLevel, prov.id);

  db.prepare(`UPDATE appointments SET payment_status = 'released', status = 'completed', client_confirmed = 1, updated_at = datetime('now') WHERE id = ?`).run(appt.id);

  res.json({ message: 'Prestation confirmée, paiement libéré', provider_received: providerAmount, commission });
}

module.exports = { list, create, getOne, updateStatus, pay, confirmComplete };
