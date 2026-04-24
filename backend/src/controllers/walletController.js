const { getDb } = require('../config/database');
const COMMISSION_RATE = 0.03;

function ensureWallet(db, userId) {
  db.prepare('INSERT OR IGNORE INTO wallets (user_id) VALUES (?)').run(userId);
  return db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);
}

// GET /api/wallet — solde + historique
function getWallet(req, res) {
  const db = getDb();
  const wallet = ensureWallet(db, req.user.id);
  const transactions = db.prepare(`
    SELECT * FROM wallet_transactions WHERE wallet_id = ?
    ORDER BY created_at DESC LIMIT 50
  `).all(wallet.id);
  res.json({ wallet, transactions });
}

// POST /api/wallet/deposit — dépôt simulé (Wave / Orange / Moov)
function deposit(req, res) {
  const db = getDb();
  const { amount, payment_method, phone } = req.body;
  const methods = ['wave', 'orange_money', 'moov_money'];
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Montant invalide' });
  if (!methods.includes(payment_method)) return res.status(400).json({ error: 'Moyen de paiement invalide' });

  const wallet = ensureWallet(db, req.user.id);
  const reference = `SKM-${Date.now()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;

  // Simuler délai de traitement
  db.prepare(`UPDATE wallets SET balance = balance + ?, total_earned = total_earned + ?, updated_at = datetime('now') WHERE user_id = ?`)
    .run(amount, amount, req.user.id);

  db.prepare(`INSERT INTO wallet_transactions (wallet_id, type, amount, net_amount, description, status, payment_method, reference)
    VALUES (?, 'deposit', ?, ?, ?, 'completed', ?, ?)`)
    .run(wallet.id, amount, amount, `Dépôt via ${payment_method.replace('_', ' ')}`, payment_method, reference);

  const updated = db.prepare('SELECT balance FROM wallets WHERE user_id = ?').get(req.user.id);
  res.json({ message: 'Dépôt effectué avec succès', new_balance: updated.balance, reference });
}

// GET /api/wallet/stats — stats globales pour le prestataire
function stats(req, res) {
  const db = getDb();
  const wallet = ensureWallet(db, req.user.id);
  const thisMonth = db.prepare(`
    SELECT COALESCE(SUM(net_amount),0) as earned FROM wallet_transactions
    WHERE wallet_id = ? AND type = 'receipt' AND status = 'completed'
    AND created_at >= date('now','start of month')
  `).get(wallet.id);
  const pending = db.prepare(`
    SELECT COUNT(*) as c, COALESCE(SUM(amount),0) as total FROM appointments
    WHERE provider_id IN (SELECT id FROM providers WHERE user_id = ?)
    AND payment_status = 'held'
  `).get(req.user.id);

  res.json({
    balance: wallet.balance,
    held_balance: wallet.held_balance,
    total_earned: wallet.total_earned,
    total_spent: wallet.total_spent,
    this_month_earned: thisMonth.earned,
    pending_count: pending.c,
    pending_amount: pending.total,
    commission_rate: COMMISSION_RATE
  });
}

module.exports = { getWallet, deposit, stats };
