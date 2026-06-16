<<<<<<< HEAD
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './i18n/config.js'; // Initialize translation engine
import './index.css';     // Load custom dark UI styling

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
=======
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#18181b',
            color: '#f4f4f5',
            border: '1px solid #3f3f46',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#a78bfa', secondary: '#18181b' } },
          error:   { iconTheme: { primary: '#f87171', secondary: '#18181b' } },
        }}
      />
    </QueryClientProvider>
  </StrictMode>
>>>>>>> 050d70686de07c389fe62cdcf8820253124b8856
);
