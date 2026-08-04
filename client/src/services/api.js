import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Attach JWT token from localStorage on every request
api.interceptors.request.use((config) => {
  const storedUser = localStorage.getItem('vault_user');
  if (storedUser) {
    const { token } = JSON.parse(storedUser);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
