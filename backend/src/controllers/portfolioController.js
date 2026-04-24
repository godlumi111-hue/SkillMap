const { getDb } = require('../config/database');
const { saveBase64 } = require('./uploadController');

function getProviderByUser(db, userId) {
  return db.prepare('SELECT id FROM providers WHERE user_id = ?').get(userId);
}

// GET /api/providers/me/portfolio
function list(req, res) {
  const db = getDb();
  const prov = getProviderByUser(db, req.user.id);
  if (!prov) return res.status(404).json({ error: 'Profil prestataire introuvable' });
  const items = db.prepare(
    'SELECT * FROM portfolio_items WHERE provider_id = ? ORDER BY created_at DESC'
  ).all(prov.id);
  res.json({ items });
}

// POST /api/providers/me/portfolio
function create(req, res) {
  const { title, description, image_base64 } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Titre requis' });
  const db = getDb();
  const prov = getProviderByUser(db, req.user.id);
  if (!prov) return res.status(404).json({ error: 'Profil prestataire introuvable' });

  let image_url = null;
  if (image_base64) {
    try { image_url = saveBase64(image_base64, 'portfolio'); }
    catch (e) { return res.status(400).json({ error: e.message }); }
  }

  const r = db.prepare(
    'INSERT INTO portfolio_items (provider_id, title, description, image_url) VALUES (?,?,?,?)'
  ).run(prov.id, title.trim(), description?.trim() || null, image_url);

  res.status(201).json({ item: db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(r.lastInsertRowid) });
}

// PUT /api/providers/me/portfolio/:id
function update(req, res) {
  const { title, description, image_base64 } = req.body;
  const db = getDb();
  const prov = getProviderByUser(db, req.user.id);
  if (!prov) return res.status(404).json({ error: 'Profil prestataire introuvable' });

  const item = db.prepare(
    'SELECT * FROM portfolio_items WHERE id = ? AND provider_id = ?'
  ).get(req.params.id, prov.id);
  if (!item) return res.status(404).json({ error: 'Réalisation introuvable' });

  let image_url = item.image_url;
  if (image_base64) {
    try { image_url = saveBase64(image_base64, 'portfolio'); }
    catch (e) { return res.status(400).json({ error: e.message }); }
  }

  db.prepare(
    'UPDATE portfolio_items SET title = ?, description = ?, image_url = ? WHERE id = ?'
  ).run(title?.trim() || item.title, description?.trim() ?? item.description, image_url, item.id);

  res.json({ item: db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(item.id) });
}

// DELETE /api/providers/me/portfolio/:id
function remove(req, res) {
  const db = getDb();
  const prov = getProviderByUser(db, req.user.id);
  if (!prov) return res.status(404).json({ error: 'Profil prestataire introuvable' });
  const info = db.prepare(
    'DELETE FROM portfolio_items WHERE id = ? AND provider_id = ?'
  ).run(req.params.id, prov.id);
  if (!info.changes) return res.status(404).json({ error: 'Réalisation introuvable' });
  res.json({ message: 'Réalisation supprimée' });
}

// GET /api/providers/:id/portfolio (public)
function listPublic(req, res) {
  const db = getDb();
  const items = db.prepare(
    'SELECT * FROM portfolio_items WHERE provider_id = ? ORDER BY created_at DESC'
  ).all(req.params.id);
  res.json({ items });
}

module.exports = { list, create, update, remove, listPublic };
