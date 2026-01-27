const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

// Generate JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ==========================
// SIGNUP
// ==========================
const signup = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
      },
    });

    await prisma.profile.create({
      data: { userId: user.id },
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating account.',
    });
  }
};

// ==========================
// LOGIN (🔥 FIXED)
// ==========================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user.id);

    // ✅ SET COOKIE (THIS IS THE MISSING PIECE)
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,        // required for HTTPS (Vercel)
      sameSite: 'none',    // required for cross-site cookies
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          onboardingCompleted: user.onboardingCompleted,
          currentStage: user.currentStage,
        },
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

// ==========================
// GOOGLE CALLBACK (already correct)
// ==========================
const googleCallback = async (req, res) => {
  try {
    const user = req.user;
    const token = generateToken(user.id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  } catch (error) {
    console.error('Google callback error:', error);
    return res.redirect(
      `${process.env.FRONTEND_URL}/login?error=auth_failed`
    );
  }
};

// ==========================
// GET CURRENT USER
// ==========================
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { profile: true },
    });

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user.',
    });
  }
};

module.exports = {
  signup,
  login,
  googleCallback,
  getMe,
};
