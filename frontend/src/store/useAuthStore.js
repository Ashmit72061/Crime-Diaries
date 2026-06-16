import { create } from 'zustand';
import axios from 'axios';
import { API_ROUTES } from '../utils/constants.js';

// Setup axios default token if stored
const savedToken = localStorage.getItem('dpp_token');
const savedUser = localStorage.getItem('dpp_user') ? JSON.parse(localStorage.getItem('dpp_user')) : null;

if (savedToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
}

export const useAuthStore = create((set) => ({
  token: savedToken,
  user: savedUser,
  loading: false,
  error: null,

  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(API_ROUTES.LOGIN, { username, password });
      const { token, user } = response.data.data;

      localStorage.setItem('dpp_token', token);
      localStorage.setItem('dpp_user', JSON.stringify(user));
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      set({ token, user, loading: false });
      return { success: true };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Invalid credentials.';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  logout: async () => {
    try {
      await axios.post(API_ROUTES.LOGOUT);
    } catch (e) {
      // Ignore cleanup error
    }
    localStorage.removeItem('dpp_token');
    localStorage.removeItem('dpp_user');
    delete axios.defaults.headers.common['Authorization'];
    set({ token: null, user: null, error: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('dpp_token');
    if (!token) return;

    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.get(API_ROUTES.ME);
      const { user } = response.data.data;
      localStorage.setItem('dpp_user', JSON.stringify(user));
      set({ token, user });
    } catch (err) {
      // Token expired
      localStorage.removeItem('dpp_token');
      localStorage.removeItem('dpp_user');
      delete axios.defaults.headers.common['Authorization'];
      set({ token: null, user: null });
    }
  }
}));
