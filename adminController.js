const UserModel = require('../models/User');
const ItemModel = require('../models/Item');
const ClaimModel = require('../models/Claim');

function getStats(_req, res, next) {
  try {
    const itemStats = ItemModel.getPublicStats();
    const claimStats = ClaimModel.countByStatus();
    const totalUsers = UserModel.countAll();
    const categoryBreakdown = ItemModel.getCategoryBreakdown();
    const recentItems = ItemModel.findAll({ limit: 5, sort: 'newest' }).items;
    const recentClaims = ClaimModel.findAll({ status: 'pending' }).slice(0, 5);

    res.json({
      success: true,
      stats: {
        ...itemStats,
        totalUsers,
        claims: claimStats,
        lostVsFound: [
          { name: 'Lost Items', value: itemStats.lostItems, color: '#ef4444' },
          { name: 'Found Items', value: itemStats.foundItems, color: '#22c55e' },
        ],
        categoryBreakdown,
        recentItems,
        recentClaims,
      },
    });
  } catch (err) {
    next(err);
  }
}

function getUsers(req, res, next) {
  try {
    const { search = '', role = '' } = req.query;
    const users = UserModel.findAll({ search, role });
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
}

function updateUser(req, res, next) {
  try {
    const targetId = Number(req.params.id);
    if (targetId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot block or change your own admin account.',
      });
    }

    const existing = UserModel.findById(targetId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { isBlocked, role } = req.body;
    const updated = UserModel.updateAdminFields(targetId, { isBlocked, role });

    res.json({
      success: true,
      message:
        isBlocked !== undefined
          ? `User ${updated.isBlocked ? 'blocked' : 'unblocked'} successfully.`
          : 'User updated successfully.',
      user: updated,
    });
  } catch (err) {
    next(err);
  }
}

function deleteUser(req, res, next) {
  try {
    const targetId = Number(req.params.id);
    if (targetId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.',
      });
    }

    const deleted = UserModel.delete(targetId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      message: 'User deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getStats, getUsers, updateUser, deleteUser };

