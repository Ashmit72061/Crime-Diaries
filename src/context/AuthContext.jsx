import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('pharos_token'));
  const [loading, setLoading] = useState(true);

  // Setup request interceptor to append authorization token
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use((config) => {
      const activeToken = localStorage.getItem('pharos_token');
      if (activeToken) {
        config.headers.Authorization = `Bearer ${activeToken}`;
      }
      return config;
    });

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, []);

  // Setup response interceptor for token refresh handling
  useEffect(() => {
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const refreshRes = await axios.post('/api/v1/auth/refresh');
            const newAccessToken = refreshRes.data.data.accessToken;
            setToken(newAccessToken);
            localStorage.setItem('pharos_token', newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            handleLogoutState();
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem('pharos_token');
      if (storedToken) {
        try {
          const res = await axios.get('/api/v1/auth/me');
          setUser(res.data.data.user);
        } catch (err) {
          console.error('Session expired');
          handleLogoutState();
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const handleLogoutState = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('pharos_token');
  };

  const login = async (badge_no, password) => {
    const res = await axios.post('/api/v1/auth/login', { badge_no, password });
    const { accessToken, user: userData } = res.data.data;
    setToken(accessToken);
    setUser(userData);
    localStorage.setItem('pharos_token', accessToken);
    return userData;
  };

  const logout = async () => {
    try {
      await axios.post('/api/v1/auth/logout');
    } catch (e) {
      console.warn('Backend logout call failed or network offline');
    }
    handleLogoutState();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
