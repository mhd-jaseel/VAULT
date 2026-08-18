import axios from 'axios';
import { getServerBaseUrl } from '../utils/imageHelper';

const baseURL = `${getServerBaseUrl()}/api`;

const api = axios.create({
  baseURL,
  withCredentials: true, // Send cookies with every request
});

// Request interceptor — attach Bearer token fallback for mobile Safari ITP
api.interceptors.request.use(
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

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;

