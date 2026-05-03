import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tf_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  const setAuth = (userData, token) => {
    setUser(userData);
    localStorage.setItem('tf_user', JSON.stringify(userData));
    if (token) localStorage.setItem('tf_token', token);
  };

  const clearAuth = () => {
    setUser(null);
    localStorage.removeItem('tf_user');
    localStorage.removeItem('tf_token');
  };

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('tf_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await authAPI.getMe();
      setUser(data.user);
      localStorage.setItem('tf_user', JSON.stringify(data.user));
    } catch {
      clearAuth();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (credentials) => {
    const { data } = await authAPI.login(credentials);
    setAuth(data.user, data.token);
    return data;
  };

  const register = async (userData) => {
    const { data } = await authAPI.register(userData);
    setAuth(data.user, data.token);
    return data;
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch {}
    clearAuth();
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('tf_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
