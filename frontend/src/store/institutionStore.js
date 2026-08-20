import { create } from 'zustand';
import api from '../api/axiosInstance';

export const useInstitutionStore = create((set, get) => ({
  institution: null,
  stats: null,
  applicants: [],
  listings: { universities: [], stages: [], jobs: [] },
  token: localStorage.getItem('institutionToken') || null,
  isAuthenticated: !!localStorage.getItem('institutionToken'),
  loading: false,
  error: null,

  setToken: (token) => {
    if (token) {
      localStorage.setItem('institutionToken', token);
      set({ token, isAuthenticated: true });
    } else {
      localStorage.removeItem('institutionToken');
      set({ token: null, isAuthenticated: false, institution: null, stats: null });
    }
  },

  register: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/institutions/register', data);
      set({ loading: false });
      return { success: true, message: res.data.message };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/institutions/login', { email, password });
      const { accessToken, institution } = res.data.data;
      get().setToken(accessToken);
      set({ institution, loading: false });
      return { success: true, institution };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Institution login failed';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  logout: () => {
    get().setToken(null);
    window.location.href = '/institution/login';
  },

  fetchProfile: async () => {
    const token = get().token;
    if (!token) return;
    set({ loading: true });
    try {
      const res = await api.get('/institutions/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { institution, stats } = res.data.data;
      set({ institution, stats, loading: false });
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        get().setToken(null);
      }
      set({ loading: false });
    }
  },

  fetchApplicants: async (statusFilter = 'all') => {
    const token = get().token;
    if (!token) return;
    try {
      const res = await api.get(`/institutions/applicants?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ applicants: res.data.data.applicants || [] });
    } catch (err) {
      console.error('Failed to fetch applicants:', err);
    }
  },

  updateApplicantStatus: async (applicationId, status, recruiterNote) => {
    const token = get().token;
    if (!token) return { success: false };
    try {
      const res = await api.patch(`/institutions/applicants/${applicationId}/status`, 
        { status, recruiterNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update local state
      set((state) => ({
        applicants: state.applicants.map((a) =>
          a._id === applicationId ? { ...a, status, recruiterNote } : a
        ),
      }));
      return { success: true, application: res.data.data.application };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Update failed' };
    }
  },

  fetchListings: async () => {
    const token = get().token;
    if (!token) return;
    try {
      const res = await api.get('/institutions/listings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ listings: res.data.data || { universities: [], stages: [], jobs: [] } });
    } catch (err) {
      console.error('Failed to fetch listings:', err);
    }
  },

  createListing: async (type, data) => {
    const token = get().token;
    if (!token) return { success: false };
    try {
      const res = await api.post('/institutions/listings', { type, data }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      get().fetchListings();
      get().fetchProfile();
      return { success: true, item: res.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Creation failed' };
    }
  },

  deleteListing: async (type, id) => {
    const token = get().token;
    if (!token) return { success: false };
    try {
      await api.delete(`/institutions/listings/${type}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      get().fetchListings();
      get().fetchProfile();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Delete failed' };
    }
  },
}));
