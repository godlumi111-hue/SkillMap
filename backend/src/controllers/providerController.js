const { getDb } = require('../config/database');

// Formule de Haversine — distance en km entre deux points GPS
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function enrichProvider(p, userLat, userLng) {
  const db = getDb();
  const skills = db.prepare('SELECT DISTINCT skill FROM provider_skills WHERE provider_id = ?').all(p.id).map(r => r.skill);
  const categories = db.prepare(`
    SELECT c.id, c.name, c.slug, c.icon FROM categories c
    JOIN provider_categories pc ON pc.category_id = c.id
    WHERE pc.provider_id = ?
  `).all(p.id);
  const stats = db.prepare(`
    SELECT COUNT(*) as count, ROUND(AVG(rating),1) as avg_rating
    FROM reviews WHERE provider_id = ? AND is_visible = 1
  `).get(p.id);

  return {
    ...p,
    skills,
    categories,
    review_count: stats.count,
    avg_rating: stats.avg_rating || 0,
    distance_km: (userLat && userLng && p.lat && p.lng)
      ? Math.round(haversine(userLat, userLng, p.lat, p.lng) * 10) / 10
      : null
  };
}

// GET /api/providers — liste avec filtres et géolocalisation
function list(req, res) {
  const { q, category, available, lat, lng, radius = 50, page = 1, limit = 20, sort = 'distance' } = req.query;
  const db = getDb();

  let query = `
    SELECT p.*, u.full_name, u.email, u.phone, u.avatar_url
    FROM providers p
    JOIN users u ON u.id = p.user_id
    WHERE u.is_active = 1
  `;
  const params = [];

  if (available === 'true') { query += ' AND p.is_available = 1'; }

  if (q) {
    query += ` AND (u.full_name LIKE ? OR p.title LIKE ? OR p.description LIKE ? OR p.neighborhood LIKE ?)`;
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }

  if (category) {
    query += ` AND p.id IN (
      SELECT pc.provider_id FROM provider_categories pc
      JOIN categories c ON c.id = pc.category_id WHERE c.slug = ?
    )`;
    params.push(category);
  }

  query += ' ORDER BY p.is_verified DESC, p.views_count DESC';

  let providers = db.prepare(query).all(...params);

  const userLat = lat ? parseFloat(lat) : null;
  const userLng = lng ? parseFloat(lng) : null;
  const maxRadius = parseFloat(radius);

  providers = providers.map(p => enrichProvider(p, userLat, userLng));

  if (userLat && userLng) {
    providers = providers.filter(p => p.distance_km === null || p.distance_km <= maxRadius);
    if (sort === 'distance') {
      providers.sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999));
    }
  }

  if (sort === 'rating') providers.sort((a, b) => b.avg_rating - a.avg_rating);

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const paginated = providers.slice(offset, offset + parseInt(limit));

  res.json({
    providers: paginated,
    total: providers.length,
    page: parseInt(page),
    pages: Math.ceil(providers.length / parseInt(limit))
  });
}

// GET /api/providers/:id
function getOne(req, res) {
  const db = getDb();
  const p = db.prepare(`
    SELECT p.*, u.full_name, u.email, u.phone, u.avatar_url
    FROM providers p JOIN users u ON u.id = p.user_id
    WHERE p.id = ? AND u.is_active = 1
  `).get(req.params.id);

  if (!p) return res.status(404).json({ error: 'Prestataire introuvable' });

  const { lat, lng } = req.query;
  const enriched = enrichProvider(p, lat ? parseFloat(lat) : null, lng ? parseFloat(lng) : null);

  const reviews = db.prepare(`
    SELECT r.*, u.full_name as client_name, u.avatar_url as client_avatar
    FROM reviews r JOIN users u ON u.id = r.client_id
    WHERE r.provider_id = ? AND r.is_visible = 1
    ORDER BY r.created_at DESC LIMIT 20
  `).all(p.id);

  const portfolio = db.prepare(
    'SELECT * FROM portfolio_items WHERE provider_id = ? ORDER BY created_at DESC'
  ).all(p.id);

  db.prepare('UPDATE providers SET views_count = views_count + 1 WHERE id = ?').run(p.id);

  res.json({ ...enriched, reviews, portfolio });
}

// PUT /api/providers/me — mise à jour du profil prestataire
function updateProfile(req, res) {
  const db = getDb();
  const provider = db.prepare('SELECT * FROM providers WHERE user_id = ?').get(req.user.id);
  if (!provider) return res.status(404).json({ error: 'Profil prestataire introuvable' });

  const { title, description, city, neighborhood, lat, lng, is_available, hourly_rate, experience_years, skills, categories } = req.body;

  db.prepare(`
    UPDATE providers SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      city = COALESCE(?, city),
      neighborhood = COALESCE(?, neighborhood),
      lat = COALESCE(?, lat),
      lng = COALESCE(?, lng),
      is_available = COALESCE(?, is_available),
      hourly_rate = COALESCE(?, hourly_rate),
      experience_years = COALESCE(?, experience_years),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(title, description, city, neighborhood, lat, lng, is_available, hourly_rate, experience_years, provider.id);

  if (Array.isArray(skills)) {
    db.prepare('DELETE FROM provider_skills WHERE provider_id = ?').run(provider.id);
    const insertSkill = db.prepare('INSERT INTO provider_skills (provider_id, skill) VALUES (?,?)');
    skills.forEach(s => insertSkill.run(provider.id, s));
  }

  if (Array.isArray(categories)) {
    db.prepare('DELETE FROM provider_categories WHERE provider_id = ?').run(provider.id);
    const insertCat = db.prepare('INSERT OR IGNORE INTO provider_categories VALUES (?,?)');
    categories.forEach(cid => insertCat.run(provider.id, cid));
  }

  const updated = db.prepare('SELECT * FROM providers WHERE id = ?').get(provider.id);
  res.json(updated);
}

// PATCH /api/providers/me/availability
function toggleAvailability(req, res) {
  const db = getDb();
  const provider = db.prepare('SELECT * FROM providers WHERE user_id = ?').get(req.user.id);
  if (!provider) return res.status(404).json({ error: 'Profil introuvable' });

  const newStatus = req.body.is_available !== undefined ? (req.body.is_available ? 1 : 0) : (provider.is_available ? 0 : 1);
  db.prepare('UPDATE providers SET is_available = ?, updated_at = datetime(\'now\') WHERE id = ?').run(newStatus, provider.id);
  res.json({ is_available: !!newStatus });
}

module.exports = { list, getOne, updateProfile, toggleAvailability };
