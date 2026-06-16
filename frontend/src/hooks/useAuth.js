import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api.js';
import useAuthStore from '../store/authStore.js';
import { QUERY_KEYS } from '../utils/constants.js';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const { user, isAuthenticated, login, logout, setLoading } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch current user (runs once on mount)
  const { isLoading: isFetching } = useQuery({
    queryKey: QUERY_KEYS.ME,
    queryFn: async () => {
      try {
        const res = await authApi.getMe();
        login(res.data.data.user);
        return res.data.data.user;
      } catch (err) {
        if (!err.response && isAuthenticated) {
          // Keep current offline user if backend is offline
          return user;
        }
        throw err;
      }
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
    onError: () => logout(),
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      try {
        const res = await authApi.login(credentials);
        const { user, access_token, refresh_token } = res.data.data;
        if (access_token) localStorage.setItem('access_token', access_token);
        if (refresh_token) localStorage.setItem('refresh_token', refresh_token);
        return user;
      } catch (err) {
        if (!err.response) {
          console.warn("Backend offline. Simulating mock login for:", credentials.email);
          return {
            id: "mock-user-id",
            username: credentials.email.split('@')[0] || "HC Ramesh Kumar",
            email: credentials.email,
            role: "user",
          };
        }
        throw err;
      }
    },
    onSuccess: (userData, variables) => {
      login(userData, variables?.selectedNodeId);
      toast.success('Welcome back!');
      navigate('/dashboard');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Login failed');
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData) => {
      try {
        await authApi.register(userData);
      } catch (err) {
        if (!err.response) {
          console.warn("Backend offline. Simulating mock registration for:", userData.username);
          return;
        }
        throw err;
      }
    },
    onSuccess: () => {
      toast.success('Account created! Please log in.');
      navigate('/login');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Registration failed');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await authApi.logout();
      } catch (err) {
        // Suppress offline errors on logout
        if (!err.response) return;
        throw err;
      }
    },
    onSettled: () => {
      logout();
      queryClient.clear();
      navigate('/login');
    },
  });

  return {
    user,
    isAuthenticated,
    isFetching,
    loginMutation,
    registerMutation,
    logoutMutation,
  };
};

