const express = require('express');
const aiController = require('../controllers/ai.controller');
const { authMiddleware, requireOnboarding } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// @route   POST /api/ai/onboarding
// Onboarding chat doesn't require onboarding to be completed
router.post('/onboarding', aiController.onboardingChat);

// @route   POST /api/ai/chat
// Main AI chat requires onboarding
router.post('/chat', requireOnboarding, aiController.chat);

// @route   GET /api/ai/conversations
router.get('/conversations', requireOnboarding, aiController.getConversations);

// @route   GET /api/ai/conversations/:id
router.get('/conversations/:id', requireOnboarding, aiController.getConversation);

module.exports = router;
