const { getDb } = require('../config/database');

// POST /api/providers/:id/report
function create(req, res) {
  const { reason, description } = req.body;
  const validReasons = ['fake', 'inappropriate', 'spam', 'other'];
  if (!validReasons.includes(reason)) {
    return res.status(400).json({ error: 'Raison invalide' });
  }

  const db = getDb();
  const provider = db.prepare('SELECT id FROM providers WHERE id = ?').get(req.params.id);
  if (!provider) return res.status(404).json({ error: 'Prestataire introuvable' });

  const existing = db.prepare(
    "SELECT id FROM reports WHERE reporter_id = ? AND provider_id = ? AND status = 'pending'"
  ).get(req.user.id, req.params.id);
  if (existing) return res.status(409).json({ error: 'Signalement déjà envoyé' });

  db.prepare(
    'INSERT INTO reports (reporter_id, provider_id, reason, description) VALUES (?,?,?,?)'
  ).run(req.user.id, req.params.id, reason, description || null);

  res.status(201).json({ message: 'Signalement envoyé, merci' });
}

module.exports = { create };
