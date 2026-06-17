import { useEffect } from 'react';
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
  const { data: userData, isLoading: isFetching, error: queryError } = useQuery({
    queryKey: QUERY_KEYS.ME,
    queryFn: async () => {
      try {
        const res = await authApi.getMe();
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
  });

  // Safe side-effect sync
  useEffect(() => {
    if (userData) {
      login(userData);
    }
  }, [userData]);

  // Handle query errors
  useEffect(() => {
    if (queryError) {
      logout();
    }
  }, [queryError]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      try {
        const payload = {
          ...credentials,
          badge_no: credentials.email,
          badgeNo: credentials.email
        };
        const res = await authApi.login(payload);
        const { user, access_token, refresh_token } = res.data.data;
        if (access_token) localStorage.setItem('access_token', access_token);
        if (refresh_token) localStorage.setItem('refresh_token', refresh_token);
        return user;
      } catch (err) {
        if (!err.response) {
          const debugMode = localStorage.getItem('prism_debug_api_mode') || 'production';
          if (debugMode === 'production') {
            throw new Error('Cannot reach the server. Start the backend with npm run dev.');
          }
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
      const msg = err.response?.data?.message || err.message || 'Login failed';
      toast.error(msg, { duration: 6000 });
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

