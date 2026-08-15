import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Initialize state with cached user if present to prevent race conditions during navigation
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('vault_user');
      return cached ? JSON.parse(cached) : null;
    } catch (_) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Initialize Auth state by validating with the backend
  useEffect(() => {
    let isMounted = true;

    const checkAuthStatus = async () => {
      try {
        const res = await api.get('/auth/profile');
        if (isMounted) {
          if (res.data.success && res.data.data) {
            const userData = res.data.data;
            setUser(userData);
            try {
              localStorage.setItem('vault_user', JSON.stringify(userData));
            } catch (_) {}
          } else {
            setUser(null);
            try {
              localStorage.removeItem('vault_user');
              localStorage.removeItem('vault_token');
            } catch (_) {}
          }
        }
      } catch (error) {
        if (isMounted) {
          // If network error (offline) and cached user exists, keep cached user; if 401/403, clear
          if (error.response?.status === 401 || error.response?.status === 403) {
            setUser(null);
            try {
              localStorage.removeItem('vault_user');
              localStorage.removeItem('vault_token');
            } catch (_) {}
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    checkAuthStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  // Axios response interceptor — auto-logout blocked users
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        // If backend returns 403 with blocked: true, force logout
        if (
          error.response?.status === 403 &&
          error.response?.data?.blocked === true &&
          window.location.pathname !== '/blocked'
        ) {
          setUser(null);
          try {
            localStorage.removeItem('vault_user');
            localStorage.removeItem('vault_token');
          } catch (_) {}
          await api.post('/auth/logout').catch(() => {});
          window.location.href = '/blocked';
        }
        
        // If 401 Not Authorized, clear local user state
        if (error.response?.status === 401 && user) {
          setUser(null);
          try {
            localStorage.removeItem('vault_user');
            localStorage.removeItem('vault_token');
          } catch (_) {}
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [user]);

  const googleLogin = async (credential) => {
    if (!credential) {
      return { success: false, message: 'Google credential is required.' };
    }
    try {
      const res = await api.post('/auth/google-login', { credential });
      if (res.data.success) {
        const userData = res.data.data;
        const token = res.data.token || userData.token;
        setUser(userData);
        try {
          if (token) localStorage.setItem('vault_token', token);
          localStorage.setItem('vault_user', JSON.stringify(userData));
        } catch (_) {}
        return { success: true, user: userData };
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Unable to sign in with Google. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      try {
        localStorage.removeItem('vault_user');
        localStorage.removeItem('vault_token');
      } catch (_) {}
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await api.put('/auth/profile', profileData);
      if (res.data.success) {
        const userData = res.data.data;
        const updated = { ...user, ...userData };
        setUser(updated);
        try {
          localStorage.setItem('vault_user', JSON.stringify(updated));
        } catch (_) {}
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Profile update failed.',
      };
    }
  };

  const adminLogin = async (email, password) => {
    try {
      const res = await api.post('/auth/admin/login', { email, password });
      if (res.data.success) {
        const userData = res.data.data;
        const token = res.data.token || userData.token;
        setUser(userData);
        try {
          if (token) localStorage.setItem('vault_token', token);
          localStorage.setItem('vault_user', JSON.stringify(userData));
        } catch (_) {}
        return { success: true, user: userData };
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Admin login failed.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        googleLogin,
        logout,
        updateProfile,
        adminLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
