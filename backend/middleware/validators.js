const { body, param, query, validationResult } = require('express-validator');

// Helper to run validation and return errors
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

// Auth validators
exports.registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'member']).withMessage('Role must be admin or member')
];

exports.loginRules = [
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

// Project validators
exports.projectRules = [
  body('name').trim().notEmpty().withMessage('Project name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('description').optional().trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format')
];

// Task validators
exports.taskRules = [
  body('title').trim().notEmpty().withMessage('Task title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('description').optional().trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('project').notEmpty().withMessage('Project ID is required').isMongoId().withMessage('Invalid project ID'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('status').optional().isIn(['todo', 'in_progress', 'done']).withMessage('Invalid status'),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format').toDate(),
  body('assignedTo').optional().isMongoId().withMessage('Invalid user ID')
];

exports.statusUpdateRules = [
  body('status').isIn(['todo', 'in_progress', 'done']).withMessage('Invalid status value')
];
