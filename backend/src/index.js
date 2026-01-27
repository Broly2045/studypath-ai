require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const cookieParser = require('cookie-parser');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const profileRoutes = require('./routes/profile.routes');
const aiRoutes = require('./routes/ai.routes');
const universityRoutes = require('./routes/university.routes');
const taskRoutes = require('./routes/task.routes');

// Passport config
require('./config/passport');

const app = express();

/**
 * ======================
 * MIDDLEWARE
 * ======================
 */

// ✅ CORS (must allow credentials)
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // e.g. https://studypath-ai.vercel.app
    credentials: true,
  })
);

// Parse JSON bodies
app.use(express.json());

// ✅ Parse cookies (CRITICAL for auth)
app.use(cookieParser());

// Initialize passport
app.use(passport.initialize());

/**
 * ======================
 * ROUTES
 * ======================
 */

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'StudyPath AI Backend is running',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/tasks', taskRoutes);

/**
 * ======================
 * ERROR HANDLING
 * ======================
 */

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

/**
 * ======================
 * SERVER
 * ======================
 */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔐 Cookie-based auth enabled`);
  console.log(`📍 Health check: /api/health`);
});

module.exports = app;
