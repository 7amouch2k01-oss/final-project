import axios from 'axios';
import { getApiBaseUrl } from '../native/capacitorBridge';

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

// Interceptor to add access token to headers
api.interceptors.request.use(
  (config) => {
    // If Authorization header is already explicitly provided on the request config, don't overwrite it
    if (config.headers?.Authorization) {
      return config;
    }

    const instToken = localStorage.getItem('institutionToken');
    const userToken = localStorage.getItem('accessToken');

    // If calling institution endpoints, prioritize institutionToken
    if (config.url?.startsWith('/institutions')) {
      if (instToken) {
        config.headers.Authorization = `Bearer ${instToken}`;
        return config;
      }
    }

    // Otherwise, if the user is currently on an institution portal route or only has institutionToken
    if (window.location.pathname.startsWith('/institution') && instToken && !userToken) {
      config.headers.Authorization = `Bearer ${instToken}`;
      return config;
    }

    // Default to user accessToken
    if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
    } else if (instToken) {
      config.headers.Authorization = `Bearer ${instToken}`;
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

    // Do NOT attempt user token refresh on institution routes or auth login/register
    const isInstEndpoint = originalRequest?.url?.startsWith('/institutions');
    const isAuthEndpoint = originalRequest?.url?.startsWith('/auth');
    const isInstPage = window.location.pathname.startsWith('/institution');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint && !isInstEndpoint && !isInstPage) {
      originalRequest._retry = true;

      try {
        // Request a new access token for normal user
        const response = await axios.post(
          `${getApiBaseUrl()}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If user refresh fails, clear token only and redirect to user login
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // If institution session expires (401 on institution page or endpoint)
    if (error.response?.status === 401 && (isInstEndpoint || isInstPage)) {
      // Clear expired institution token
      localStorage.removeItem('institutionToken');
      if (window.location.pathname === '/institution/dashboard') {
        window.location.href = '/institution/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
