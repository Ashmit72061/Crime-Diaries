<<<<<<< HEAD
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Shell from './components/layout/Shell';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RegistrationPage from './pages/records/RegistrationPage';
import QueuePage from './pages/queue/QueuePage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import ReportsPage from './pages/reports/ReportsPage';
import UsersPage from './pages/admin/UsersPage';
import HierarchyPage from './pages/admin/HierarchyPage';
import AuditPage from './pages/admin/AuditPage';

// Protectors
const AuthenticatedRoute = ({ children, roles }) => {
  const { user, token, loading } = useAuth();

  if (loading) return null;
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Shell>{children}</Shell>;
};

const AnonymousRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) return null;
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route
        path="/login"
        element={
          <AnonymousRoute>
            <LoginPage />
          </AnonymousRoute>
        }
      />

      {/* Operator and Reviewer Pages */}
      <Route
        path="/dashboard"
        element={
          <AuthenticatedRoute>
            <DashboardPage />
          </AuthenticatedRoute>
        }
      />

      <Route
        path="/register"
        element={
          <AuthenticatedRoute roles={['HC']}>
            <RegistrationPage />
          </AuthenticatedRoute>
        }
      />

      <Route
        path="/queue"
        element={
          <AuthenticatedRoute>
            <QueuePage />
          </AuthenticatedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <AuthenticatedRoute roles={['DISTRICT_OFFICER', 'HQ_ANALYST', 'HQ_ADMIN', 'SYSTEM_ADMIN']}>
            <AnalyticsPage />
          </AuthenticatedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <AuthenticatedRoute>
            <ReportsPage />
          </AuthenticatedRoute>
        }
      />

      {/* Admin Operations Pages */}
      <Route
        path="/admin/users"
        element={
          <AuthenticatedRoute roles={['HQ_ADMIN', 'SYSTEM_ADMIN']}>
            <UsersPage />
          </AuthenticatedRoute>
        }
      />

      <Route
        path="/admin/hierarchy"
        element={
          <AuthenticatedRoute roles={['HQ_ADMIN', 'SYSTEM_ADMIN']}>
            <HierarchyPage />
          </AuthenticatedRoute>
        }
      />

      <Route
        path="/admin/audit"
        element={
          <AuthenticatedRoute roles={['SYSTEM_ADMIN']}>
            <AuditPage />
          </AuthenticatedRoute>
        }
      />

      {/* Fallback Catch-All */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
=======
import { AppRouter } from './routes/AppRouter.jsx';

/**
 * Root App component — delegates everything to the router.
 * Keep this file minimal; all layout/routing lives in AppRouter.
 */
function App() {
  return <AppRouter />;
}
>>>>>>> 050d70686de07c389fe62cdcf8820253124b8856

export default App;
