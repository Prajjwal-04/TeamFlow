const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  // Check Authorization header first, then cookie
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token is invalid or expired' });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized for this action`
      });
    }
    next();
  };
};

// Check if user is project admin or global admin
exports.projectAdmin = async (req, res, next) => {
  if (req.user.role === 'admin') return next();

  const Project = require('../models/Project');
  const projectId = req.params.projectId || req.body.project;

  if (!projectId) {
    return res.status(400).json({ success: false, message: 'Project ID required' });
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  const member = project.members.find(m => m.user?.toString() === req.user._id.toString());
  if (!member || member.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Project admin access required' });
  }

  req.project = project;
  next();
};
