// routes/tasks.js
const express = require('express');
const router = express.Router();
const { getTasks, getTask, createTask, updateTask, deleteTask, addComment, exportTasks } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { taskRules, validate } = require('../middleware/validators');
const { body } = require('express-validator');

router.get('/export', protect, exportTasks);
router.route('/').get(protect, getTasks).post(protect, taskRules, validate, createTask);
router.route('/:id').get(protect, getTask).put(protect, updateTask).delete(protect, deleteTask);
router.post('/:id/comments', protect, [body('text').notEmpty().trim()], validate, addComment);

module.exports = router;
