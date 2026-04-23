import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { UserRoutes } from '../../../backend/config/resourceNames';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);

  const login = (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
    setUser(null);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const isAuthenticated = !!token;

  const refreshProfile = useCallback(async (opts = {}) => {
    if (!token) return;
    try {
      const { data } = await api.get(UserRoutes.ME);
      setUser((prev) => ({
        userId: data.id,
        username: data.username,
        profile_picture_url: data.profile_picture_url || null,
        avatarBust: opts.avatarBust ? Date.now() : prev?.avatarBust,
      }));
    } catch {
      setUser((prev) => {
        if (prev?.username) return prev;
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return { userId: payload.userId, username: payload.username, profile_picture_url: null };
        } catch {
          return null;
        }
      });
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    refreshProfile();
  }, [token, refreshProfile]);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
