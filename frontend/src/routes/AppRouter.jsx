import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import PublicLayout from '../components/layout/PublicLayout.jsx';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { ROUTES } from '../utils/constants.js';

// ── Lazy-loaded pages ──────────────────────────────────────────────────────────
const HomePage     = lazy(() => import('../features/home/HomePage.jsx'));
const LoginPage    = lazy(() => import('../features/auth/LoginPage.jsx'));
const RegisterPage = lazy(() => import('../features/auth/RegisterPage.jsx'));
const NotFound     = lazy(() => import('../pages/NotFound.jsx'));

// Police portal pages
const Dashboard          = lazy(() => import('../pages/Dashboard.jsx'));
const CaseManagement     = lazy(() => import('../pages/CaseManagement.jsx'));
const ArrestManagement   = lazy(() => import('../pages/ArrestManagement.jsx'));
const PCRCallEntry       = lazy(() => import('../pages/PCRCallEntry.jsx'));
const UIDBManagement     = lazy(() => import('../pages/UIDBManagement.jsx'));
const MissingPersonEntry = lazy(() => import('../pages/MissingPersonEntry.jsx'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Spinner size="lg" />
  </div>
);

export const AppRouter = () => (
  <BrowserRouter>
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes layout wrapper */}
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.HOME}     element={<HomePage />} />
          <Route path={ROUTES.PROFILE}  element={<div className="p-8 text-zinc-100">Profile page — coming soon</div>} />
        </Route>

        {/* Auth routes without public site header and footer */}
        <Route path={ROUTES.LOGIN}    element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />

        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
            <Route path="/dashboard/case-management" element={<CaseManagement />} />
            <Route path="/dashboard/arrest-management" element={<ArrestManagement />} />
            <Route path="/dashboard/pcr-calls" element={<PCRCallEntry />} />
            <Route path="/dashboard/uidb-management" element={<UIDBManagement />} />
            <Route path="/dashboard/missing-persons" element={<MissingPersonEntry />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

