import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

const useAuthStore = create(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,

        setUser: (user) => set({ user, isAuthenticated: !!user }),

        setLoading: (isLoading) => set({ isLoading }),

        login: (user) => set({ user, isAuthenticated: true }),

        logout: () => set({ user: null, isAuthenticated: false }),

        updateUser: (updates) =>
          set((state) => ({
            user: state.user ? { ...state.user, ...updates } : null,
          })),

        hasRole: (...roles) => roles.includes(get().user?.role),
      }),
      {
        name: 'crime-diaries-auth',
        partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      }
    ),
    { name: 'AuthStore' }
  )
);

export default useAuthStore;
