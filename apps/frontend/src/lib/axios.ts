import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only logout on 401 specifically related to authentication
    // Ignore 404s and other errors
    if (error.response?.status === 401 && error.config?.url) {
      // Only logout if it's an authentication endpoint or the token is actually invalid
      // Don't logout for simple 404s or other HTTP errors
      const isAuthEndpoint = error.config.url.includes('/auth/') || error.config.url.includes('/profile');
      const hasAuthHeader = error.config.headers?.Authorization;

      // Only trigger logout if:
      // 1. It's an auth-related endpoint, OR
      // 2. We sent an auth token and it was rejected (invalid/expired token)
      if (isAuthEndpoint || (hasAuthHeader && error.response?.data?.message?.includes('token'))) {
        // Check if we're already on the login page to avoid redirect loops
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          console.log('🔒 Session expired or unauthorized - redirecting to login');
          localStorage.removeItem('auth-token');
          localStorage.removeItem('auth-user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
