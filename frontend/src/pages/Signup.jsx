import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

const Signup = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const passwordRequirements = [
    { met: password.length >= 6, text: 'At least 6 characters' },
    { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
    { met: /[0-9]/.test(password), text: 'One number' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // ✅ Create account (NO auto-login)
      await authAPI.signup({
        fullName,
        email,
        password,
      });

      toast.success('Account created successfully! Please log in.');

      // ✅ Redirect to login (clean, predictable)
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    // Google OAuth handles login + cookie on backend
    window.location.href = authAPI.googleAuth();
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL – VISUAL */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-accent-900/30 to-dark-950 p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-lg"
        >
          <h2 className="text-4xl font-bold mb-6">
            Start Your <span className="gradient-text">Global Education</span> Journey
          </h2>
          <p className="text-dark-400 mb-12">
            Join thousands of students using AI to find the right university.
          </p>

          <div className="space-y-4">
            {[
              'Personalized university recommendations',
              '24/7 AI counselor support',
              'Smart application tracking',
              'Step-by-step guidance',
            ].map((benefit, i) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-6 h-6 bg-accent-500/20 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-accent-400" />
                </div>
                <span className="text-dark-300">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* RIGHT PANEL – FORM */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              StudyPath<span className="text-primary-400">.ai</span>
            </span>
          </Link>

          <h1 className="text-3xl font-bold mb-2">Create your account</h1>
          <p className="text-dark-400 mb-8">
            Start planning your study abroad journey
          </p>

          {/* Google Signup */}
          <button
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white text-gray-800 font-medium rounded-xl hover:bg-gray-100 transition-colors mb-6"
          >
            Sign up with Google
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-dark-700" />
            <span className="text-dark-500 text-sm">or</span>
            <div className="flex-1 h-px bg-dark-700" />
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                required
              />

              {password && (
                <div className="mt-3 space-y-2">
                  {passwordRequirements.map((req) => (
                    <div
                      key={req.text}
                      className={`flex items-center gap-2 text-sm ${
                        req.met ? 'text-accent-400' : 'text-dark-500'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      {req.text}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Create Account <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-dark-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary-400 hover:text-primary-300 font-medium"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
