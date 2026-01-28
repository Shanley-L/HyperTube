import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext()

export const AuthProvider = ({children}) => {
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || null;
  });

  const [user, setUser] = useState(null);

  const login = (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
  };
  
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const isAuthenticated = !!token;

  useEffect(() => {
    if (token && !user) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser({ userId: payload.userId, username: payload.username });
    }
  }, [token, user]);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );

}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}