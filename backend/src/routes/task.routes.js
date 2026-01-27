const express = require('express');
const taskController = require('../controllers/task.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// @route   GET /api/tasks
router.get('/', taskController.getTasks);

// @route   POST /api/tasks
router.post('/', taskController.createTask);

// @route   PUT /api/tasks/:id
router.put('/:id', taskController.updateTask);

// @route   POST /api/tasks/:id/toggle
router.post('/:id/toggle', taskController.toggleTask);

// @route   DELETE /api/tasks/:id
router.delete('/:id', taskController.deleteTask);

module.exports = router;
