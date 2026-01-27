const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

const authMiddleware = async (req, res, next) => {
  try {
    // ✅ Read token from HTTP-only cookie
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated.',
      });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { profile: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};

// Require onboarding completion
const requireOnboarding = (req, res, next) => {
  if (!req.user.onboardingCompleted) {
    return res.status(403).json({
      success: false,
      message: 'Please complete onboarding first.',
      code: 'ONBOARDING_REQUIRED',
    });
  }
  next();
};

// Require minimum stage
const requireStage = (minStage) => {
  return (req, res, next) => {
    if (req.user.currentStage < minStage) {
      return res.status(403).json({
        success: false,
        message: `This feature requires stage ${minStage} or higher.`,
        code: 'STAGE_REQUIRED',
        requiredStage: minStage,
        currentStage: req.user.currentStage,
      });
    }
    next();
  };
};

module.exports = {
  authMiddleware,
  requireOnboarding,
  requireStage,
};
