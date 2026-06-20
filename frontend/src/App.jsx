import { useEffect } from 'react';
import { AppRouter } from './routes/AppRouter.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import useAuthStore from './store/authStore.js';
import { HIERARCHY_THEMES } from './utils/hierarchyTheme.js';

/**
 * Root App component — delegates everything to the router.
 * Dynamically sets hierarchy level CSS variables at the document root.
 */
function App() {
  const user = useAuthStore((state) => state.user);
  const level = user?.level || 'PS';
  const theme = HIERARCHY_THEMES[level] || HIERARCHY_THEMES.PS;

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(theme).forEach(([k, v]) => {
      root.style.setProperty(k, v);
    });
  }, [level, theme]);

  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
