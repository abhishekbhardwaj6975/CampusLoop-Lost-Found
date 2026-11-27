const { getDb } = require('../config/db');

function formatUser(row, includePassword = false) {
  if (!row) return null;
  const user = {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    phone: row.phone || '',
    department: row.department || '',
    isBlocked: Boolean(row.isBlocked),
    createdAt: row.createdAt,
  };
  if (includePassword) {
    user.password = row.password;
  }
  return user;
}

const UserModel = {
  create({ name, email, password, role = 'student', phone = '', department = '', isBlocked = 0 }) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO users (name, email, password, role, phone, department, isBlocked)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      name.trim(),
      email.trim().toLowerCase(),
      password,
      role,
      phone.trim(),
      department.trim(),
      isBlocked ? 1 : 0
    );
    return this.findById(Number(result.lastInsertRowid));
  },

  findById(id, includePassword = false) {
    const db = getDb();
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(id));
    return formatUser(row, includePassword);
  },

  findByEmail(email, includePassword = false) {
    const db = getDb();
    const row = db
      .prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)')
      .get(email.trim());
    return formatUser(row, includePassword);
  },

  findAdmins() {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM users WHERE role = 'admin' AND isBlocked = 0").all();
    return rows.map((r) => formatUser(r));
  },

  findAll({ search = '', role = '' } = {}) {
    const db = getDb();
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(u.department) LIKE ?)');
      const term = `%${search.toLowerCase()}%`;
      params.push(term, term, term);
    }
    if (role && ['student', 'admin'].includes(role)) {
      conditions.push('u.role = ?');
      params.push(role);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = db
      .prepare(`
        SELECT u.*,
          (SELECT COUNT(*) FROM items i WHERE i.reportedBy = u.id) AS itemsCount,
          (SELECT COUNT(*) FROM claims c WHERE c.claimedBy = u.id) AS claimsCount
        FROM users u
        ${where}
        ORDER BY u.createdAt DESC
      `)
      .all(...params);

    return rows.map((row) => ({
      ...formatUser(row),
      itemsCount: row.itemsCount || 0,
      claimsCount: row.claimsCount || 0,
    }));
  },

  updateProfile(id, { name, phone, department }) {
    const db = getDb();
    const current = this.findById(id);
    if (!current) return null;

    db.prepare(`
      UPDATE users
      SET name = ?, phone = ?, department = ?
      WHERE id = ?
    `).run(
      name !== undefined ? name.trim() : current.name,
      phone !== undefined ? phone.trim() : current.phone,
      department !== undefined ? department.trim() : current.department,
      Number(id)
    );
    return this.findById(id);
  },

  updatePassword(id, hashedPassword) {
    const db = getDb();
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, Number(id));
    return this.findById(id);
  },

  updateAdminFields(id, { isBlocked, role }) {
    const db = getDb();
    const current = this.findById(id);
    if (!current) return null;

    const nextBlocked = isBlocked !== undefined ? (isBlocked ? 1 : 0) : current.isBlocked ? 1 : 0;
    const nextRole = role !== undefined && ['student', 'admin'].includes(role) ? role : current.role;

    db.prepare('UPDATE users SET isBlocked = ?, role = ? WHERE id = ?').run(
      nextBlocked,
      nextRole,
      Number(id)
    );
    return this.findById(id);
  },

  delete(id) {
    const db = getDb();
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(Number(id));
    return result.changes > 0;
  },

  countAll() {
    const db = getDb();
    const row = db.prepare('SELECT COUNT(*) as total FROM users').get();
    return row ? row.total : 0;
  },
};

module.exports = UserModel;

