import { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔍 Check auth on app load
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data.data.user);
    } catch (error) {
      // Not authenticated (401 is expected)
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // 🔐 Login (cookie is set by backend)
  const login = async (email, password) => {
    await authAPI.login({ email, password });
    await checkAuth(); // refresh user from backend
  };

  // 📝 Signup (NO auto-login unless backend supports it)
  const signup = async (data) => {
    await authAPI.signup(data);
  };

  // 🚪 Logout (requires backend endpoint ideally)
  const logout = async () => {
    try {
      await authAPI.logout?.(); // optional if you add backend logout
    } catch {
      // ignore
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    refreshUser: checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
