import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import { ROUTES } from '../utils/constants.js';

export const ProtectedRoute = ({ roles = [] }) => {
  const { token, user } = useAuthStore();

  if (!token) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-100 p-6">
        <div className="bg-zinc-900 border border-red-500/20 p-8 rounded-xl max-w-md text-center shadow-lg">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h1>
          <p className="text-zinc-400 mb-6">
            You do not have the required permissions ({roles.join(', ')}) to view this section.
            Your current role is: <span className="font-semibold text-zinc-200">{user?.role}</span>
          </p>
          <a
            href={ROUTES.DASHBOARD}
            className="inline-block px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-lg transition-colors"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
