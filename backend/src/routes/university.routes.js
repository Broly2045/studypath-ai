const express = require('express');
const universityController = require('../controllers/university.controller');
const { authMiddleware, requireOnboarding } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// @route   GET /api/universities
router.get('/', universityController.getUniversities);

// @route   GET /api/universities/recommendations
router.get('/recommendations', requireOnboarding, universityController.getRecommendations);

// @route   GET /api/universities/shortlist
router.get('/shortlist', requireOnboarding, universityController.getShortlist);

// @route   POST /api/universities/shortlist
router.post('/shortlist', requireOnboarding, universityController.addToShortlist);

// @route   DELETE /api/universities/shortlist/:id
router.delete('/shortlist/:id', requireOnboarding, universityController.removeFromShortlist);

// @route   POST /api/universities/shortlist/:id/lock
router.post('/shortlist/:id/lock', requireOnboarding, universityController.lockUniversity);

// @route   POST /api/universities/shortlist/:id/unlock
router.post('/shortlist/:id/unlock', requireOnboarding, universityController.unlockUniversity);

module.exports = router;
