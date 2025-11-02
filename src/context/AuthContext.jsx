import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import authAPI from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        // Verify token is valid
        const decoded = jwtDecode(storedToken);
        const currentTime = Date.now() / 1000;

        if (decoded.exp > currentTime) {
          // Token is valid
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } else {
          // Token expired
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (error) {
        // Invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

  // Login with email and password
  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      if (response.success && response.token && response.user) {
        // Save token and user to localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setToken(response.token);
        setUser(response.user);
        return { success: true };
      }
      return { success: false, error: 'Invalid response from server' };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed. Please check your credentials.',
      };
    }
  };

  // Logout
  const logout = () => {
    authAPI.logout();
    setToken(null);
    setUser(null);
  };

  // Check if user has access to a module
  const isAllowed = (moduleName) => {
    if (!user) return false;
    // Superadmin has access to all modules
    if (user.role === 'superadmin') return true;
    // Check if module is in allowedModules array
    return user.allowedModules?.includes(moduleName) || false;
  };

  // Get token from localStorage
  const getToken = () => {
    return token || localStorage.getItem('token');
  };

  const value = {
    user,
    token: getToken(),
    loading,
    login,
    logout,
    isAllowed,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

