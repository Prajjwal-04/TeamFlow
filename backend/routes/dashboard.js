const express = require('express');
const router = express.Router();
const { getDashboardStats, getCalendarTasks } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.get('/stats', protect, getDashboardStats);
router.get('/calendar', protect, getCalendarTasks);

module.exports = router;
