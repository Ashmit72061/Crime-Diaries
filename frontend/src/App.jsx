import { AppRouter } from './routes/AppRouter.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';

/**
 * Root App component — delegates everything to the router.
 * Keep this file minimal; all layout/routing lives in AppRouter.
 */
function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
