import React, { createContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

// Configure default base URL for API
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
axios.defaults.baseURL = API_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const logoutRef = useRef(null);

  // Initialize Auth state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('vault_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      // Set default axios authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
    }
    setLoading(false);
  }, []);

  // Axios response interceptor — auto-logout blocked users
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // If backend returns 403 with blocked: true, force logout
        if (
          error.response?.status === 403 &&
          error.response?.data?.blocked === true &&
          window.location.pathname !== '/blocked'
        ) {
          // Clear auth state
          setUser(null);
          localStorage.removeItem('vault_user');
          delete axios.defaults.headers.common['Authorization'];
          // Redirect to blocked page
          window.location.href = '/blocked';
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post('/auth/login', { email, password });
      if (res.data.success) {
        const userData = res.data.data;
        setUser(userData);
        localStorage.setItem('vault_user', JSON.stringify(userData));
        axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
        return { success: true, user: userData };
      }
    } catch (error) {
      // Pass blocked flag up so login page can redirect
      if (error.response?.data?.blocked) {
        return {
          success: false,
          blocked: true,
          message: error.response.data.message,
        };
      }
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please check your credentials.',
      };
    }
  };

  const register = async (name, email, password, phone) => {
    try {
      const res = await axios.post('/auth/register', { name, email, password, phone });
      if (res.data.success) {
        const userData = res.data.data;
        setUser(userData);
        localStorage.setItem('vault_user', JSON.stringify(userData));
        axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed.',
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vault_user');
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await axios.put('/auth/profile', profileData);
      if (res.data.success) {
        const userData = res.data.data;
        // Keep token from existing state if not returned
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
        localStorage.setItem('vault_user', JSON.stringify(updatedUser));
        axios.defaults.headers.common['Authorization'] = `Bearer ${updatedUser.token}`;
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Profile update failed.',
      };
    }
  };

  const forgotPassword = async (email, newPassword) => {
    try {
      const res = await axios.post('/auth/forgot-password', { email, newPassword });
      if (res.data.success) {
        return { success: true, message: res.data.message };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Reset password failed.',
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        forgotPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
