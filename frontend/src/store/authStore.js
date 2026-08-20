import { create } from 'zustand';
import api from '../api/axiosInstance';

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken') || null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  loading: false,
  error: null,

  setAccessToken: (token) => {
    if (token) {
      localStorage.setItem('accessToken', token);
      set({ accessToken: token, isAuthenticated: true });
    } else {
      localStorage.removeItem('accessToken');
      set({ accessToken: null, isAuthenticated: false });
    }
  },

  setUser: (user) => set({ user }),

  register: async (name, email, password, role) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/register', { name, email, password, role });
      const { accessToken, user } = response.data.data;
      get().setAccessToken(accessToken);
      set({ user, loading: false });
      return { success: true, user };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user } = response.data.data;
      get().setAccessToken(accessToken);
      set({ user, loading: false });
      return { success: true, user };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout API call failed:', err);
    } finally {
      get().setAccessToken(null);
      set({ user: null, isAuthenticated: false });
      // Redirect to landing page — user must log in again to access the app
      window.location.href = '/';
    }
  },

  checkAuth: async () => {
    const token = get().accessToken;
    if (!token) return;
    set({ loading: true });
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data.data.user, loading: false });
    } catch (err) {
      // Access token might be expired, let's try to refresh it
      try {
        const refreshResponse = await api.post('/auth/refresh-token');
        const { accessToken, user } = refreshResponse.data.data;
        get().setAccessToken(accessToken);
        set({ user, loading: false });
      } catch (refreshErr) {
        // Refresh token also expired or invalid
        get().setAccessToken(null);
        set({ user: null, isAuthenticated: false, loading: false });
      }
    }
  },

  graduate: async () => {
    set({ loading: true });
    try {
      const response = await api.post('/users/graduate');
      const { user } = response.data.data;
      set({ user, loading: false });
      return { success: true, user };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Graduation update failed';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  requestRecruitRights: async () => {
    set({ loading: true });
    try {
      const response = await api.post('/users/request-recruit');
      const { recruitRights } = response.data.data;
      set((state) => ({
        user: { ...state.user, recruitRights },
        loading: false
      }));
      return { success: true };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Request failed';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  }
}));
