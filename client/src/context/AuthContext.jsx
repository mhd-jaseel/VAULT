import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth state by checking with the backend
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await api.get('/auth/profile');
        if (res.data.success) {
          setUser(res.data.data);
        } else {
          setUser(null);
        }
      } catch (error) {
        // Not authenticated
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthStatus();
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
          await api.post('/auth/logout').catch(() => {});
          window.location.href = '/blocked';
        }
        
        // If 401 Not Authorized, clear local user state just in case
        if (error.response?.status === 401 && user) {
          setUser(null);
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [user]);

  const googleLogin = async (credential) => {
    try {
      const res = await api.post('/auth/google-login', { credential });
      if (res.data.success) {
        const userData = res.data.data;
        setUser(userData);
        return { success: true, user: userData };
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Google Login failed.' };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await api.put('/auth/profile', profileData);
      if (res.data.success) {
        const userData = res.data.data;
        setUser({ ...user, ...userData });
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
        setUser(userData);
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
