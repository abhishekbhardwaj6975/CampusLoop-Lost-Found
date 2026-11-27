const { getDb } = require('../config/db');

function safeParseImages(raw) {
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatItem(row) {
  if (!row) return null;
  const item = {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    type: row.type,
    location: row.location,
    date: row.date,
    images: safeParseImages(row.images),
    status: row.status,
    reportedBy: row.reporterName
      ? {
          id: row.reportedBy,
          name: row.reporterName,
          email: row.reporterEmail,
          phone: row.reporterPhone || '',
          department: row.reporterDepartment || '',
          role: row.reporterRole || 'student',
        }
      : row.reportedBy,
    createdAt: row.createdAt,
  };
  if (row.pendingClaimsCount !== undefined) {
    item.pendingClaimsCount = row.pendingClaimsCount;
  }
  return item;
}

const BASE_SELECT = `
  SELECT i.*,
    u.name AS reporterName,
    u.email AS reporterEmail,
    u.phone AS reporterPhone,
    u.department AS reporterDepartment,
    u.role AS reporterRole,
    (SELECT COUNT(*) FROM claims c WHERE c.itemId = i.id AND c.status = 'pending') AS pendingClaimsCount
  FROM items i
  JOIN users u ON u.id = i.reportedBy
`;

const ItemModel = {
  create({ title, description, category, type, location, date, images = [], status = 'open', reportedBy }) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO items (title, description, category, type, location, date, images, status, reportedBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      title.trim(),
      description.trim(),
      category.trim(),
      type,
      location.trim(),
      date,
      JSON.stringify(images),
      status,
      Number(reportedBy)
    );
    return this.findById(Number(result.lastInsertRowid));
  },

  findById(id) {
    const db = getDb();
    const row = db.prepare(`${BASE_SELECT} WHERE i.id = ?`).get(Number(id));
    return formatItem(row);
  },

  findAll({
    type = '',
    category = '',
    location = '',
    status = '',
    search = '',
    dateFrom = '',
    dateTo = '',
    reportedBy = '',
    sort = 'newest',
    page = 1,
    limit = 12,
  } = {}) {
    const db = getDb();
    const conditions = [];
    const params = [];

    if (type && ['lost', 'found'].includes(type)) {
      conditions.push('i.type = ?');
      params.push(type);
    }
    if (category && category !== 'All') {
      conditions.push('LOWER(i.category) = LOWER(?)');
      params.push(category);
    }
    if (location) {
      conditions.push('LOWER(i.location) LIKE ?');
      params.push(`%${location.trim().toLowerCase()}%`);
    }
    if (status && ['open', 'claimed', 'returned'].includes(status)) {
      conditions.push('i.status = ?');
      params.push(status);
    }
    if (search) {
      conditions.push(
        '(LOWER(i.title) LIKE ? OR LOWER(i.description) LIKE ? OR LOWER(i.location) LIKE ? OR LOWER(i.category) LIKE ?)'
      );
      const q = `%${search.trim().toLowerCase()}%`;
      params.push(q, q, q, q);
    }
    if (dateFrom) {
      conditions.push('i.date >= ?');
      params.push(dateFrom);
    }
    if (dateTo) {
      conditions.push('i.date <= ?');
      params.push(dateTo);
    }
    if (reportedBy) {
      conditions.push('i.reportedBy = ?');
      params.push(Number(reportedBy));
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = sort === 'oldest' ? 'i.createdAt ASC, i.id ASC' : 'i.createdAt DESC, i.id DESC';

    const totalRow = db
      .prepare(`SELECT COUNT(*) AS total FROM items i ${where}`)
      .get(...params);
    const total = totalRow ? totalRow.total : 0;

    const safeLimit = Math.max(1, Math.min(Number(limit) || 12, 100));
    const safePage = Math.max(1, Number(page) || 1);
    const offset = (safePage - 1) * safeLimit;

    const rows = db
      .prepare(`${BASE_SELECT} ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`)
      .all(...params, safeLimit, offset);

    return {
      items: rows.map(formatItem),
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      },
    };
  },

  findOppositeCandidates(type, excludeId = null) {
    const db = getDb();
    const oppositeType = type === 'lost' ? 'found' : 'lost';
    const params = [oppositeType];
    let extra = '';
    if (excludeId) {
      extra = ' AND i.id != ?';
      params.push(Number(excludeId));
    }
    const rows = db
      .prepare(
        `${BASE_SELECT} WHERE i.type = ? AND i.status != 'returned'${extra} ORDER BY i.createdAt DESC`
      )
      .all(...params);
    return rows.map(formatItem);
  },

  findByUser(userId, type = '') {
    const db = getDb();
    const params = [Number(userId)];
    let typeFilter = '';
    if (type && ['lost', 'found'].includes(type)) {
      typeFilter = ' AND i.type = ?';
      params.push(type);
    }
    const rows = db
      .prepare(`${BASE_SELECT} WHERE i.reportedBy = ?${typeFilter} ORDER BY i.createdAt DESC`)
      .all(...params);
    return rows.map(formatItem);
  },

  update(id, fields) {
    const db = getDb();
    const current = this.findById(id);
    if (!current) return null;

    const nextTitle = fields.title !== undefined ? fields.title.trim() : current.title;
    const nextDescription =
      fields.description !== undefined ? fields.description.trim() : current.description;
    const nextCategory = fields.category !== undefined ? fields.category.trim() : current.category;
    const nextType = fields.type !== undefined ? fields.type : current.type;
    const nextLocation = fields.location !== undefined ? fields.location.trim() : current.location;
    const nextDate = fields.date !== undefined ? fields.date : current.date;
    const nextImages = fields.images !== undefined ? fields.images : current.images;
    const nextStatus = fields.status !== undefined ? fields.status : current.status;

    db.prepare(`
      UPDATE items
      SET title = ?, description = ?, category = ?, type = ?, location = ?, date = ?, images = ?, status = ?
      WHERE id = ?
    `).run(
      nextTitle,
      nextDescription,
      nextCategory,
      nextType,
      nextLocation,
      nextDate,
      JSON.stringify(nextImages),
      nextStatus,
      Number(id)
    );

    return this.findById(id);
  },

  updateStatus(id, status) {
    const db = getDb();
    db.prepare('UPDATE items SET status = ? WHERE id = ?').run(status, Number(id));
    return this.findById(id);
  },

  delete(id) {
    const db = getDb();
    const result = db.prepare('DELETE FROM items WHERE id = ?').run(Number(id));
    return result.changes > 0;
  },

  getPublicStats() {
    const db = getDb();
    const row = db
      .prepare(`
        SELECT
          COUNT(*) AS totalItems,
          SUM(CASE WHEN type = 'lost' THEN 1 ELSE 0 END) AS lostItems,
          SUM(CASE WHEN type = 'found' THEN 1 ELSE 0 END) AS foundItems,
          SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) AS returnedItems,
          SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) AS openItems
        FROM items
      `)
      .get();

    return {
      totalItems: row?.totalItems || 0,
      lostItems: row?.lostItems || 0,
      foundItems: row?.foundItems || 0,
      returnedItems: row?.returnedItems || 0,
      openItems: row?.openItems || 0,
    };
  },

  getCategoryBreakdown() {
    const db = getDb();
    return db
      .prepare(`
        SELECT category,
          COUNT(*) AS total,
          SUM(CASE WHEN type = 'lost' THEN 1 ELSE 0 END) AS lost,
          SUM(CASE WHEN type = 'found' THEN 1 ELSE 0 END) AS found
        FROM items
        GROUP BY category
        ORDER BY total DESC
      `)
      .all()
      .map((r) => ({
        category: r.category,
        total: r.total,
        lost: r.lost,
        found: r.found,
      }));
  },
};

module.exports = ItemModel;

