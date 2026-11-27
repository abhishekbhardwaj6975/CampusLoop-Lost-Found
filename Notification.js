const { getDb } = require('../config/db');

function formatNotification(row) {
  if (!row) return null;
  return {
    id: row.id,
    user: row.userId,
    message: row.message,
    link: row.link || '',
    isRead: Boolean(row.isRead),
    createdAt: row.createdAt,
  };
}

const NotificationModel = {
  create({ userId, message, link = '' }) {
    const db = getDb();
    const result = db
      .prepare('INSERT INTO notifications (userId, message, link) VALUES (?, ?, ?)')
      .run(Number(userId), message, link);
    return this.findById(Number(result.lastInsertRowid));
  },

  findById(id) {
    const db = getDb();
    const row = db.prepare('SELECT * FROM notifications WHERE id = ?').get(Number(id));
    return formatNotification(row);
  },

  findByUser(userId, limit = 30) {
    const db = getDb();
    const rows = db
      .prepare('SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT ?')
      .all(Number(userId), Number(limit));
    return rows.map(formatNotification);
  },

  countUnread(userId) {
    const db = getDb();
    const row = db
      .prepare('SELECT COUNT(*) AS unread FROM notifications WHERE userId = ? AND isRead = 0')
      .get(Number(userId));
    return row ? row.unread : 0;
  },

  markAsRead(id, userId) {
    const db = getDb();
    db.prepare('UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?').run(
      Number(id),
      Number(userId)
    );
    return this.findById(id);
  },

  markAllAsRead(userId) {
    const db = getDb();
    db.prepare('UPDATE notifications SET isRead = 1 WHERE userId = ? AND isRead = 0').run(
      Number(userId)
    );
  },
};

module.exports = NotificationModel;

