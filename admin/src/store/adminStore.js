import { create } from 'zustand';
import api from '../api/axiosInstance';

export const useAdminStore = create((set, get) => ({
  admin: null,
  loading: false,
  initialized: false,

  // Login — only accepts role:admin
  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, accessToken } = res.data.data;

      if (user.role !== 'admin') {
        return { success: false, error: 'Access denied. Admin accounts only.' };
      }

      localStorage.setItem('admin_access_token', accessToken);
      set({ admin: user, loading: false, initialized: true });
      return { success: true };
    } catch (err) {
      set({ loading: false });
      return { success: false, error: err.response?.data?.message || 'Login failed.' };
    }
  },

  // Logout — clear only admin token
  logout: async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('admin_access_token');
    set({ admin: null, initialized: true });
  },

  // Restore session on app load
  initialize: async () => {
    const token = localStorage.getItem('admin_access_token');
    if (!token) { set({ initialized: true }); return; }
    try {
      const res = await api.get('/auth/me');
      const user = res.data.data.user;
      if (user.role !== 'admin') {
        localStorage.removeItem('admin_access_token');
        set({ admin: null, initialized: true });
        return;
      }
      set({ admin: user, initialized: true });
    } catch {
      localStorage.removeItem('admin_access_token');
      set({ admin: null, initialized: true });
    }
  },
}));
