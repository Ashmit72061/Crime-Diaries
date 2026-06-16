import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { findNodeById } from '../utils/hierarchyData.js';

const useAuthStore = create(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        activeNodeId: "PS_NDD_PARLIAMENT_STREET",

        setUser: (user) => set({ user, isAuthenticated: !!user }),

        setLoading: (isLoading) => set({ isLoading }),

        login: (user, selectedNodeId = "PS_NDD_PARLIAMENT_STREET") => {
          // Merge user with chosen command profile
          const initialNode = findNodeById(selectedNodeId) || findNodeById("PS_NDD_PARLIAMENT_STREET");
          const mergedUser = {
            ...user,
            username: initialNode.officerName,
            rank: initialNode.rank,
            pis: initialNode.pis,
            role: initialNode.type,
            stationName: initialNode.stationName || "",
            districtKey: initialNode.districtKey || ""
          };
          set({ user: mergedUser, isAuthenticated: true, activeNodeId: initialNode.id });
        },

        logout: () => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          set({ user: null, isAuthenticated: false, activeNodeId: "PS_NDD_PARLIAMENT_STREET" });
        },

        setActiveNodeId: (nodeId) => {
          const node = findNodeById(nodeId);
          if (!node) return;
          
          set((state) => {
            const updatedUser = state.user ? {
              ...state.user,
              username: node.officerName,
              rank: node.rank,
              pis: node.pis,
              role: node.type,
              stationName: node.stationName || "",
              districtKey: node.districtKey || ""
            } : null;
            
            return {
              activeNodeId: nodeId,
              user: updatedUser
            };
          });
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
          isAuthenticated: state.isAuthenticated,
          activeNodeId: state.activeNodeId 
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);

export default useAuthStore;
