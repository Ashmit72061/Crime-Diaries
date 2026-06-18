import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import {
  Shield,
  Building,
  Compass,
  MapPin,
  UserCheck,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Activity,
  Loader2
} from 'lucide-react';
import { loginSchema } from '../../utils/validators.js';
import { useAuth } from '../../hooks/useAuth.js';
import delhiPoliceLogo from '../../assets/delhi_police_logo.png';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore.js';

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

  // Login hierarchy states
  const [activeTier, setActiveTier] = useState("PS"); // HQ, ZONE, RANGE, DISTRICT, PS
  const [selectedNodeId, setSelectedNodeId] = useState("PS_NDD_PARLIAMENT_STREET");
  const [selectedDistrictId, setSelectedDistrictId] = useState("DIST_NDD");

  // Flat list data helper for selection dropdowns
  const zones = POLICE_HIERARCHY.children || [];
  const ranges = POLICE_HIERARCHY.children.flatMap(z => z.children || []);
  const districts = POLICE_HIERARCHY.children.flatMap(z => z.children || []).flatMap(r => r.children || []);

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
  const handleQuickLogin = (tier, districtId, nodeId) => {
    setActiveTier(tier);
    if (districtId) {
      setSelectedDistrictId(districtId);
    }
    setSelectedNodeId(nodeId);

    // Tiny delay to ensure states propagate and React Hook Form values sync before submit
    setTimeout(() => {
      loginMutation.mutate({
        email: badgeNo,
        password: "Test@1234"
      });
    }, 100);
  };

  return (
    <div className="login-page-bg">
      <div className="login-card-container grid grid-cols-1 md:grid-cols-12">

        {/* Left Panel: Crest, Title, Role Selector, Preview */}
        <div className="login-left-col md:col-span-5 flex flex-col justify-between items-center gap-6">
          <div className="flex flex-col items-center">
            <div className="crest-frame-light">
              <img
                src={delhiPoliceLogo}
                alt="Delhi Police Crest"
                className="w-18 h-18 object-contain"
              />
            </div>
            <h1 className="login-main-title">PHARO Authorizations</h1>
            <p className="login-main-subtitle">Set of your credentials to authenticate yourself</p>
          </div>

          {/* Tier Tabs Selector (Horizontal Grid) */}
          <div role="tablist" className="login-tabs-row">
            {tierConfig.map((tier) => {
              const Icon = tier.icon;
              return (
                <button
                  key={tier.key}
                  type="button"
                  role="tab"
                  aria-selected={activeTier === tier.key}
                  onClick={() => setActiveTier(tier.key)}
                  className={`login-tab-btn ${activeTier === tier.key ? 'active' : ''}`}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span>{tier.label}</span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Selection Preview Box */}
          {previewNode ? (
            <div className="login-preview-box">
              <div className="login-preview-avatar">
                <UserCheck size={18} aria-hidden="true" />
              </div>
              <div className="login-preview-content">
                <span className="login-preview-title">
                  Selected {activeTier === 'PS' ? 'Police Station' : activeTier === 'DISTRICT' ? 'District' : activeTier === 'RANGE' ? 'Range' : activeTier === 'ZONE' ? 'Zone' : 'HQ'}
                </span>
                <span className="login-preview-name">{previewNode.name}</span>
                <span className="login-preview-subtext">
                  {previewNode.rank} {previewNode.officerName} · PIS: {previewNode.pis}
                </span>
              </div>
            </div>
          ) : (
            <div className="login-preview-box" style={{ opacity: 0.5 }}>
              <div className="login-preview-avatar">
                <UserCheck size={18} aria-hidden="true" />
              </div>
              <div className="login-preview-content">
                <span className="login-preview-title">No Selection</span>
                <span className="login-preview-name">Select Command Unit</span>
                <span className="login-preview-subtext">Credentials will auto-populate</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Form Inputs, Warning, Submit, Quick Sign In */}
        <div className="login-right-col md:col-span-7 flex flex-col justify-between">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4.5 w-full">

            {/* Dynamic Dropdowns based on activeTier */}
            <div className="flex flex-col gap-4">
              {/* Zone Selector */}
              {activeTier === "ZONE" && (
                <div className="light-form-group">
                  <label htmlFor="zone-select">Select L&O Zone *</label>
                  <select
                    id="zone-select"
                    value={selectedNodeId}
                    onChange={(e) => setSelectedNodeId(e.target.value)}
                    className="light-select-field"
                  >
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Range Selector */}
              {activeTier === "RANGE" && (
                <div className="light-form-group">
                  <label htmlFor="range-select">Select Jt. CP Range *</label>
                  <select
                    id="range-select"
                    value={selectedNodeId}
                    onChange={(e) => setSelectedNodeId(e.target.value)}
                    className="light-select-field"
                  >
                    {ranges.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* District Selector */}
              {activeTier === "DISTRICT" && (
                <div className="light-form-group">
                  <label htmlFor="district-select">Select District DCP Jurisdiction *</label>
                  <select
                    id="district-select"
                    value={selectedNodeId}
                    onChange={(e) => setSelectedNodeId(e.target.value)}
                    className="light-select-field"
                  >
                    {districts.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Police Station Selector */}
              {activeTier === "PS" && (
                <>
                  <div className="light-form-group">
                    <label htmlFor="ps-district-select">Select District *</label>
                    <select
                      id="ps-district-select"
                      value={selectedDistrictId}
                      onChange={(e) => setSelectedDistrictId(e.target.value)}
                      className="light-select-field"
                    >
                      {districts.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="light-form-group">
                    <label htmlFor="ps-select">Select Police Station *</label>
                    <select
                      id="ps-select"
                      value={selectedNodeId}
                      onChange={(e) => setSelectedNodeId(e.target.value)}
                      className="light-select-field"
                    >
                      {(findNodeById(selectedDistrictId)?.children || []).map(ps => (
                        <option key={ps.id} value={ps.id}>{ps.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Email Field */}
            <div className="light-form-group">
              <label htmlFor="login-email">Registered Official Email *</label>
              <input
                id="login-email"
                type="text"
                autoComplete="username"
                spellCheck={false}
                placeholder="e.g., ram.sharma.ips@delhipolice.gov.in…"
                className="light-input-field"
                {...register('email')}
              />
              {errors.email && <span className="text-xs text-red-500 mt-1">{errors.email.message}</span>}
            </div>

            {/* Password Field */}
            <div className="light-form-group">
              <label htmlFor="login-password">Security Key / Password *</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  spellCheck={false}
                  placeholder="e.g., ••••••••…"
                  className="light-input-field pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
              {errors.password && <span className="text-xs text-red-500 mt-1">{errors.password.message}</span>}
            </div>

            {/* Red Warning Card copy matching the image */}
            <div className="light-warning-box">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                <strong>Warning:</strong> A network disruption may allow simultaneous sessions on different machines. Please ensure all previous sessions are logged out.
              </span>
            </div>

            {/* Submit Button */}
            <button
              id="login-submit"
              type="submit"
              disabled={loginMutation.isPending}
              className="light-submit-btn"
            >
              {loginMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              ) : (
                <Lock size={16} aria-hidden="true" />
              )}
              <span>{loginMutation.isPending ? 'Authorizing Session…' : 'Establish Secure Connection'}</span>
            </button>
          </form>

          {/* Quick Sign-In As Grid */}
          <div className="light-quick-section">
            <span className="light-quick-label">Quick Sign In As</span>
            <div className="light-quick-grid">
              <button
                type="button"
                onClick={() => handleQuickLogin("PS", "DIST_NDD", "PS_NDD_PARLIAMENT_STREET")}
                className="light-quick-card"
              >
                <UserCheck size={16} className="light-quick-avatar" aria-hidden="true" />
                <span className="light-quick-role">Station</span>
                <span className="light-quick-name">Operator Login</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("DISTRICT", "DIST_CD", "DIST_CD")}
                className="light-quick-card"
              >
                <Shield size={16} className="light-quick-avatar" aria-hidden="true" />
                <span className="light-quick-role">DCP</span>
                <span className="light-quick-name">Credentials Login</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("HQ", null, "HQ")}
                className="light-quick-card"
              >
                <Lock size={16} className="light-quick-avatar" aria-hidden="true" />
                <span className="light-quick-role">Password</span>
                <span className="light-quick-name">& Cert Login</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
