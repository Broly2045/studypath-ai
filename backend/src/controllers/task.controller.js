const prisma = require('../config/database');

// @desc    Get all tasks
// @route   GET /api/tasks
const getTasks = async (req, res) => {
  try {
    const { status, category, priority } = req.query;

    const where = { userId: req.user.id };
    
    if (status === 'completed') where.isCompleted = true;
    else if (status === 'pending') where.isCompleted = false;
    
    if (category) where.category = category;
    if (priority) where.priority = priority;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { isCompleted: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Get counts
    const counts = {
      total: tasks.length,
      completed: tasks.filter((t) => t.isCompleted).length,
      pending: tasks.filter((t) => !t.isCompleted).length,
      high: tasks.filter((t) => !t.isCompleted && t.priority === 'high').length,
    };

    res.json({
      success: true,
      data: { tasks, counts },
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks.',
    });
  }
};

// @desc    Create task
// @route   POST /api/tasks
const createTask = async (req, res) => {
  try {
    const { title, description, category, priority, dueDate, universityId } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required.',
      });
    }

    const task = await prisma.task.create({
      data: {
        userId: req.user.id,
        title,
        description,
        category: category || 'other',
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        universityId,
        isAiGenerated: false,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Task created.',
      data: { task },
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating task.',
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const { title, description, category, priority, dueDate } = req.body;

    const task = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        title: title || task.title,
        description: description !== undefined ? description : task.description,
        category: category || task.category,
        priority: priority || task.priority,
        dueDate: dueDate ? new Date(dueDate) : task.dueDate,
      },
    });

    res.json({
      success: true,
      message: 'Task updated.',
      data: { task: updated },
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task.',
    });
  }
};

// @desc    Toggle task completion
// @route   POST /api/tasks/:id/toggle
const toggleTask = async (req, res) => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        isCompleted: !task.isCompleted,
        completedAt: !task.isCompleted ? new Date() : null,
      },
    });

    res.json({
      success: true,
      message: updated.isCompleted ? 'Task completed!' : 'Task marked as pending.',
      data: { task: updated },
    });
  } catch (error) {
    console.error('Toggle task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task.',
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
    }

    await prisma.task.delete({ where: { id: req.params.id } });

    res.json({
      success: true,
      message: 'Task deleted.',
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting task.',
    });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  toggleTask,
  deleteTask,
};
