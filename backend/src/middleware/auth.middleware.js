const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
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
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Authentication error.',
    });
  }
};

// Middleware to check if onboarding is completed
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

// Middleware to check minimum stage requirement
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

module.exports = { authMiddleware, requireOnboarding, requireStage };
