import React, { createContext, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import useAuthStore from '../store/authStore.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { user, login: storeLogin, logout: storeLogout } = useAuthStore();

  const login = (tokens) => {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    try {
      const decoded = jwtDecode(tokens.access_token);
      storeLogin(decoded);
    } catch (e) {
      console.error('Failed to decode token on login', e);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    storeLogout();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);
