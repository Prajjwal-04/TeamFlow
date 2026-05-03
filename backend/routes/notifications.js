const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// Get notifications
router.get('/', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('notifications');
    const notifications = user.notifications.sort((a, b) => b.createdAt - a.createdAt).slice(0, 50);
    res.json({ success: true, notifications, unreadCount: notifications.filter(n => !n.read).length });
  } catch (err) {
    next(err);
  }
});

// Mark all as read
router.put('/read-all', protect, async (req, res, next) => {
  try {
    await User.updateOne(
      { _id: req.user._id },
      { $set: { 'notifications.$[].read': true } }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

// Mark single as read
router.put('/:notifId/read', protect, async (req, res, next) => {
  try {
    await User.updateOne(
      { _id: req.user._id, 'notifications._id': req.params.notifId },
      { $set: { 'notifications.$.read': true } }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
