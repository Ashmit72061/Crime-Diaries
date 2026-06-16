import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { Layout } from '../components/layout/Layout.jsx';
import { ROUTES } from '../utils/constants.js';

// Import Pages directly for solid bundle building
import { LoginPage } from '../features/auth/LoginPage.jsx';
import { PortalDashboard } from '../features/portal/pages/PortalDashboard.jsx';
import { CasesPage } from '../features/portal/pages/CasesPage.jsx';
import { ArrestsPage } from '../features/portal/pages/ArrestsPage.jsx';
import { PCRPage } from '../features/portal/pages/PCRPage.jsx';
import { MissingPage } from '../features/portal/pages/MissingPage.jsx';
import { AnalyticsPanel } from '../features/portal/pages/AnalyticsPanel.jsx';
import { AuditLogViewer } from '../features/portal/pages/AuditLogViewer.jsx';
import { AdminPanel } from '../features/portal/pages/AdminPanel.jsx';

const RouteWrapper = ({ Component, roles }) => {
  return (
    <Routes>
      <Route element={<ProtectedRoute roles={roles} />}>
        <Route path="*" element={<Layout><Component /></Layout>} />
      </Route>
    </Routes>
  );
};

export const AppRouter = () => {
  const { token } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect Root to Dashboard or Login */}
        <Route 
          path={ROUTES.HOME} 
          element={token ? <Navigate to={ROUTES.DASHBOARD} replace /> : <Navigate to={ROUTES.LOGIN} replace />} 
        />

        {/* Public Login Route */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />

        {/* Scoped Dashboard Pages */}
        <Route 
          path={`${ROUTES.DASHBOARD}/*`} 
          element={<RouteWrapper Component={PortalDashboard} roles={['ps', 'acp', 'dcp', 'hq', 'admin']} />} 
        />
        <Route 
          path={`${ROUTES.CASES}/*`} 
          element={<RouteWrapper Component={CasesPage} roles={['ps', 'acp', 'dcp', 'hq', 'admin']} />} 
        />
        <Route 
          path={`${ROUTES.ARRESTS}/*`} 
          element={<RouteWrapper Component={ArrestsPage} roles={['ps', 'acp', 'dcp', 'hq', 'admin']} />} 
        />
        <Route 
          path={`${ROUTES.PCR}/*`} 
          element={<RouteWrapper Component={PCRPage} roles={['ps', 'acp', 'dcp', 'hq', 'admin']} />} 
        />
        <Route 
          path={`${ROUTES.MISSING}/*`} 
          element={<RouteWrapper Component={MissingPage} roles={['ps', 'acp', 'dcp', 'hq', 'admin']} />} 
        />
        <Route 
          path={`${ROUTES.ANALYTICS}/*`} 
          element={<RouteWrapper Component={AnalyticsPanel} roles={['ps', 'acp', 'dcp', 'hq', 'admin']} />} 
        />
        <Route 
          path={`${ROUTES.AUDIT_LOGS}/*`} 
          element={<RouteWrapper Component={AuditLogViewer} roles={['hq', 'admin']} />} 
        />
        <Route 
          path={`${ROUTES.ADMIN_PANEL}/*`} 
          element={<RouteWrapper Component={AdminPanel} roles={['admin', 'dcp', 'hq']} />} 
        />

        {/* Fallback 404 Redirect */}
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </BrowserRouter>
  );
};
