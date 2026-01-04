import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Handle Google OAuth callback - check URL for token
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const authError = urlParams.get('error');

    if (authError) {
      toast.error('Authentication failed. Please try again.');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      setLoading(false);
      return;
    }

    if (urlToken) {
      // Store token from Google OAuth callback
      localStorage.setItem('token', urlToken);
      setToken(urlToken);
      toast.success('Login successful!');
      // Clean up URL - remove token from URL for security
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data.data.user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data.data;

      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);

      toast.success('Login successful!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      return false;
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await authAPI.register({ name, email, password });
      const { token, user } = response.data.data;

      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);

      toast.success('Registration successful!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    toast.info('Logged out successfully');
  };

  const refreshUser = async () => {
    if (token) {
      await fetchUser();
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isNoteMaker: user?.role === 'NOTEMAKER' || user?.role === 'ADMIN',
    isAdmin: user?.role === 'ADMIN',
    hasActiveSubscription: user?.hasActiveSubscription || false,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
