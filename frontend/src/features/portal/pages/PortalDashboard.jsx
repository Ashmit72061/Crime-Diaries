import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore.js';
import { ROUTES } from '../../../utils/constants.js';
import axios from 'axios';
import { 
  Plus, FileText, ShieldAlert, PhoneCall, UserMinus, 
  ChevronRight, Calendar, Layers, MapPin, AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';

export const PortalDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [summary, setSummary] = useState({ cases: 0, arrests: 0, pcr: 0, missing: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/v1/analytics/summary');
        setSummary(response.data.data.summary);
      } catch (err) {
        toast.error('Failed to retrieve daily summaries.');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const stats = [
    { label: 'Cases (FIRs)', count: summary.cases, icon: FileText, color: 'from-blue-600/20 to-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', path: ROUTES.CASES },
    { label: 'Arrests Master', count: summary.arrests, icon: ShieldAlert, color: 'from-red-600/20 to-red-500/10', border: 'border-red-500/30', text: 'text-red-400', path: ROUTES.ARRESTS },
    { label: 'PCR & Kalandra', count: summary.pcr, icon: PhoneCall, color: 'from-amber-600/20 to-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', path: ROUTES.PCR },
    { label: 'Missing / Recovered', count: summary.missing, icon: UserMinus, color: 'from-emerald-600/20 to-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', path: ROUTES.MISSING },
  ];

  const getRoleDesc = () => {
    if (!user) return '';
    switch(user.role) {
      case 'ps': return 'Police Station Data Entry Operator';
      case 'acp': return 'Sub-Divisional Assistant Commissioner';
      case 'dcp': return 'District Deputy Commissioner of Police';
      case 'hq': return 'Headquarters Chief Controller';
      case 'admin': return 'System Administrator';
      default: return 'User';
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome & Context Board */}
      <div className="glass-card p-6 md:p-8 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none"></div>
        <div className="space-y-2">
          <div className="text-zinc-500 text-xs font-semibold uppercase tracking-widest flex items-center gap-2">
            <Layers size={14} className="text-amber-500" />
            <span>Terminal Operational Dashboard</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100">
            Welcome, {user?.username}
          </h1>
          <p className="text-zinc-400 text-sm max-w-xl">
            You are signed in as a <span className="font-semibold text-zinc-200">{getRoleDesc()}</span>. 
            All submissions and revisions are tracked live on the secure ledger.
          </p>
        </div>

        {/* Info badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-400 shadow-md">
            <Calendar size={14} className="text-amber-500" />
            <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-400 shadow-md">
            <MapPin size={14} className="text-amber-500" />
            <span>
              {user?.role === 'hq' || user?.role === 'admin' ? 'Delhi' : `${user?.districtName || user?.district}`}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Add Section (PS Level Only) */}
      {user?.role === 'ps' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-zinc-300">
            Submit New Operational Entries
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link 
              to={`${ROUTES.CASES}/new`}
              className="flex items-center justify-between p-5 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 rounded-xl transition-all shadow-md group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 group-hover:bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center transition-colors">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="font-bold text-zinc-200 text-sm">Case Record</div>
                  <div className="text-zinc-500 text-xs">FIR / DD Entry</div>
                </div>
              </div>
              <Plus size={18} className="text-zinc-500 group-hover:text-amber-500 transition-colors" />
            </Link>

            <Link 
              to={`${ROUTES.ARRESTS}/new`}
              className="flex items-center justify-between p-5 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 rounded-xl transition-all shadow-md group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/10 group-hover:bg-red-500/20 text-red-400 rounded-lg flex items-center justify-center transition-colors">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <div className="font-bold text-zinc-200 text-sm">Arrest Entry</div>
                  <div className="text-zinc-500 text-xs">Detainee Info</div>
                </div>
              </div>
              <Plus size={18} className="text-zinc-500 group-hover:text-amber-500 transition-colors" />
            </Link>

            <Link 
              to={`${ROUTES.PCR}/new`}
              className="flex items-center justify-between p-5 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 rounded-xl transition-all shadow-md group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center transition-colors">
                  <PhoneCall size={20} />
                </div>
                <div>
                  <div className="font-bold text-zinc-200 text-sm">PCR Call</div>
                  <div className="text-zinc-500 text-xs">GD Kalandra</div>
                </div>
              </div>
              <Plus size={18} className="text-zinc-500 group-hover:text-amber-500 transition-colors" />
            </Link>

            <Link 
              to={`${ROUTES.MISSING}/new`}
              className="flex items-center justify-between p-5 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 rounded-xl transition-all shadow-md group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center transition-colors">
                  <UserMinus size={20} />
                </div>
                <div>
                  <div className="font-bold text-zinc-200 text-sm">Missing / Recovered</div>
                  <div className="text-zinc-500 text-xs">Unidentified Bodies</div>
                </div>
              </div>
              <Plus size={18} className="text-zinc-500 group-hover:text-amber-500 transition-colors" />
            </Link>
          </div>
        </div>
      )}

      {/* Scoped Aggregated Counts */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-300">
          Daily Submitted Statistics (Current Scope)
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="h-32 bg-zinc-900/30 border border-zinc-850 animate-pulse rounded-2xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link 
                  key={stat.label} 
                  to={stat.path}
                  className={`glass-card p-6 rounded-2xl border ${stat.border} bg-gradient-to-br ${stat.color} flex flex-col justify-between h-36 relative overflow-hidden`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider block">
                      {stat.label}
                    </span>
                    <Icon size={20} className={stat.text} />
                  </div>
                  <div className="mt-4">
                    <span className="text-4xl font-black text-zinc-100">{stat.count}</span>
                    <span className="text-zinc-500 text-xs block mt-1">Total submitted records</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Notice Bulletin / Information board */}
      <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl flex items-start gap-4 shadow-inner">
        <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg">
          <AlertCircle size={20} />
        </div>
        <div className="space-y-1">
          <div className="font-bold text-sm text-zinc-200">Legal Compliance & Security Audit Info</div>
          <p className="text-zinc-400 text-xs leading-relaxed">
            In compliance with the updated directive, there is no compile-and-forward gating step. 
            All submissions at the Police Station (PS) level immediately reflect live on the sub-divisional (ACP), 
            district (DCP), and Headquarters (HQ) analytics dashboards. Edits are locked at the PS level upon submission.
            Reclassifications by DCP are captured synchronously under the immutable audit logs.
          </p>
        </div>
      </div>
    </div>
  );
};
