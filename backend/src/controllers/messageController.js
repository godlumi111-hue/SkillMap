const { getDb } = require('../config/database');

// GET /api/messages/conversations
function conversations(req, res) {
  const db = getDb();
  const convos = db.prepare(`
    SELECT
      CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as partner_id,
      u.full_name as partner_name, u.avatar_url as partner_avatar, u.role as partner_role,
      m.content as last_message, m.created_at as last_at,
      SUM(CASE WHEN m.receiver_id = ? AND m.is_read = 0 THEN 1 ELSE 0 END) as unread
    FROM messages m
    JOIN users u ON u.id = (CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END)
    WHERE m.sender_id = ? OR m.receiver_id = ?
    GROUP BY partner_id
    ORDER BY last_at DESC
  `).all(req.user.id, req.user.id, req.user.id, req.user.id, req.user.id);

  res.json({ conversations: convos });
}

// GET /api/messages/:user_id
function thread(req, res) {
  const db = getDb();
  const messages = db.prepare(`
    SELECT m.*, s.full_name as sender_name, s.avatar_url as sender_avatar
    FROM messages m JOIN users s ON s.id = m.sender_id
    WHERE (m.sender_id = ? AND m.receiver_id = ?)
       OR (m.sender_id = ? AND m.receiver_id = ?)
    ORDER BY m.created_at ASC
  `).all(req.user.id, req.params.user_id, req.params.user_id, req.user.id);

  // Marquer comme lus
  db.prepare('UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND sender_id = ? AND is_read = 0')
    .run(req.user.id, req.params.user_id);

  res.json({ messages });
}

// POST /api/messages/:user_id
function send(req, res) {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Message vide' });

  const db = getDb();
  const receiver = db.prepare('SELECT id FROM users WHERE id = ? AND is_active = 1').get(req.params.user_id);
  if (!receiver) return res.status(404).json({ error: 'Destinataire introuvable' });

  const result = db.prepare(
    'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?,?,?)'
  ).run(req.user.id, req.params.user_id, content.trim());

  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(message);
}

module.exports = { conversations, thread, send };
