import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'operator' | 'customer';
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isSessionLocked: boolean;
  login: (username: string, password: string) => Promise<void>;
  quickRelogin: (password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  unlockSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

// Configure axios defaults
axios.defaults.baseURL = API_URL;

// Add token to requests if it exists
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 responses
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionLocked, setIsSessionLocked] = useState(false);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);

  // Reset activity timer
  const resetActivityTimer = () => {
    setLastActivity(Date.now());
    localStorage.setItem('lastActivity', Date.now().toString());
  };

  // Track user activity
  useEffect(() => {
    if (!user || isSessionLocked) return;

    const activities = ['mousedown', 'keypress', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      resetActivityTimer();
    };

    activities.forEach(activity => {
      window.addEventListener(activity, handleActivity);
    });

    return () => {
      activities.forEach(activity => {
        window.removeEventListener(activity, handleActivity);
      });
    };
  }, [user, isSessionLocked]);

  // Check for inactivity
  useEffect(() => {
    if (!user || isSessionLocked) return;

    const checkInactivity = () => {
      const savedLastActivity = localStorage.getItem('lastActivity');
      const lastActivityTime = savedLastActivity ? parseInt(savedLastActivity) : Date.now();
      const timeSinceLastActivity = Date.now() - lastActivityTime;

      if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
        // Lock the session instead of logging out
        setIsSessionLocked(true);
        toast.info('Session locked due to inactivity. Please re-enter your password.');
      }
    };

    // Check immediately
    checkInactivity();

    // Then check every 30 seconds
    const timer = setInterval(checkInactivity, 30000);
    setInactivityTimer(timer);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [user, isSessionLocked]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        
        // Verify token is still valid
        try {
          const response = await axios.get('/auth/me');
          setUser(response.data.data);
          localStorage.setItem('user', JSON.stringify(response.data.data));
        } catch (error) {
          // Token is invalid
          logout();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post('/auth/login', {
        username,
        password,
      });

      const { user, token } = response.data.data;

      setUser(user);
      setToken(token);

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('savedUsername', username); // Save username for quick re-login
      localStorage.setItem('lastActivity', Date.now().toString());

      setIsSessionLocked(false);
      toast.success('Login successful!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const quickRelogin = async (password: string) => {
    try {
      const savedUsername = localStorage.getItem('savedUsername');
      if (!savedUsername) {
        throw new Error('Username not found. Please login again.');
      }

      const response = await axios.post('/auth/login', {
        username: savedUsername,
        password,
      });

      const { user, token } = response.data.data;

      setUser(user);
      setToken(token);

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('lastActivity', Date.now().toString());

      setIsSessionLocked(false);
      toast.success('Session unlocked successfully!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Authentication failed';
      toast.error(message);
      throw error;
    }
  };

  const unlockSession = () => {
    setIsSessionLocked(false);
    resetActivityTimer();
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsSessionLocked(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    // Don't remove savedUsername - keep it for quick re-login
    if (inactivityTimer) {
      clearInterval(inactivityTimer);
    }
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isSessionLocked,
        login,
        quickRelogin,
        logout,
        checkAuth,
        unlockSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
