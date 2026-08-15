import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const baseURL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/+$/, '')}/api`;

const api = axios.create({
  baseURL,
  withCredentials: true, // Send cookies with every request
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;

