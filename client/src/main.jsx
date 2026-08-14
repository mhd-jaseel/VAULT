import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'
import axios from 'axios';

// Set global axios defaults for the entire application
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
axios.defaults.withCredentials = true;

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
