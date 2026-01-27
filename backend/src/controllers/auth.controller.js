const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/signup
const signup = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered.',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
      },
    });

    // Create empty profile for new user
    await prisma.profile.create({
      data: { userId: user.id },
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          onboardingCompleted: user.onboardingCompleted,
          currentStage: user.currentStage,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating account.',
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check if user has password (not Google-only user)
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'Please login with Google.',
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          onboardingCompleted: user.onboardingCompleted,
          currentStage: user.currentStage,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in.',
    });
  }
};

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
const googleCallback = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=google_auth_failed`
      );
    }

    const token = generateToken(user.id);

    // ✅ Set JWT in secure cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,        // REQUIRED for HTTPS (Vercel)
      sameSite: 'none',    // REQUIRED for cross-domain
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // ✅ Redirect to REAL frontend route
    return res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  } catch (error) {
    console.error('Google callback error:', error);
    return res.redirect(
      `${process.env.FRONTEND_URL}/login?error=server_error`
    );
  }
};


// @desc    Get current user
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { profile: true },
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          onboardingCompleted: user.onboardingCompleted,
          currentStage: user.currentStage,
          profile: user.profile,
        },
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data.',
    });
  }
};

// @desc    Forgot password (simplified - just validates email exists)
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If an account exists with this email, you will receive password reset instructions.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing request.',
    });
  }
};

module.exports = {
  signup,
  login,
  googleCallback,
  getMe,
  forgotPassword,
};
