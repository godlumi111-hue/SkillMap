const { getDb } = require('../config/database');

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function enrichProvider(p, userLat, userLng) {
  const db = getDb();
  const skills     = db.prepare('SELECT DISTINCT skill FROM provider_skills WHERE provider_id = ?').all(p.id).map(r => r.skill);
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
    avg_rating:   stats.avg_rating || 0,
    distance_km:  (userLat && userLng && p.lat && p.lng)
      ? Math.round(haversine(userLat, userLng, p.lat, p.lng) * 10) / 10
      : null
  };
}

// Score de classement intelligent (plus haut = mieux classé)
function computeScore(p, baseRates) {
  let score = 0;

  // Disponibilité
  if (p.is_available) score += 20;

  // Avis (0–50)
  if (p.avg_rating > 0) {
    score += p.avg_rating * 8;                          // max 40
    score += Math.min(p.review_count, 10);              // max 10 pour nb avis
  }

  // Vérification officielle
  if (p.is_verified) score += 25;

  // Points / réputation (0–20)
  score += Math.min(20, (p.points || 0) / 15);

  // Distance (0–20, seulement si connue)
  if (p.distance_km !== null) {
    score += Math.max(0, 20 - p.distance_km);
  }

  // Cohérence tarifaire : bonus si tarif ≤ 110% du prix recommandé
  if (p.hourly_rate && baseRates?.length && p.categories?.length) {
    const slug  = p.categories[0]?.slug;
    const level = p.level || 'débutant';
    const rec   = baseRates.find(r => r.category_slug === slug && r.level === level);
    if (rec?.base_rate) {
      const ratio = p.hourly_rate / rec.base_rate;
      if      (ratio <= 1.1) score += 10;
      else if (ratio <= 1.3) score += 6;
      else if (ratio <= 1.5) score += 2;
    }
  }

  return score;
}

// GET /api/providers
function list(req, res) {
  const { q, category, available, lat, lng, radius = 50, page = 1, limit = 20, sort = 'score' } = req.query;
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
    query += ` AND (normalize(u.full_name) LIKE normalize(?) OR normalize(p.title) LIKE normalize(?) OR normalize(p.description) LIKE normalize(?) OR normalize(p.neighborhood) LIKE normalize(?))`;
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

  const userLat   = lat ? parseFloat(lat) : null;
  const userLng   = lng ? parseFloat(lng) : null;
  const maxRadius = parseFloat(radius);

  providers = providers.map(p => enrichProvider(p, userLat, userLng));

  if (userLat && userLng) {
    providers = providers.filter(p => p.distance_km === null || p.distance_km <= maxRadius);
  }

  // Charger les prix de base pour le scoring
  const baseRates = db.prepare('SELECT * FROM category_base_prices').all();

  // Tri intelligent par défaut
  if (sort === 'score' || sort === 'distance') {
    providers.sort((a, b) => computeScore(b, baseRates) - computeScore(a, baseRates));
  } else if (sort === 'rating') {
    providers.sort((a, b) => b.avg_rating - a.avg_rating);
  } else if (sort === 'price_asc') {
    providers.sort((a, b) => (a.hourly_rate || 999999) - (b.hourly_rate || 999999));
  }

  const offset    = (parseInt(page) - 1) * parseInt(limit);
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
  const enriched     = enrichProvider(p, lat ? parseFloat(lat) : null, lng ? parseFloat(lng) : null);

  const reviews = db.prepare(`
    SELECT r.*, u.full_name as client_name, u.avatar_url as client_avatar
    FROM reviews r JOIN users u ON u.id = r.client_id
    WHERE r.provider_id = ? AND r.is_visible = 1
    ORDER BY r.created_at DESC LIMIT 20
  `).all(p.id);

  const portfolio = db.prepare(
    'SELECT * FROM portfolio_items WHERE provider_id = ? ORDER BY created_at DESC'
  ).all(p.id);

  // Prix recommandé selon le niveau du prestataire
  const recRates = {};
  if (enriched.categories?.length) {
    const slug = enriched.categories[0]?.slug;
    const level = enriched.level || 'débutant';
    const rec = db.prepare(
      'SELECT base_rate FROM category_base_prices WHERE category_slug = ? AND level = ?'
    ).get(slug, level);
    if (rec) recRates.recommended_rate = rec.base_rate;
  }

  db.prepare('UPDATE providers SET views_count = views_count + 1 WHERE id = ?').run(p.id);

  res.json({ ...enriched, ...recRates, reviews, portfolio });
}

// PUT /api/providers/me/profile
function updateProfile(req, res) {
  const db = getDb();
  const provider = db.prepare('SELECT * FROM providers WHERE user_id = ?').get(req.user.id);
  if (!provider) return res.status(404).json({ error: 'Profil prestataire introuvable' });

  const {
    title, description, city, neighborhood, lat, lng,
    is_available, hourly_rate, experience_years, skills, categories,
    full_name, phone, avatar_url,
  } = req.body;

  db.prepare(`
    UPDATE providers SET
      title            = COALESCE(?, title),
      description      = COALESCE(?, description),
      city             = COALESCE(?, city),
      neighborhood     = COALESCE(?, neighborhood),
      lat              = COALESCE(?, lat),
      lng              = COALESCE(?, lng),
      is_available     = COALESCE(?, is_available),
      hourly_rate      = COALESCE(?, hourly_rate),
      experience_years = COALESCE(?, experience_years),
      updated_at       = datetime('now')
    WHERE id = ?
  `).run(title, description, city, neighborhood, lat, lng, is_available, hourly_rate, experience_years, provider.id);

  if (full_name || phone || city || avatar_url) {
    db.prepare(`
      UPDATE users SET
        full_name  = COALESCE(?, full_name),
        phone      = COALESCE(?, phone),
        city       = COALESCE(?, city),
        avatar_url = COALESCE(?, avatar_url),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(full_name || null, phone || null, city || null, avatar_url || null, req.user.id);
  }

  if (Array.isArray(skills)) {
    db.prepare('DELETE FROM provider_skills WHERE provider_id = ?').run(provider.id);
    const ins = db.prepare('INSERT INTO provider_skills (provider_id, skill) VALUES (?,?)');
    skills.forEach(s => ins.run(provider.id, s.trim()));
  }

  if (Array.isArray(categories)) {
    db.prepare('DELETE FROM provider_categories WHERE provider_id = ?').run(provider.id);
    const ins = db.prepare('INSERT OR IGNORE INTO provider_categories VALUES (?,?)');
    categories.forEach(cid => ins.run(provider.id, cid));
  }

  const updated     = db.prepare('SELECT * FROM providers WHERE id = ?').get(provider.id);
  const updatedUser = db.prepare('SELECT id, email, full_name, phone, city, avatar_url FROM users WHERE id = ?').get(req.user.id);
  res.json({ ...updated, full_name: updatedUser.full_name, phone: updatedUser.phone, avatar_url: updatedUser.avatar_url });
}

// PATCH /api/providers/me/availability
function toggleAvailability(req, res) {
  const db = getDb();
  const provider = db.prepare('SELECT * FROM providers WHERE user_id = ?').get(req.user.id);
  if (!provider) return res.status(404).json({ error: 'Profil introuvable' });

  const newStatus = req.body.is_available !== undefined ? (req.body.is_available ? 1 : 0) : (provider.is_available ? 0 : 1);
  db.prepare("UPDATE providers SET is_available = ?, updated_at = datetime('now') WHERE id = ?").run(newStatus, provider.id);
  res.json({ is_available: !!newStatus });
}

module.exports = { list, getOne, updateProfile, toggleAvailability };
