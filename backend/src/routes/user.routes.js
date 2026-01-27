const express = require('express');
const prisma = require('../config/database');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

// @route   GET /api/user/dashboard
// Get all dashboard data in one call
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user with profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    // Get shortlisted universities
    const shortlistedUniversities = await prisma.shortlistedUniversity.findMany({
      where: { userId },
      include: { university: true },
      orderBy: { createdAt: 'desc' },
    });

    // Get tasks
    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: [{ isCompleted: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
      take: 10,
    });

    // Get recent conversations
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    // Calculate stats
    const stats = {
      totalShortlisted: shortlistedUniversities.length,
      lockedUniversities: shortlistedUniversities.filter((u) => u.isLocked).length,
      pendingTasks: tasks.filter((t) => !t.isCompleted).length,
      completedTasks: tasks.filter((t) => t.isCompleted).length,
      profileStrength: user.profile?.overallStrength || 0,
    };

    // Get stage info
    const stages = [
      { id: 1, name: 'Building Profile', description: 'Complete your profile' },
      { id: 2, name: 'Discovering Universities', description: 'Explore and shortlist universities' },
      { id: 3, name: 'Finalizing Universities', description: 'Lock your target universities' },
      { id: 4, name: 'Preparing Applications', description: 'Work on applications' },
    ];

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          avatarUrl: user.avatarUrl,
          currentStage: user.currentStage,
          onboardingCompleted: user.onboardingCompleted,
        },
        profile: user.profile,
        shortlistedUniversities: {
          all: shortlistedUniversities,
          dream: shortlistedUniversities.filter((u) => u.category === 'dream'),
          target: shortlistedUniversities.filter((u) => u.category === 'target'),
          safe: shortlistedUniversities.filter((u) => u.category === 'safe'),
        },
        tasks,
        conversations,
        stats,
        stages,
        currentStageInfo: stages.find((s) => s.id === user.currentStage),
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data.',
    });
  }
});

// @route   PUT /api/user/stage
// Update user stage
router.put('/stage', async (req, res) => {
  try {
    const { stage } = req.body;

    if (stage < 1 || stage > 4) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stage.',
      });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { currentStage: stage },
    });

    res.json({
      success: true,
      message: 'Stage updated.',
      data: { currentStage: user.currentStage },
    });
  } catch (error) {
    console.error('Update stage error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating stage.',
    });
  }
});

module.exports = router;
