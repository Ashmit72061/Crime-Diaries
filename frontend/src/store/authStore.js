import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

const useAuthStore = create(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        jurisdiction: null,
        isAuthenticated: false,
        isLoading: false,

        setUser: (user, jurisdiction) => set({ user, jurisdiction, isAuthenticated: !!user }),

        setLoading: (isLoading) => set({ isLoading }),

        login: (userData, jurisdictionData) => {
          if (!userData) return;

          let role = userData.role || 'GUEST';
          let rank = userData.role === 'HC' ? 'Head Constable' : 
                     (userData.role === 'SHO' ? 'Station House Officer' : 
                     (userData.role === 'ACP' ? 'Assistant Commissioner of Police' : 
                     (userData.role === 'DISTRICT_OFFICER' ? 'Deputy Commissioner of Police' : 
                     (userData.role === 'SYSTEM_ADMIN' ? 'System Administrator' : 'Officer'))));

          const mergedUser = {
            ...userData,
            rank: rank,
            role: role
          };
          
          set({ 
            user: mergedUser, 
            jurisdiction: jurisdictionData || null,
            isAuthenticated: true 
          });
        },

        logout: () => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          set({ user: null, jurisdiction: null, isAuthenticated: false });
        },

        updateUser: (updates) =>
          set((state) => ({
            user: state.user ? { ...state.user, ...updates } : null,
          })),

        hasRole: (...roles) => roles.includes(get().user?.role),
      }),
      {
        name: 'crime-diaries-auth',
        partialize: (state) => ({ 
          user: state.user,
          jurisdiction: state.jurisdiction,
          isAuthenticated: state.isAuthenticated
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);

export default useAuthStore;
