import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api', // '/api' works out-of-the-box on both local and Railway single-deploy
  withCredentials: true, // Send cookies (refresh token)
});

// Interceptor to add access token to headers
api.interceptors.request.use(
  (config) => {
    // If Authorization header is already explicitly provided on the request config, don't overwrite it
    if (config.headers?.Authorization) {
      return config;
    }

    // If calling institution endpoints, prioritize institutionToken
    if (config.url?.startsWith('/institutions')) {
      const instToken = localStorage.getItem('institutionToken');
      if (instToken) {
        config.headers.Authorization = `Bearer ${instToken}`;
        return config;
      }
    }

    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle token expiration and auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loops
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login' && originalRequest.url !== '/auth/refresh-token') {
      originalRequest._retry = true;

      try {
        // Request a new access token
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear token and redirect to login
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
