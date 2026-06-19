import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Lock, 
  Eye, 
  EyeOff
} from 'lucide-react';
import { loginSchema } from '../../utils/validators.js';
import { useAuth } from '../../hooks/useAuth.js';
import delhiPoliceLogo from '../../assets/delhi_police_logo.png';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore.js';
import LanguageToggle from '../../components/ui/LanguageToggle.jsx';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { loginMutation } = useAuth();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "HC001",
      password: "Test@1234",
    }
  });

  const onSubmit = (data) => {
    loginMutation.mutate({
      email: data.email,
      password: data.password,
    });
  };

  // Helper to trigger login for quick-profiles
  const handleQuickLogin = (badgeNo) => {
    setValue('email', badgeNo);
    setValue('password', 'Test@1234');
    
    // Tiny delay to ensure React Hook Form values sync before submit
    setTimeout(() => {
      loginMutation.mutate({
        email: badgeNo,
        password: "Test@1234"
      });
    }, 100);
  };

  return (
    <div className="login-split-container">
      {/* Floating Language Toggle */}
      <LanguageToggle variant="badge" />

      {/* Left Panel: Branding */}
      <div className="login-branding-panel">
        <div className="branding-header">
          <div className="crest-frame">
            <img src={delhiPoliceLogo} alt="Delhi Police Crest" className="branding-crest-img" />
          </div>
          <div className="branding-org">
            <span className="branding-org-govt">Govt. of NCT of Delhi</span>
            <span className="branding-org-name">Delhi Police</span>
          </div>
        </div>

        <div className="branding-hero-center">
          <h2 className="branding-title-sub" style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--accent-gold)', marginBottom: '0.25rem' }}>PRISM</h2>
          <p className="text-xs font-bold text-slate-300 mb-4 tracking-wider">
            POLICE REPORTING, INTELLIGENCE & STATISTICS MANAGEMENT
          </p>
          <p className="branding-desc">
            PRISM enables single-point data entry, automated report generation, hierarchical approvals, and district-wide analytics.
          </p>
          <div className="branding-features-list">
            <div className="branding-feature-item">
              <span className="branding-feature-dot" />
              <span>Hierarchical 5-Tier Data Integration</span>
            </div>
            <div className="branding-feature-item">
              <span className="branding-feature-dot" />
              <span>Daily Morning Diary Compilation for Districts</span>
            </div>
            <div className="branding-feature-item">
              <span className="branding-feature-dot" />
              <span>Interactive Crime Trend Filtering for Headquarters</span>
            </div>
            <div className="branding-feature-item">
              <span className="branding-feature-dot" />
              <span>Fortnightly Command Report Analytics</span>
            </div>
          </div>
        </div>

        <div className="branding-footer">
          <span>Security Level: Command Authorization Required</span>
          <span className="branding-motto">SHANTI · SEVA · NYAYA</span>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="login-form-panel flex-col gap-4">
        <motion.div
          initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ type: "spring", stiffness: 85, damping: 14 }}
          className="login-card-glass premium-glass-card"
        >
          {/* Centered Crest Branding in Card */}
          <div className="flex flex-col items-center mb-6">
            <div className="crest-frame mb-3">
              <img src={delhiPoliceLogo} alt="Delhi Police Crest" className="w-16 h-16 object-contain" />
            </div>
            <h1 className="login-card-title">PRISM Authorization Console</h1>
            <p className="login-card-subtitle mt-1">Sign in with your official Police ID</p>
          </div>

          {/* Email / Password Form */}
          <motion.form 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            onSubmit={handleSubmit(onSubmit)} 
            className="flex flex-col gap-4"
          >
            <div className="login-form-group">
              <label htmlFor="login-email">Badge No / Official Email</label>
              <input
                id="login-email"
                type="text"
                autoComplete="username"
                placeholder="HC001 or officer@delhipolice.gov.in"
                className="login-input-field"
                {...register('email')}
              />
              {errors.email && <span className="text-xs text-red-400">{errors.email.message}</span>}
            </div>

            <div className="login-form-group">
              <label htmlFor="login-password">Security Key / Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="login-input-field pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
                </button>
              </div>
              {errors.password && <span className="text-xs text-red-400">{errors.password.message}</span>}
            </div>

            {/* Audit Warning */}
            <div className="security-notice-box flex gap-2">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                <strong>Warning:</strong> Authorized official access only. All sessions are monitored, audited, and logged under Section 66 of IT Act, 2000.
              </span>
            </div>

            {/* Submit Button */}
            <button
              id="login-submit"
              type="submit"
              disabled={loginMutation.isPending}
              className="login-btn-primary mt-2"
            >
              <Lock size={14} aria-hidden="true" />
              <span>{loginMutation.isPending ? 'Authorizing Session…' : 'Establish Secure Connection'}</span>
            </button>
          </motion.form>

          {/* Quick-Access Demo Profiles */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="quick-profiles-section mt-6"
          >
            <span className="quick-profiles-label">Quick Demo Access</span>
            <div className="quick-profile-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))", display: "grid", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => handleQuickLogin("HQ001")}
                className="quick-profile-card"
              >
                <div className="quick-profile-avatar" aria-hidden="true">HQ</div>
                <span className="quick-profile-role">Headquarters</span>
                <span className="quick-profile-name">HQ Analyst</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("DO001")}
                className="quick-profile-card"
              >
                <div className="quick-profile-avatar" aria-hidden="true">DCP</div>
                <span className="quick-profile-role">District Officer</span>
                <span className="quick-profile-name">New Delhi District</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("ACP001")}
                className="quick-profile-card"
              >
                <div className="quick-profile-avatar" aria-hidden="true">ACP</div>
                <span className="quick-profile-role">Assistant Commissioner</span>
                <span className="quick-profile-name">Parliament St Subdiv</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("SHO001")}
                className="quick-profile-card"
              >
                <div className="quick-profile-avatar" aria-hidden="true">SHO</div>
                <span className="quick-profile-role">Station House Officer</span>
                <span className="quick-profile-name">Parliament St PS</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("HC001")}
                className="quick-profile-card"
                style={{ gridColumn: 'span 2' }}
              >
                <div className="quick-profile-avatar" aria-hidden="true">HC</div>
                <span className="quick-profile-role">Head Constable</span>
                <span className="quick-profile-name">Parliament St PS</span>
              </button>
            </div>
          </motion.div>
        </motion.div>

        {/* Portal Footer */}
        <footer className="w-full text-center text-[10px] sm:text-xs text-slate-500 mt-2 max-w-[460px] leading-relaxed">
          <p>© {new Date().getFullYear()} Delhi Police (IT Division). NCT of Delhi, India.</p>
          <p className="mt-1 text-slate-600 font-sans tracking-wide">
            Powered by PRISM (Police Reporting, Intelligence & Statistics Management)
          </p>
        </footer>
      </div>
    </div>
  );
}