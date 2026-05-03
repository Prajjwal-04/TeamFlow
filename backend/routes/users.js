const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');

// Get all users (admin) or search users
router.get('/', protect, async (req, res, next) => {
  try {
    const { search, email } = req.query;
    let filter = { isActive: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (email) {
      filter.email = email.toLowerCase();
    }

    const users = await User.find(filter).select('name email avatar role lastActive').limit(20);
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
});

// Get user by ID
router.get('/:id', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('name email avatar role lastActive createdAt');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
