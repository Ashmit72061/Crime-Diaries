import { Link } from 'react-router-dom';
import { Shield, LogOut, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../../store/authStore.js';
import { useAuth } from '../../hooks/useAuth.js';
import { ROUTES, APP_NAME } from '../../utils/constants.js';
import { Button } from '../ui/Button.jsx';

const navLinks = [
  { label: 'About PRISM', to: '#about' },
  { label: 'Security Policy', to: '#security' },
  { label: 'Helplines', to: '#helplines' },
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
            <Shield className="w-6 h-6 text-[#cca43b] group-hover:text-amber-400 transition-colors" />
            <span className="font-bold text-lg text-zinc-100 tracking-tight font-display">{APP_NAME}</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.to}
                href={link.to}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-[#cca43b] hover:bg-zinc-800/40 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Auth Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="primary" size="sm" as={Link} to={ROUTES.LOGIN}>
              Access Command Console
            </Button>
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
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 py-3 space-y-2">
          {navLinks.map((link) => (
            <a
              key={link.to}
              href={link.to}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-[#cca43b]"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 border-t border-zinc-800">
            <Button variant="primary" size="sm" fullWidth as={Link} to={ROUTES.LOGIN}>
              Access Command Console
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};
