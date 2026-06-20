import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';
import { Spinner } from '../components/ui/Spinner.jsx';
import { ROUTES } from '../utils/constants.js';

/**
 * Wraps routes that require authentication.
 * Optionally restricts to specific roles.
 *
 * Usage:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *   </Route>
 *
 *   <Route element={<ProtectedRoute roles={['admin']} />}>
 *     <Route path="/admin" element={<AdminPanel />} />
 *   </Route>
 */
export const ProtectedRoute = ({ roles = [] }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) return <Spinner fullPage />;

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <Outlet />;
};
