const express = require('express');
const router = express.Router();
const {
  getProjects, getProject, createProject, updateProject,
  deleteProject, addMember, removeMember
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const { projectRules, validate } = require('../middleware/validators');
const { body } = require('express-validator');

router.route('/')
  .get(protect, getProjects)
  .post(protect, projectRules, validate, createProject);

router.route('/:id')
  .get(protect, getProject)
  .put(protect, projectRules, validate, updateProject)
  .delete(protect, deleteProject);

router.post('/:id/members', protect, [
  body('email').isEmail().withMessage('Valid email required'),
  body('role').optional().isIn(['admin', 'member'])
], validate, addMember);

router.delete('/:id/members/:userId', protect, removeMember);

module.exports = router;
