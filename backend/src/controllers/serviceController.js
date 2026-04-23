const { getDb } = require('../config/database');

// GET /api/services — liste des demandes selon le rôle
function list(req, res) {
  const db = getDb();
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query, params;

  if (req.user.role === 'client') {
    query = `
      SELECT sr.*, p.title as provider_title, u.full_name as provider_name, u.avatar_url as provider_avatar,
             p.neighborhood as provider_neighborhood, u.id as provider_user_id
      FROM service_requests sr
      JOIN providers p ON p.id = sr.provider_id
      JOIN users u ON u.id = p.user_id
      WHERE sr.client_id = ?
    `;
    params = [req.user.id];
  } else if (req.user.role === 'provider') {
    const provider = db.prepare('SELECT id FROM providers WHERE user_id = ?').get(req.user.id);
    if (!provider) return res.status(404).json({ error: 'Profil prestataire introuvable' });
    query = `
      SELECT sr.*, u.full_name as client_name, u.avatar_url as client_avatar, u.phone as client_phone, u.city as client_city
      FROM service_requests sr JOIN users u ON u.id = sr.client_id
      WHERE sr.provider_id = ?
    `;
    params = [provider.id];
  } else {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  if (status) { query += ' AND sr.status = ?'; params.push(status); }
  query += ' ORDER BY sr.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const requests = db.prepare(query).all(...params);
  res.json({ requests });
}

// POST /api/services — créer une demande
function create(req, res) {
  if (req.user.role !== 'client') {
    return res.status(403).json({ error: 'Seuls les clients peuvent créer des demandes' });
  }

  const { provider_id, title, description, scheduled_at } = req.body;
  if (!provider_id || !title) {
    return res.status(400).json({ error: 'provider_id et title sont requis' });
  }

  const db = getDb();
  const provider = db.prepare('SELECT id FROM providers WHERE id = ?').get(provider_id);
  if (!provider) return res.status(404).json({ error: 'Prestataire introuvable' });

  const result = db.prepare(
    'INSERT INTO service_requests (client_id, provider_id, title, description, scheduled_at) VALUES (?,?,?,?,?)'
  ).run(req.user.id, provider_id, title, description || null, scheduled_at || null);

  const request = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(request);
}

// PATCH /api/services/:id/status — changer le statut
function updateStatus(req, res) {
  const { status } = req.body;
  const validStatuses = ['accepted', 'in_progress', 'completed', 'cancelled', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Statut invalide' });
  }

  const db = getDb();
  const request = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(req.params.id);
  if (!request) return res.status(404).json({ error: 'Demande introuvable' });

  // Vérifier que l'utilisateur est bien concerné
  if (req.user.role === 'client' && request.client_id !== req.user.id) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  if (req.user.role === 'provider') {
    const provider = db.prepare('SELECT id FROM providers WHERE user_id = ?').get(req.user.id);
    if (!provider || request.provider_id !== provider.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
  }

  const completedAt = status === 'completed' ? "datetime('now')" : 'NULL';
  db.prepare(`
    UPDATE service_requests SET status = ?, updated_at = datetime('now'),
    completed_at = ${completedAt} WHERE id = ?
  `).run(status, req.params.id);

  res.json({ id: request.id, status });
}

module.exports = { list, create, updateStatus };
