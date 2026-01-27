const express = require('express');
const profileController = require('../controllers/profile.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// @route   GET /api/profile
router.get('/', profileController.getProfile);

// @route   PUT /api/profile
router.put('/', profileController.updateProfile);

// @route   POST /api/profile/complete-onboarding
router.post('/complete-onboarding', profileController.completeOnboarding);

// @route   GET /api/profile/strength
router.get('/strength', profileController.getProfileStrength);

module.exports = router;
