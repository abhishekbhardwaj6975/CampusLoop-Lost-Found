const ClaimModel = require('../models/Claim');
const ItemModel = require('../models/Item');
const UserModel = require('../models/User');
const NotificationModel = require('../models/Notification');

function createClaim(req, res, next) {
  try {
    const { itemId, lostItemId, proofText } = req.body;
    const item = ItemModel.findById(itemId);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    if (item.status === 'returned') {
      return res.status(400).json({
        success: false,
        message: 'This item has already been returned and can no longer be claimed.',
      });
    }

    const reporterId =
      typeof item.reportedBy === 'object' ? item.reportedBy.id : item.reportedBy;
    if (reporterId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot submit a claim on an item you reported yourself.',
      });
    }

    const duplicate = ClaimModel.findDuplicatePending(item.id, req.user.id);
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'You already have a pending claim for this item. Please wait for admin review.',
      });
    }

    let validLostItemId = null;
    if (lostItemId) {
      const linkedLost = ItemModel.findById(lostItemId);
      if (linkedLost && linkedLost.id !== item.id) {
        validLostItemId = linkedLost.id;
      }
    }

    const proofImage = req.file ? `/uploads/${req.file.filename}` : '';

    const claim = ClaimModel.create({
      itemId: item.id,
      lostItemId: validLostItemId,
      claimedBy: req.user.id,
      proofText,
      proofImage,
    });

    if (item.status === 'open') {
      ItemModel.updateStatus(item.id, 'claimed');
    }

    // Notify item reporter
    NotificationModel.create({
      userId: reporterId,
      message: `${req.user.name} submitted a claim for "${item.title}". An admin will verify it shortly.`,
      link: `/items/${item.id}`,
    });

    // Notify admins
    const admins = UserModel.findAdmins();
    for (const admin of admins) {
      if (admin.id !== req.user.id) {
        NotificationModel.create({
          userId: admin.id,
          message: `New claim submitted by ${req.user.name} for "${item.title}" requires verification.`,
          link: '/admin/claims',
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Claim submitted successfully! An administrator will verify your proof.',
      claim,
    });
  } catch (err) {
    next(err);
  }
}

function getMyClaims(req, res, next) {
  try {
    const claims = ClaimModel.findByUser(req.user.id);
    res.json({ success: true, claims });
  } catch (err) {
    next(err);
  }
}

function getAllClaims(req, res, next) {
  try {
    const { status = '' } = req.query;
    const claims = ClaimModel.findAll({ status });
    const counts = ClaimModel.countByStatus();

    res.json({
      success: true,
      claims,
      counts,
    });
  } catch (err) {
    next(err);
  }
}

function updateClaimStatus(req, res, next) {
  try {
    const { status, adminNote = '' } = req.body;
    const existing = ClaimModel.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Claim not found.' });
    }

    const updated = ClaimModel.updateStatus(existing.id, { status, adminNote });

    const claimantId = existing.claimedBy.id;
    const reporterId = existing.item.reportedBy.id;

    if (status === 'approved') {
      // Mark item as returned (and linked lost item if present)
      ItemModel.updateStatus(existing.item.id, 'returned');
      if (existing.lostItemId) {
        ItemModel.updateStatus(existing.lostItemId, 'returned');
      }

      const noteSuffix = adminNote ? ` Admin note: ${adminNote}` : '';
      NotificationModel.create({
        userId: claimantId,
        message: `Your claim for "${existing.item.title}" has been APPROVED! Please collect your item from the Campus Lost & Found Desk.${noteSuffix}`,
        link: '/dashboard',
      });

      if (reporterId !== claimantId) {
        NotificationModel.create({
          userId: reporterId,
          message: `Good news! "${existing.item.title}" has been verified and marked as Returned to ${existing.claimedBy.name}.`,
          link: `/items/${existing.item.id}`,
        });
      }
    } else if (status === 'rejected') {
      // If no other approved claim exists, revert item status to claimed (if other pending) or open
      if (!ClaimModel.hasApprovedClaimForItem(existing.item.id, existing.id)) {
        const nextItemStatus = ClaimModel.hasPendingClaimForItem(existing.item.id)
          ? 'claimed'
          : 'open';
        ItemModel.updateStatus(existing.item.id, nextItemStatus);
      }

      const noteSuffix = adminNote ? ` Reason: ${adminNote}` : '';
      NotificationModel.create({
        userId: claimantId,
        message: `Your claim for "${existing.item.title}" was rejected by the administrator.${noteSuffix}`,
        link: '/dashboard',
      });
    } else if (status === 'pending') {
      // Reset to pending: revert returned item back to claimed if no other approved claim exists
      if (!ClaimModel.hasApprovedClaimForItem(existing.item.id, existing.id)) {
        ItemModel.updateStatus(existing.item.id, 'claimed');
      }
      if (existing.lostItemId) {
        ItemModel.updateStatus(existing.lostItemId, 'open');
      }

      NotificationModel.create({
        userId: claimantId,
        message: `Your claim for "${existing.item.title}" has been moved back to Pending for re-evaluation.`,
        link: '/dashboard',
      });
    }

    res.json({
      success: true,
      message: `Claim status updated to ${status}.`,
      claim: updated,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createClaim,
  getMyClaims,
  getAllClaims,
  updateClaimStatus,
};

