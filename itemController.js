const ItemModel = require('../models/Item');
const NotificationModel = require('../models/Notification');
const { findSmartMatches } = require('../utils/matcher');

function getPublicStats(_req, res, next) {
  try {
    const stats = ItemModel.getPublicStats();
    res.json({ success: true, stats });
  } catch (err) {
    next(err);
  }
}

function getItems(req, res, next) {
  try {
    const {
      type,
      category,
      location,
      status,
      search,
      dateFrom,
      dateTo,
      reportedBy,
      sort = 'newest',
      page = 1,
      limit = 12,
    } = req.query;

    const result = ItemModel.findAll({
      type,
      category,
      location,
      status,
      search,
      dateFrom,
      dateTo,
      reportedBy,
      sort,
      page,
      limit,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

function getMyItems(req, res, next) {
  try {
    const items = ItemModel.findByUser(req.user.id);

    // Compute top smart matches for each active (non-returned) item
    const smartSuggestions = [];
    for (const item of items) {
      if (item.status === 'returned') continue;
      const candidates = ItemModel.findOppositeCandidates(item.type, item.id);
      const matches = findSmartMatches(item, candidates, { limit: 3, minScore: 35 });
      for (const m of matches) {
        smartSuggestions.push({
          sourceItem: {
            id: item.id,
            title: item.title,
            type: item.type,
            category: item.category,
          },
          ...m,
        });
      }
    }

    smartSuggestions.sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      items,
      smartMatches: smartSuggestions.slice(0, 5),
    });
  } catch (err) {
    next(err);
  }
}

function getItemById(req, res, next) {
  try {
    const item = ItemModel.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

function createItem(req, res, next) {
  try {
    const { title, description, category, type, location, date } = req.body;
    const uploadedImages = (req.files || []).map((file) => `/uploads/${file.filename}`);

    const item = ItemModel.create({
      title,
      description,
      category,
      type,
      location,
      date,
      images: uploadedImages,
      status: 'open',
      reportedBy: req.user.id,
    });

    // Run Smart Matching Algorithm against opposite-type items
    const candidates = ItemModel.findOppositeCandidates(item.type, item.id);
    const matches = findSmartMatches(item, candidates, { limit: 5, minScore: 25 });

    // Notify owners of strong potential matches (>= 45%)
    const strongMatches = matches.filter((m) => m.score >= 45);
    const notifiedOwners = new Set();

    for (const match of strongMatches) {
      const ownerId =
        typeof match.item.reportedBy === 'object'
          ? match.item.reportedBy.id
          : match.item.reportedBy;

      if (ownerId && ownerId !== req.user.id && !notifiedOwners.has(ownerId)) {
        notifiedOwners.add(ownerId);
        NotificationModel.create({
          userId: ownerId,
          message: `Smart Match (${match.score}%): A newly reported ${item.type} item "${item.title}" matches your ${match.item.type} report "${match.item.title}".`,
          link: `/items/${item.id}`,
        });
      }
    }

    if (strongMatches.length > 0) {
      const top = strongMatches[0];
      NotificationModel.create({
        userId: req.user.id,
        message: `We found ${strongMatches.length} potential match${strongMatches.length > 1 ? 'es' : ''} for "${item.title}" (top match: ${top.score}%).`,
        link: `/items/${item.id}`,
      });
    }

    res.status(201).json({
      success: true,
      message: `${type === 'lost' ? 'Lost' : 'Found'} item reported successfully!`,
      item,
      matches,
    });
  } catch (err) {
    next(err);
  }
}

function updateItem(req, res, next) {
  try {
    const existing = ItemModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    const ownerId =
      typeof existing.reportedBy === 'object' ? existing.reportedBy.id : existing.reportedBy;
    if (ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this item.',
      });
    }

    const { title, description, category, type, location, date, status, existingImages } = req.body;
    let nextImages = existing.images;

    if (existingImages !== undefined || (req.files && req.files.length > 0)) {
      let kept = existing.images;
      if (existingImages !== undefined) {
        try {
          kept = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
          if (!Array.isArray(kept)) kept = [];
        } catch {
          kept = [];
        }
      }
      const newlyUploaded = (req.files || []).map((file) => `/uploads/${file.filename}`);
      nextImages = [...kept, ...newlyUploaded].slice(0, 4);
    }

    const updated = ItemModel.update(existing.id, {
      title,
      description,
      category,
      type,
      location,
      date,
      status: req.user.role === 'admin' && status ? status : existing.status,
      images: nextImages,
    });

    res.json({
      success: true,
      message: 'Item updated successfully.',
      item: updated,
    });
  } catch (err) {
    next(err);
  }
}

function updateItemStatus(req, res, next) {
  try {
    const existing = ItemModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    const ownerId =
      typeof existing.reportedBy === 'object' ? existing.reportedBy.id : existing.reportedBy;
    if (ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to change this item status.',
      });
    }

    const { status } = req.body;
    const updated = ItemModel.updateStatus(existing.id, status);

    res.json({
      success: true,
      message: `Item marked as ${status}.`,
      item: updated,
    });
  } catch (err) {
    next(err);
  }
}

function deleteItem(req, res, next) {
  try {
    const existing = ItemModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    const ownerId =
      typeof existing.reportedBy === 'object' ? existing.reportedBy.id : existing.reportedBy;
    if (ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this item.',
      });
    }

    ItemModel.delete(existing.id);
    res.json({
      success: true,
      message: 'Item deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

function getItemMatches(req, res, next) {
  try {
    const item = ItemModel.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    const candidates = ItemModel.findOppositeCandidates(item.type, item.id);
    const matches = findSmartMatches(item, candidates, { limit: 5, minScore: 20 });

    res.json({
      success: true,
      matches,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPublicStats,
  getItems,
  getMyItems,
  getItemById,
  createItem,
  updateItem,
  updateItemStatus,
  deleteItem,
  getItemMatches,
};

