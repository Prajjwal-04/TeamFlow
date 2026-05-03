const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');
const { logActivity } = require('../utils/activity');

// @desc    Get all projects for current user
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({
      'members.user': req.user._id
    })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar role')
      .sort('-createdAt');

    res.json({ success: true, count: projects.length, projects });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar role');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check membership
    const isMember = project.members.some(m => m.user?._id?.toString() === req.user._id.toString());
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private (Admin)
exports.createProject = async (req, res, next) => {
  try {
    const { name, description, color, dueDate, memberEmails } = req.body;

    const project = await Project.create({
      name,
      description,
      color: color || '#6366f1',
      dueDate,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }]
    });

    // Add members by email
    if (memberEmails?.length) {
      for (const email of memberEmails) {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (user && user._id.toString() !== req.user._id.toString()) {
          project.members.push({ user: user._id, role: 'member' });
          // Notify user
          user.notifications.push({
            message: `You've been added to project "${name}"`,
            type: 'project_added',
            relatedProject: project._id
          });
          await user.save({ validateBeforeSave: false });
        }
      }
      await project.save();
    }

    await logActivity({
      user: req.user._id,
      project: project._id,
      action: 'project_created',
      details: `Created project "${name}"`
    });

    const populated = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar role');

    res.status(201).json({ success: true, project: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin)
exports.updateProject = async (req, res, next) => {
  try {
    const { name, description, color, dueDate, status } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    // Check admin
    const memberEntry = project.members.find(m => m.user?.toString() === req.user._id.toString());
    if (!memberEntry || memberEntry.role !== 'admin') {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }
    }

    Object.assign(project, { name, description, color, dueDate, status });
    await project.save();

    await logActivity({
      user: req.user._id,
      project: project._id,
      action: 'project_updated',
      details: `Updated project "${project.name}"`
    });

    const populated = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar role');

    res.json({ success: true, project: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin)
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only project owner can delete' });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private (Admin)
exports.addMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'User with this email not found' });

    const alreadyMember = project.members.some(m => m.user?.toString() === user._id.toString());
    if (alreadyMember) return res.status(400).json({ success: false, message: 'User is already a member' });

    project.members.push({ user: user._id, role: role || 'member' });
    await project.save();

    user.notifications.push({
      message: `You've been added to project "${project.name}"`,
      type: 'project_added',
      relatedProject: project._id
    });
    await user.save({ validateBeforeSave: false });

    await logActivity({
      user: req.user._id,
      project: project._id,
      action: 'member_added',
      details: `Added ${user.name} to project`
    });

    const populated = await Project.findById(project._id)
      .populate('members.user', 'name email avatar role');

    res.json({ success: true, project: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private (Admin)
exports.removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    if (project.owner.toString() === req.params.userId) {
      return res.status(400).json({ success: false, message: 'Cannot remove project owner' });
    }

    project.members = project.members.filter(m => m.user?.toString() !== req.params.userId);
    await project.save();

    await logActivity({
      user: req.user._id,
      project: project._id,
      action: 'member_removed',
      details: `Removed member from project`
    });

    res.json({ success: true, message: 'Member removed' });
  } catch (err) {
    next(err);
  }
};
