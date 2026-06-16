import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import useAuthStore from '../store/authStore.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { user: storeUser, setUser, logout: storeLogout } = useAuthStore();
  const [user, setUserState] = useState(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        return jwtDecode(token);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Sync with Zustand store
  useEffect(() => {
    if (user && !storeUser) {
      setUser(user);
    }
  }, [user, storeUser, setUser]);

  // Sync from Zustand store if it updates (e.g. node switcher)
  useEffect(() => {
    if (storeUser) {
      setUserState(storeUser);
    } else {
      setUserState(null);
    }
  }, [storeUser]);

  const login = (tokens) => {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    try {
      const decoded = jwtDecode(tokens.access_token);
      setUserState(decoded);
      setUser(decoded);
    } catch (e) {
      console.error('Failed to decode token on login', e);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUserState(null);
    storeLogout();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);
