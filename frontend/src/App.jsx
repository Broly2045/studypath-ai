import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import AICounselor from './pages/AICounselor';
import Universities from './pages/Universities';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';
import Preparation from './pages/Preparation'; // ✅ STAGE 4

/* -------------------- ROUTE GUARDS -------------------- */

// 🔐 Protected Route (auth + onboarding)
const ProtectedRoute = ({ children, requireOnboarding = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireOnboarding && !user.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

// 🧭 Stage-based guard (for Preparation / future stages)
const StageRoute = ({ minStage, children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  if (user.currentStage < minStage) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// 🌐 Public Route
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    if (!user.onboardingCompleted) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

/* -------------------- ROUTES -------------------- */

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

      {/* Onboarding */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />

      {/* Core App */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requireOnboarding>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/counselor"
        element={
          <ProtectedRoute requireOnboarding>
            <AICounselor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/universities"
        element={
          <ProtectedRoute requireOnboarding>
            <Universities />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute requireOnboarding>
            <Tasks />
          </ProtectedRoute>
        }
      />

      {/* ✅ STAGE 4 — PREPARATION (Unlocked after university lock) */}
      <Route
        path="/preparation"
        element={
          <StageRoute minStage={3}>
            <Preparation />
          </StageRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute requireOnboarding>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/* -------------------- APP ROOT -------------------- */

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen mesh-bg noise-overlay">
          <AppRoutes />
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
