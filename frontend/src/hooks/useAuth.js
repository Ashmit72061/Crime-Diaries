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
      const res = await authApi.getMe();
      login(res.data.data.user);
      return res.data.data.user;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
    onError: () => logout(),
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (res) => {
      login(res.data.data.user);
      toast.success('Welcome back!');
      navigate('/');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Login failed');
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authApi.register,
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
    mutationFn: authApi.logout,
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
