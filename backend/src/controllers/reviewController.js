const { getDb } = require('../config/database');

const LEVEL_THRESHOLDS = [[300,'master'],[150,'expert'],[50,'confirmé'],[0,'débutant']];
function getLevel(pts) {
  for (const [t, l] of LEVEL_THRESHOLDS) if (pts >= t) return l;
  return 'débutant';
}
const REVIEW_POINTS = { 5: 5, 4: 3, 3: 1, 2: 0, 1: -2 };

// GET /api/providers/:id/reviews
function listForProvider(req, res) {
  const db = getDb();
  const reviews = db.prepare(`
    SELECT r.*, u.full_name as client_name, u.avatar_url as client_avatar
    FROM reviews r JOIN users u ON u.id = r.client_id
    WHERE r.provider_id = ? AND r.is_visible = 1
    ORDER BY r.created_at DESC
  `).all(req.params.id);

  const stats = db.prepare(`
    SELECT COUNT(*) as count, ROUND(AVG(rating),1) as avg,
      SUM(CASE WHEN rating=5 THEN 1 ELSE 0 END) as r5,
      SUM(CASE WHEN rating=4 THEN 1 ELSE 0 END) as r4,
      SUM(CASE WHEN rating=3 THEN 1 ELSE 0 END) as r3,
      SUM(CASE WHEN rating=2 THEN 1 ELSE 0 END) as r2,
      SUM(CASE WHEN rating=1 THEN 1 ELSE 0 END) as r1
    FROM reviews WHERE provider_id = ? AND is_visible = 1
  `).get(req.params.id);

  res.json({ reviews, stats });
}

// POST /api/providers/:id/reviews
function create(req, res) {
  const { rating, comment, request_id } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Note entre 1 et 5 requise' });
  }

  const db = getDb();
  const provider = db.prepare('SELECT id, points FROM providers WHERE id = ?').get(req.params.id);
  if (!provider) return res.status(404).json({ error: 'Prestataire introuvable' });

  const existing = db.prepare(
    'SELECT id FROM reviews WHERE client_id = ? AND provider_id = ? AND request_id IS ?'
  ).get(req.user.id, req.params.id, request_id || null);
  if (existing) return res.status(409).json({ error: 'Vous avez déjà laissé un avis pour cette prestation' });

  const result = db.prepare(
    'INSERT INTO reviews (client_id, provider_id, rating, comment, request_id) VALUES (?,?,?,?,?)'
  ).run(req.user.id, req.params.id, rating, comment || null, request_id || null);

  // Attribuer des points selon la note
  const pts = REVIEW_POINTS[rating] ?? 0;
  if (pts !== 0) {
    const newPoints = Math.max(0, (provider.points || 0) + pts);
    const newLevel  = getLevel(newPoints);
    db.prepare("UPDATE providers SET points = ?, level = ?, updated_at = datetime('now') WHERE id = ?")
      .run(newPoints, newLevel, provider.id);
  }

  const review = db.prepare(`
    SELECT r.*, u.full_name as client_name FROM reviews r
    JOIN users u ON u.id = r.client_id WHERE r.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(review);
}

module.exports = { listForProvider, create };
