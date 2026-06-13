import { AppRouter } from './routes/AppRouter.jsx';

/**
 * Root App component — delegates everything to the router.
 * Keep this file minimal; all layout/routing lives in AppRouter.
 */
function App() {
  return <AppRouter />;
}

export default App;
