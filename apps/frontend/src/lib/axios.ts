import axios from 'axios';

// In produzione con nginx, usa il path relativo /api
// In sviluppo locale senza nginx, usa http://localhost:3001/api
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

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
    if (error.response?.status === 401) {
      // Don't redirect on login endpoint
      const isLoginEndpoint = error.config?.url?.includes('/auth/login');

      if (!isLoginEndpoint) {
        const errorMessage = error.response.data?.message?.toLowerCase() || '';
        const isTokenError =
          errorMessage.includes('unauthorized') ||
          errorMessage.includes('invalid token') ||
          errorMessage.includes('token expired') ||
          errorMessage.includes('jwt');

        // Only redirect if it's a token-related error and we have a token stored
        const hasToken = localStorage.getItem('auth-token');

        if (isTokenError && hasToken) {
          // Check if we're already on the login page to avoid redirect loops
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            console.log('🔒 Session expired - redirecting to login');

            // Clear auth data from storage
            localStorage.removeItem('auth-token');
            localStorage.removeItem('auth-user');
            localStorage.removeItem('auth-storage');

            // Redirect to login
            window.location.href = '/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
