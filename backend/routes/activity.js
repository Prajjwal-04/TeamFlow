const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Activity = require('../models/Activity');

router.get('/', protect, async (req, res, next) => {
  try {
    const { project, limit = 20 } = req.query;
    const filter = {};
    if (project) filter.project = project;
    else {
      const Project = require('../models/Project');
      const userProjects = await Project.find({ 'members.user': req.user._id }).select('_id');
      filter.project = { $in: userProjects.map(p => p._id) };
    }

    const activities = await Activity.find(filter)
      .populate('user', 'name avatar')
      .populate('task', 'title')
      .populate('project', 'name')
      .sort('-createdAt')
      .limit(parseInt(limit));

    res.json({ success: true, activities });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
