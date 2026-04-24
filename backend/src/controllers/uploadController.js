const path = require('path');
const fs   = require('fs');

const UPLOAD_DIR = path.join(__dirname, '../../../uploads');

function ensureDir(sub) {
  const dir = path.join(UPLOAD_DIR, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function saveBase64(base64, subdir) {
  if (!base64 || typeof base64 !== 'string') throw new Error('Image requise');
  const m = base64.match(/^data:(image\/[\w+]+);base64,(.+)$/s);
  if (!m) throw new Error('Format image invalide (base64 attendu)');
  const mime = m[1];
  const extMap = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp' };
  const ext = extMap[mime] || 'jpg';
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 8 * 1024 * 1024) throw new Error('Image trop grande (max 8 Mo)');
  const dir = ensureDir(subdir);
  const fname = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  fs.writeFileSync(path.join(dir, fname), buf);
  return `/uploads/${subdir}/${fname}`;
}

// POST /api/providers/me/avatar  (clients peuvent aussi appeler)
function uploadAvatar(req, res) {
  const { image_base64 } = req.body;
  if (!image_base64) return res.status(400).json({ error: 'Image requise' });
  try {
    const url = saveBase64(image_base64, 'avatars');
    const { getDb } = require('../config/database');
    const db = getDb();
    db.prepare("UPDATE users SET avatar_url = ?, updated_at = datetime('now') WHERE id = ?")
      .run(url, req.user.id);
    res.json({ url });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

module.exports = { uploadAvatar, saveBase64 };
