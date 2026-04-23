const { getDb } = require('../config/database');

// GET /api/categories
function list(req, res) {
  const db = getDb();
  const categories = db.prepare(`
    SELECT c.*, COUNT(pc.provider_id) as provider_count
    FROM categories c
    LEFT JOIN provider_categories pc ON pc.category_id = c.id
    GROUP BY c.id
    ORDER BY provider_count DESC
  `).all();
  res.json({ categories });
}

module.exports = { list };
