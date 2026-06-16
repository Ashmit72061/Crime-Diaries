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
  Activity
} from 'lucide-react';
import { loginSchema } from '../../utils/validators.js';
import { useAuth } from '../../hooks/useAuth.js';
import { POLICE_HIERARCHY, findNodeById } from '../../utils/hierarchyData.js';
import delhiPoliceLogo from '../../assets/delhi_police_logo.png';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore.js';

// Dynamic email generator based on officer name
const getEmailForNode = (node) => {
  if (!node) return "operator@delhipolice.gov.in";
  if (node.id === "HQ") return "vikram.singh@delhipolice.gov.in";
  if (node.officerName) {
    const cleaned = node.officerName
      .replace(/^(Sh\.|Smt\.|HC)\s+/i, "")
      .replace(/,\s*IPS$/i, "")
      .toLowerCase()
      .replace(/\s+/g, ".");
    return `${cleaned}@delhipolice.gov.in`;
  }
  return "operator@delhipolice.gov.in";
};

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
      email: "ramesh.kumar@delhipolice.gov.in",
      password: "Password123",
    }
  });

  // When activeTier changes, set appropriate default node
  useEffect(() => {
    if (activeTier === "HQ") {
      setSelectedNodeId("HQ");
    } else if (activeTier === "ZONE") {
      setSelectedNodeId(zones[0]?.id || "ZONE_2");
    } else if (activeTier === "RANGE") {
      setSelectedNodeId(ranges[0]?.id || "RANGE_SOUTHERN");
    } else if (activeTier === "DISTRICT") {
      setSelectedNodeId(districts[0]?.id || "DIST_SD");
    } else if (activeTier === "PS") {
      // Find stations for the selectedDistrictId
      const distNode = findNodeById(selectedDistrictId);
      if (distNode && distNode.children?.length > 0) {
        setSelectedNodeId(distNode.children[0].id);
      } else {
        setSelectedNodeId("PS_NDD_PARLIAMENT_STREET");
      }
    }
  }, [activeTier]);

  // When selectedDistrictId changes in PS mode, update station selection
  useEffect(() => {
    if (activeTier === "PS") {
      const distNode = findNodeById(selectedDistrictId);
      if (distNode && distNode.children?.length > 0) {
        setSelectedNodeId(distNode.children[0].id);
      }
    }
  }, [selectedDistrictId]);

  // Sync email & password when selectedNodeId changes
  useEffect(() => {
    const node = findNodeById(selectedNodeId);
    if (node) {
      const email = getEmailForNode(node);
      setValue('email', email);
      setValue('password', 'Password123'); // Demo password
    }
  }, [selectedNodeId, setValue]);

  const onSubmit = (data) => {
    loginMutation.mutate({
      email: data.email,
      password: data.password,
      selectedNodeId: selectedNodeId
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
      const node = findNodeById(nodeId);
      const email = getEmailForNode(node);
      loginMutation.mutate({
        email: email,
        password: "Password123",
        selectedNodeId: nodeId
      });
    }, 100);
  };

  // Resolve current preview node
  const previewNode = findNodeById(selectedNodeId);

  // Tiers layout configuration
  const tierConfig = [
    { key: "HQ", label: "HQ", icon: Shield },
    { key: "ZONE", label: "Zone", icon: Building },
    { key: "RANGE", label: "Range", icon: Compass },
    { key: "DISTRICT", label: "District", icon: MapPin },
    { key: "PS", label: "Station", icon: Activity },
  ];

  return (
    <div className="login-split-container">
      {/* Left Panel: Branding */}
      <div className="login-branding-panel">
        <div className="branding-header">
          <img src={delhiPoliceLogo} alt="Delhi Police Crest" className="branding-crest-img" />
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
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="login-card-glass"
        >
          {/* Mobile Crest Header */}
          <div className="login-header-logo-mobile">
            <img src={delhiPoliceLogo} alt="Delhi Police Crest" className="w-16 h-16 mb-2" />
            <h2 className="text-xl font-bold text-white">PRISM</h2>
            <span className="text-xs text-slate-400">Police Reporting, Intelligence & Statistics Management</span>
          </div>

          <div className="text-center">
            <h1 className="login-card-title">PRISM Authorization Console</h1>
            <p className="login-card-subtitle mt-1">Select your command tier to authorize terminal</p>
          </div>

          {/* Tier Tabs Selector */}
          <div className="login-tier-tabs">
            {tierConfig.map((tier) => {
              const Icon = tier.icon;
              return (
                <button
                  key={tier.key}
                  type="button"
                  onClick={() => setActiveTier(tier.key)}
                  className={`login-tier-tab ${activeTier === tier.key ? 'active' : ''}`}
                >
                  <Icon size={14} />
                  <span>{tier.label}</span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Hierarchy Dropdowns */}
          <div className="flex flex-col gap-3">
            {/* Zone Selector */}
            {activeTier === "ZONE" && (
              <div className="login-form-group">
                <label>Select L&O Zone</label>
                <select
                  value={selectedNodeId}
                  onChange={(e) => setSelectedNodeId(e.target.value)}
                  className="login-select-field"
                >
                  {zones.map(z => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Range Selector */}
            {activeTier === "RANGE" && (
              <div className="login-form-group">
                <label>Select Jt. CP Range</label>
                <select
                  value={selectedNodeId}
                  onChange={(e) => setSelectedNodeId(e.target.value)}
                  className="login-select-field"
                >
                  {ranges.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* District Selector */}
            {activeTier === "DISTRICT" && (
              <div className="login-form-group">
                <label>Select District DCP Jurisdiction</label>
                <select
                  value={selectedNodeId}
                  onChange={(e) => setSelectedNodeId(e.target.value)}
                  className="login-select-field"
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
                <div className="login-form-group">
                  <label>Select District</label>
                  <select
                    value={selectedDistrictId}
                    onChange={(e) => setSelectedDistrictId(e.target.value)}
                    className="login-select-field"
                  >
                    {districts.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="login-form-group">
                  <label>Select Police Station</label>
                  <select
                    value={selectedNodeId}
                    onChange={(e) => setSelectedNodeId(e.target.value)}
                    className="login-select-field"
                  >
                    {(findNodeById(selectedDistrictId)?.children || []).map(ps => (
                      <option key={ps.id} value={ps.id}>{ps.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Officer Profile Live Preview */}
          {previewNode && (
            <div className="officer-preview-card">
              <div className="officer-preview-badge">
                <UserCheck size={16} />
              </div>
              <div className="officer-preview-info">
                <span className="officer-preview-label">{previewNode.rank}</span>
                <span className="officer-preview-name">{previewNode.officerName}</span>
                <span className="officer-preview-sub">ID: {previewNode.pis} · {previewNode.name}</span>
              </div>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <div className="login-form-group">
              <label>Official Email</label>
              <input
                id="login-email"
                type="email"
                readOnly
                placeholder="officer@delhipolice.gov.in"
                className="login-input-field cursor-not-allowed opacity-80"
                {...register('email')}
              />
              {errors.email && <span className="text-xs text-red-400">{errors.email.message}</span>}
            </div>

            <div className="login-form-group">
              <label>Security Key / Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="login-input-field pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <span className="text-xs text-red-400">{errors.password.message}</span>}
            </div>

            {/* Audit Warning */}
            <div className="security-notice-box flex gap-2">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
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
              <Lock size={14} />
              <span>{loginMutation.isPending ? 'Authorizing Session...' : 'Establish Secure Connection'}</span>
            </button>
          </form>

          {/* Quick-Access Demo Profiles */}
          <div className="quick-profiles-section">
            <span className="quick-profiles-label">Quick Demo Access</span>
            <div className="quick-profile-grid">
              <div
                onClick={() => handleQuickLogin("HQ", null, "HQ")}
                className="quick-profile-card"
              >
                <div className="quick-profile-avatar">HQ</div>
                <span className="quick-profile-role">Headquarters</span>
                <span className="quick-profile-name">DGP Vikram Singh</span>
              </div>

              <div
                onClick={() => handleQuickLogin("DISTRICT", "DIST_CD", "DIST_CD")}
                className="quick-profile-card"
              >
                <div className="quick-profile-avatar">DCP</div>
                <span className="quick-profile-role">Central District</span>
                <span className="quick-profile-name">DCP H. Vardhan</span>
              </div>

              <div
                onClick={() => handleQuickLogin("PS", "DIST_NDD", "PS_NDD_PARLIAMENT_STREET")}
                className="quick-profile-card"
              >
                <div className="quick-profile-avatar">PS</div>
                <span className="quick-profile-role">Parliament St</span>
                <span className="quick-profile-name">HC Ramesh Kumar</span>
              </div>
            </div>
          </div>
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
