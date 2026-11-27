const NotificationModel = require('../models/Notification');

function getNotifications(req, res, next) {
  try {
    const notifications = NotificationModel.findByUser(req.user.id);
    const unreadCount = NotificationModel.countUnread(req.user.id);
    res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
}

function markAsRead(req, res, next) {
  try {
    const notification = NotificationModel.markAsRead(req.params.id, req.user.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }
    const unreadCount = NotificationModel.countUnread(req.user.id);
    res.json({
      success: true,
      notification,
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
}

function markAllAsRead(req, res, next) {
  try {
    NotificationModel.markAllAsRead(req.user.id);
    res.json({
      success: true,
      message: 'All notifications marked as read.',
      unreadCount: 0,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getNotifications, markAsRead, markAllAsRead };

