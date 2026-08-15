import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'
import axios from 'axios';

// Set global axios defaults for the entire application
const getInitialApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && (window.location.hostname.includes('vercel.app') || (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'))) {
    return 'https://vault-co-api.onrender.com/api';
  }
  return 'http://localhost:5000/api';
};
const rawApiUrl = getInitialApiUrl();
axios.defaults.baseURL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/+$/, '')}/api`;
axios.defaults.withCredentials = true;

// Centralized Axios Request Interceptor — attach Authorization header fallback
axios.interceptors.request.use(
  (config) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('vault_token') : null;
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (_) {}
    return config;
  },
  (error) => Promise.reject(error)
);

// Centralized Axios Response Interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Suppress unhandled network rejections from crashing UI
    return Promise.reject(error);
  }
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy_client_id'}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
