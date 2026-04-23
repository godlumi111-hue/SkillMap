const { getDb } = require('../config/database');

// GET /api/favorites
function list(req, res) {
  const db = getDb();
  const favorites = db.prepare(`
    SELECT p.*, u.full_name, u.avatar_url,
      (SELECT ROUND(AVG(rating),1) FROM reviews WHERE provider_id = p.id AND is_visible = 1) as avg_rating,
      (SELECT COUNT(*) FROM reviews WHERE provider_id = p.id AND is_visible = 1) as review_count,
      f.created_at as saved_at
    FROM favorites f
    JOIN providers p ON p.id = f.provider_id
    JOIN users u ON u.id = p.user_id
    WHERE f.client_id = ?
    ORDER BY f.created_at DESC
  `).all(req.user.id);

  res.json({ favorites });
}

// POST /api/favorites/:provider_id
function add(req, res) {
  const db = getDb();
  const provider = db.prepare('SELECT id FROM providers WHERE id = ?').get(req.params.provider_id);
  if (!provider) return res.status(404).json({ error: 'Prestataire introuvable' });

  try {
    db.prepare('INSERT INTO favorites (client_id, provider_id) VALUES (?,?)').run(req.user.id, req.params.provider_id);
    res.status(201).json({ message: 'Ajouté aux favoris' });
  } catch {
    res.status(409).json({ error: 'Déjà dans vos favoris' });
  }
}

// DELETE /api/favorites/:provider_id
function remove(req, res) {
  const db = getDb();
  const result = db.prepare('DELETE FROM favorites WHERE client_id = ? AND provider_id = ?').run(req.user.id, req.params.provider_id);
  if (result.changes === 0) return res.status(404).json({ error: 'Favori introuvable' });
  res.json({ message: 'Retiré des favoris' });
}

// GET /api/favorites/:provider_id/check
function check(req, res) {
  const db = getDb();
  const fav = db.prepare('SELECT 1 FROM favorites WHERE client_id = ? AND provider_id = ?').get(req.user.id, req.params.provider_id);
  res.json({ is_favorite: !!fav });
}

module.exports = { list, add, remove, check };
