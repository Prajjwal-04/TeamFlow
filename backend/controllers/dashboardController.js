const Task = require('../models/Task');
const Project = require('../models/Project');
const Activity = require('../models/Activity');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // Get user's projects
    const userProjects = await Project.find({ 'members.user': userId }).select('_id name color');
    const projectIds = userProjects.map(p => p._id);

    // Total tasks in user's projects
    const totalTasks = await Task.countDocuments({ project: { $in: projectIds } });

    // Tasks assigned to user
    const myTasks = await Task.countDocuments({ assignedTo: userId });

    // Completed tasks
    const completedTasks = await Task.countDocuments({ project: { $in: projectIds }, status: 'done' });

    // Overdue tasks
    const overdueTasks = await Task.countDocuments({
      project: { $in: projectIds },
      status: { $ne: 'done' },
      dueDate: { $lt: now }
    });

    // In progress
    const inProgressTasks = await Task.countDocuments({ project: { $in: projectIds }, status: 'in_progress' });

    // Tasks by priority
    const tasksByPriority = await Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Tasks by status
    const tasksByStatus = await Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Tasks completed per day (last 7 days)
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const completionTrend = await Task.aggregate([
      {
        $match: {
          project: { $in: projectIds },
          status: 'done',
          completedAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // My assigned tasks (upcoming)
    const myUpcomingTasks = await Task.find({
      assignedTo: userId,
      status: { $ne: 'done' }
    })
      .populate('project', 'name color')
      .sort({ dueDate: 1 })
      .limit(5);

    // Project progress
    const projectProgress = userProjects.map(p => {
      const proj = p.toObject ? p.toObject() : p;
      return proj;
    });

    const projectsWithStats = await Project.find({ _id: { $in: projectIds } })
      .populate('owner', 'name avatar')
      .select('name color taskCount completedTaskCount status');

    res.json({
      success: true,
      stats: {
        totalTasks,
        myTasks,
        completedTasks,
        overdueTasks,
        inProgressTasks,
        totalProjects: userProjects.length,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      charts: {
        tasksByPriority: tasksByPriority.map(t => ({ name: t._id, value: t.count })),
        tasksByStatus: tasksByStatus.map(t => ({ name: t._id, value: t.count })),
        completionTrend: completionTrend.map(t => ({ date: t._id, completed: t.count }))
      },
      myUpcomingTasks,
      projectsWithStats
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get calendar tasks
// @route   GET /api/dashboard/calendar?month=&year=
// @access  Private
exports.getCalendarTasks = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const m = parseInt(month) || now.getMonth() + 1;
    const y = parseInt(year) || now.getFullYear();

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const userProjects = await Project.find({ 'members.user': req.user._id }).select('_id');
    const projectIds = userProjects.map(p => p._id);

    const tasks = await Task.find({
      project: { $in: projectIds },
      dueDate: { $gte: startDate, $lte: endDate }
    })
      .populate('assignedTo', 'name avatar')
      .populate('project', 'name color')
      .select('title status priority dueDate assignedTo project')
      .sort({ dueDate: 1 });

    res.json({ success: true, tasks });
  } catch (err) {
    next(err);
  }
};
