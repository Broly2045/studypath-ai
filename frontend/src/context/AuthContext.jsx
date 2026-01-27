import { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔍 Check auth on first load ONLY
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    try {
      const response = await authAPI.getMe();
      setUser(response.data.data.user);
    } catch {
      // Not authenticated (expected after logout)
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // 🔐 Login (backend sets cookie)
  const login = async (email, password) => {
    await authAPI.login({ email, password });
    await checkAuth(); // re-sync user
  };

  // 📝 Signup (no auto-login)
  const signup = async (data) => {
    await authAPI.signup(data);
  };

  // 🚪 REAL LOGOUT
  const logout = async () => {
    try {
      await authAPI.logout(); // clears cookie on backend
    } catch {
      // ignore
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
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

