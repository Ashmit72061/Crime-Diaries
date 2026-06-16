import { Link, NavLink } from 'react-router-dom';
import { BookOpen, LogOut, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../../store/authStore.js';
import { useAuth } from '../../hooks/useAuth.js';
import { ROUTES, APP_NAME } from '../../utils/constants.js';
import { Button } from '../ui/Button.jsx';
import { clsx } from 'clsx';

const navLinks = [
  { label: 'Stories', to: '/stories' },
  { label: 'True Crime', to: '/true-crime' },
  { label: 'Community', to: '/community' },
];

export const Navbar = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { logoutMutation } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to={ROUTES.HOME} className="flex items-center gap-2 group">
            <BookOpen className="w-6 h-6 text-violet-400 group-hover:text-violet-300 transition-colors" />
            <span className="font-bold text-lg text-zinc-100 tracking-tight">{APP_NAME}</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  clsx(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'text-violet-400 bg-violet-500/10'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Auth Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to={ROUTES.PROFILE}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                >
                  <User className="w-4 h-4" />
                  {user?.username}
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logoutMutation.mutate()}
                  isLoading={logoutMutation.isPending}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" as={Link} to={ROUTES.LOGIN}>
                  Log in
                </Button>
                <Button variant="primary" size="sm" as={Link} to={ROUTES.REGISTER}>
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'block px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive ? 'text-violet-400 bg-violet-500/10' : 'text-zinc-400 hover:text-zinc-100'
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
};
