import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore.js';
import { ROUTES } from '../../utils/constants.js';
import { Shield, Lock, User, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { token, login, loading, error: authError } = useAuthStore();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (token) {
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.error('Please fill in all credentials.');
      return;
    }

    const result = await login(username, password);
    if (result.success) {
      toast.success('Access Granted. Welcome to the portal.');
      navigate(ROUTES.DASHBOARD);
    } else {
      toast.error(result.error || 'Authentication failed.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 selection:bg-amber-500/20 selection:text-amber-200">
      {/* Visual background glowing orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
      
      <div className="w-full max-w-md z-10 space-y-8">
        {/* Delhi Police Crest Branding */}
        <div className="text-center space-y-4">
          <div className="inline-flex w-16 h-16 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-2xl items-center justify-center shadow-2xl shadow-amber-500/20 border border-amber-400/30">
            <Shield size={36} className="text-zinc-950" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-100 uppercase">
              DELHI POLICE
            </h1>
            <p className="text-zinc-500 text-sm font-medium mt-1">
              Daily Operational Reporting System
            </p>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="glass-card p-8 rounded-2xl shadow-2xl border border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-200 mb-6 text-center border-b border-zinc-800 pb-3">
            Secure Terminal Sign-In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                Username / Badge ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-zinc-900/50 border border-zinc-800 focus:border-amber-500 rounded-xl text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30 text-sm transition-all"
                  placeholder="e.g. ps_adarsh_nagar"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                Access Code / Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-zinc-900/50 border border-zinc-800 focus:border-amber-500 rounded-xl text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30 text-sm transition-all"
                  placeholder="••••••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 rounded-lg text-center font-medium">
                {authError}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Authenticate Session</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer info notices */}
        <div className="text-center text-xs text-zinc-600">
          <p>AUTHORIZED DELHI POLICE PERSONNEL ONLY</p>
          <p className="mt-1">All session activity is logged under IPC regulations.</p>
        </div>

        {/* Demo Credentials Helper */}
        <div className="mt-8 bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl text-xs text-zinc-400">
          <p className="font-bold text-amber-500 mb-2">Demo Credentials (Password: password123)</p>
          <ul className="space-y-1">
            <li><span className="text-zinc-200 font-mono">ps_adarsh_nagar</span> : Station Officer (Input Data)</li>
            <li><span className="text-zinc-200 font-mono">acp_nwd_1</span> : ACP (View NWD Sub-Division)</li>
            <li><span className="text-zinc-200 font-mono">dcp_nwd</span> : DCP (View NWD District & Overrides)</li>
            <li><span className="text-zinc-200 font-mono">hq_user</span> : Headquarters (Global Analytics)</li>
            <li><span className="text-zinc-200 font-mono">admin_user</span> : Administrator (Config)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
