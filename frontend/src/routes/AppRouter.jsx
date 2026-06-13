import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { Navbar } from '../components/layout/Navbar.jsx';
import { Footer } from '../components/layout/Footer.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { ROUTES } from '../utils/constants.js';

// ── Lazy-loaded pages ──────────────────────────────────────────────────────────
const HomePage     = lazy(() => import('../features/home/HomePage.jsx'));
const LoginPage    = lazy(() => import('../features/auth/LoginPage.jsx'));
const RegisterPage = lazy(() => import('../features/auth/RegisterPage.jsx'));
const NotFound     = lazy(() => import('../pages/NotFound.jsx'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Spinner size="lg" />
  </div>
);

export const AppRouter = () => (
  <BrowserRouter>
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Navbar />
      <main className="flex-1 pt-16">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path={ROUTES.HOME}     element={<HomePage />} />
            <Route path={ROUTES.LOGIN}    element={<LoginPage />} />
            <Route path={ROUTES.REGISTER} element={<RegisterPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path={ROUTES.PROFILE}   element={<div className="p-8 text-zinc-100">Profile page — coming soon</div>} />
              <Route path={ROUTES.DASHBOARD} element={<div className="p-8 text-zinc-100">Dashboard — coming soon</div>} />
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route path="/admin/*" element={<div className="p-8 text-zinc-100">Admin panel — coming soon</div>} />
            </Route>

            {/* 404 */}
            <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  </BrowserRouter>
);
