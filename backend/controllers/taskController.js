const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { logActivity } = require('../utils/activity');

// Helper: check project membership
const checkMembership = async (projectId, userId, globalRole) => {
  const project = await Project.findById(projectId);
  if (!project) return { error: 'Project not found', status: 404 };
  const member = project.members.find(m => m.user?.toString() === userId.toString());
  if (!member && globalRole !== 'admin') return { error: 'Access denied', status: 403 };
  return { project, member };
};

// @desc    Get tasks (with filters)
// @route   GET /api/tasks?project=&status=&priority=&assignedTo=&search=&overdue=
// @access  Private
exports.getTasks = async (req, res, next) => {
  try {
    const { project, status, priority, assignedTo, search, overdue, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (project) {
      const { error } = await checkMembership(project, req.user._id, req.user.role);
      if (error) return res.status(403).json({ success: false, message: error });
      filter.project = project;
    } else {
      // Only return tasks from user's projects
      const userProjects = await Project.find({ 'members.user': req.user._id }).select('_id');
      filter.project = { $in: userProjects.map(p => p._id) };
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) filter.title = { $regex: search, $options: 'i' };
    if (overdue === 'true') {
      filter.status = { $ne: 'done' };
      filter.dueDate = { $lt: new Date() };
    }

    const total = await Task.countDocuments(filter);
    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color')
      .sort({ dueDate: 1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({ success: true, count: total, tasks });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color members')
      .populate('comments.author', 'name avatar');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const { error } = await checkMembership(task.project._id, req.user._id, req.user.role);
    if (error) return res.status(403).json({ success: false, message: error });

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private (Admin)
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, project, assignedTo, priority, dueDate, tags, status } = req.body;

    const { error, member } = await checkMembership(project, req.user._id, req.user.role);
    if (error) return res.status(403).json({ success: false, message: error });

    if (member && member.role !== 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required to create tasks' });
    }

    const task = await Task.create({
      title, description, project, assignedTo, priority,
      dueDate, tags, status, createdBy: req.user._id
    });

    // Notify assignee
    if (assignedTo && assignedTo !== req.user._id.toString()) {
      const assignee = await User.findById(assignedTo);
      if (assignee) {
        const proj = await Project.findById(project);
        assignee.notifications.push({
          message: `You were assigned task "${title}" in ${proj?.name}`,
          type: 'task_assigned',
          relatedTask: task._id,
          relatedProject: project
        });
        await assignee.save({ validateBeforeSave: false });
      }
    }

    await logActivity({
      user: req.user._id,
      project,
      task: task._id,
      action: 'task_created',
      details: `Created task "${title}"`
    });

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color');

    res.status(201).json({ success: true, task: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const { error, member } = await checkMembership(task.project, req.user._id, req.user.role);
    if (error) return res.status(403).json({ success: false, message: error });

    const isAdmin = req.user.role === 'admin' || member?.role === 'admin';
    const isAssignee = task.assignedTo?.toString() === req.user._id.toString();

    // Members can only update status
    if (!isAdmin) {
      if (!isAssignee) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this task' });
      }
      const { status } = req.body;
      if (!status) {
        return res.status(403).json({ success: false, message: 'Members can only update task status' });
      }

      const oldStatus = task.status;
      task.status = status;
      await task.save();

      await logActivity({
        user: req.user._id,
        project: task.project,
        task: task._id,
        action: 'task_status_changed',
        details: `Changed status from "${oldStatus}" to "${status}"`,
        metadata: { oldStatus, newStatus: status }
      });

      const populated = await Task.findById(task._id)
        .populate('assignedTo', 'name email avatar')
        .populate('createdBy', 'name email avatar')
        .populate('project', 'name color');
      return res.json({ success: true, task: populated });
    }

    // Admin can update everything
    const { title, description, priority, dueDate, assignedTo, status, tags } = req.body;
    const oldStatus = task.status;

    Object.assign(task, { title, description, priority, dueDate, assignedTo, status, tags });
    await task.save();

    // Notify new assignee
    if (assignedTo && assignedTo !== task.assignedTo?.toString()) {
      const assignee = await User.findById(assignedTo);
      if (assignee) {
        const proj = await Project.findById(task.project);
        assignee.notifications.push({
          message: `You were assigned task "${task.title}" in ${proj?.name}`,
          type: 'task_assigned',
          relatedTask: task._id,
          relatedProject: task.project
        });
        await assignee.save({ validateBeforeSave: false });
      }
    }

    await logActivity({
      user: req.user._id,
      project: task.project,
      task: task._id,
      action: 'task_updated',
      details: `Updated task "${task.title}"`,
      metadata: status !== oldStatus ? { oldStatus, newStatus: status } : undefined
    });

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color');

    res.json({ success: true, task: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin)
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const { error, member } = await checkMembership(task.project, req.user._id, req.user.role);
    if (error) return res.status(403).json({ success: false, message: error });

    if (req.user.role !== 'admin' && member?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required to delete tasks' });
    }

    await Task.findByIdAndDelete(task._id);

    await logActivity({
      user: req.user._id,
      project: task.project,
      action: 'task_deleted',
      details: `Deleted task "${task.title}"`
    });

    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
exports.addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    task.comments.push({ author: req.user._id, text });
    await task.save();

    const populated = await Task.findById(task._id).populate('comments.author', 'name avatar');
    res.json({ success: true, task: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Export tasks as CSV
// @route   GET /api/tasks/export?project=
// @access  Private (Admin)
exports.exportTasks = async (req, res, next) => {
  try {
    const { project } = req.query;
    const filter = {};

    if (project) {
      filter.project = project;
    } else {
      const userProjects = await Project.find({ 'members.user': req.user._id }).select('_id');
      filter.project = { $in: userProjects.map(p => p._id) };
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('project', 'name')
      .lean();

    const csvData = tasks.map(t => ({
      Title: t.title,
      Project: t.project?.name || '',
      Status: t.status,
      Priority: t.priority,
      'Assigned To': t.assignedTo?.name || 'Unassigned',
      'Due Date': t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '',
      'Created At': new Date(t.createdAt).toLocaleDateString()
    }));

    const fields = ['Title', 'Project', 'Status', 'Priority', 'Assigned To', 'Due Date', 'Created At'];
    const csv = [fields.join(','), ...csvData.map(row => fields.map(f => `"${row[f]}"`).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=tasks-export.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};
