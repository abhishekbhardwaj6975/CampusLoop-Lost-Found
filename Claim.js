const { getDb } = require('../config/db');

function safeParseImages(raw) {
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatClaim(row) {
  if (!row) return null;
  return {
    id: row.id,
    itemId: row.itemId,
    lostItemId: row.lostItemId || null,
    proofText: row.proofText,
    proofImage: row.proofImage || '',
    status: row.status,
    adminNote: row.adminNote || '',
    createdAt: row.createdAt,
    claimedBy: {
      id: row.claimedBy,
      name: row.claimantName,
      email: row.claimantEmail,
      phone: row.claimantPhone || '',
      department: row.claimantDepartment || '',
    },
    item: {
      id: row.itemId,
      title: row.itemTitle,
      description: row.itemDescription,
      category: row.itemCategory,
      type: row.itemType,
      location: row.itemLocation,
      date: row.itemDate,
      images: safeParseImages(row.itemImages),
      status: row.itemStatus,
      reportedBy: {
        id: row.itemReportedBy,
        name: row.itemReporterName,
        email: row.itemReporterEmail,
        phone: row.itemReporterPhone || '',
        department: row.itemReporterDepartment || '',
      },
    },
    lostItem: row.lostItemId
      ? {
          id: row.lostItemId,
          title: row.lostItemTitle,
          description: row.lostItemDescription,
          category: row.lostItemCategory,
          type: row.lostItemType,
          location: row.lostItemLocation,
          date: row.lostItemDate,
          images: safeParseImages(row.lostItemImages),
          status: row.lostItemStatus,
        }
      : null,
  };
}

const BASE_CLAIM_SELECT = `
  SELECT c.*,
    cu.name AS claimantName,
    cu.email AS claimantEmail,
    cu.phone AS claimantPhone,
    cu.department AS claimantDepartment,
    i.title AS itemTitle,
    i.description AS itemDescription,
    i.category AS itemCategory,
    i.type AS itemType,
    i.location AS itemLocation,
    i.date AS itemDate,
    i.images AS itemImages,
    i.status AS itemStatus,
    i.reportedBy AS itemReportedBy,
    iu.name AS itemReporterName,
    iu.email AS itemReporterEmail,
    iu.phone AS itemReporterPhone,
    iu.department AS itemReporterDepartment,
    li.title AS lostItemTitle,
    li.description AS lostItemDescription,
    li.category AS lostItemCategory,
    li.type AS lostItemType,
    li.location AS lostItemLocation,
    li.date AS lostItemDate,
    li.images AS lostItemImages,
    li.status AS lostItemStatus
  FROM claims c
  JOIN users cu ON cu.id = c.claimedBy
  JOIN items i ON i.id = c.itemId
  JOIN users iu ON iu.id = i.reportedBy
  LEFT JOIN items li ON li.id = c.lostItemId
`;

const ClaimModel = {
  create({ itemId, lostItemId = null, claimedBy, proofText, proofImage = '' }) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO claims (itemId, lostItemId, claimedBy, proofText, proofImage, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `);
    const result = stmt.run(
      Number(itemId),
      lostItemId ? Number(lostItemId) : null,
      Number(claimedBy),
      proofText.trim(),
      proofImage || ''
    );
    return this.findById(Number(result.lastInsertRowid));
  },

  findById(id) {
    const db = getDb();
    const row = db.prepare(`${BASE_CLAIM_SELECT} WHERE c.id = ?`).get(Number(id));
    return formatClaim(row);
  },

  findByUser(userId) {
    const db = getDb();
    const rows = db
      .prepare(`${BASE_CLAIM_SELECT} WHERE c.claimedBy = ? ORDER BY c.createdAt DESC`)
      .all(Number(userId));
    return rows.map(formatClaim);
  },

  findAll({ status = '' } = {}) {
    const db = getDb();
    const params = [];
    let where = '';
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      where = 'WHERE c.status = ?';
      params.push(status);
    }
    const rows = db
      .prepare(`${BASE_CLAIM_SELECT} ${where} ORDER BY c.createdAt DESC`)
      .all(...params);
    return rows.map(formatClaim);
  },

  findDuplicatePending(itemId, claimedBy) {
    const db = getDb();
    return db
      .prepare(
        "SELECT id FROM claims WHERE itemId = ? AND claimedBy = ? AND status = 'pending'"
      )
      .get(Number(itemId), Number(claimedBy));
  },

  updateStatus(id, { status, adminNote }) {
    const db = getDb();
    const current = this.findById(id);
    if (!current) return null;

    db.prepare('UPDATE claims SET status = ?, adminNote = ? WHERE id = ?').run(
      status,
      adminNote !== undefined ? adminNote.trim() : current.adminNote,
      Number(id)
    );
    return this.findById(id);
  },

  countByStatus() {
    const db = getDb();
    const row = db
      .prepare(`
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected
        FROM claims
      `)
      .get();

    return {
      total: row?.total || 0,
      pending: row?.pending || 0,
      approved: row?.approved || 0,
      rejected: row?.rejected || 0,
    };
  },

  hasApprovedClaimForItem(itemId, excludeClaimId = null) {
    const db = getDb();
    const params = [Number(itemId)];
    let extra = '';
    if (excludeClaimId) {
      extra = ' AND id != ?';
      params.push(Number(excludeClaimId));
    }
    const row = db
      .prepare(`SELECT COUNT(*) AS cnt FROM claims WHERE itemId = ? AND status = 'approved'${extra}`)
      .get(...params);
    return (row?.cnt || 0) > 0;
  },

  hasPendingClaimForItem(itemId) {
    const db = getDb();
    const row = db
      .prepare("SELECT COUNT(*) AS cnt FROM claims WHERE itemId = ? AND status = 'pending'")
      .get(Number(itemId));
    return (row?.cnt || 0) > 0;
  },
};

module.exports = ClaimModel;

