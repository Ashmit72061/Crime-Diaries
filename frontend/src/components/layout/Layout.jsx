import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore.js';
import { ROUTES } from '../../utils/constants.js';
import { 
  Shield, Menu, X, LayoutDashboard, FileText, UserMinus, PhoneCall, 
  MapPin, BarChart3, History, Settings, LogOut, ShieldAlert
} from 'lucide-react';

export const Layout = ({ children }) => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const navItems = [
    { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard, roles: ['ps', 'acp', 'dcp', 'hq', 'admin'] },
    { label: 'Cases (FIR)', path: ROUTES.CASES, icon: FileText, roles: ['ps', 'acp', 'dcp', 'hq', 'admin'] },
    { label: 'Arrests Master', path: ROUTES.ARRESTS, icon: ShieldAlert, roles: ['ps', 'acp', 'dcp', 'hq', 'admin'] },
    { label: 'PCR & Kalandra', path: ROUTES.PCR, icon: PhoneCall, roles: ['ps', 'acp', 'dcp', 'hq', 'admin'] },
    { label: 'Missing / Recovered', path: ROUTES.MISSING, icon: UserMinus, roles: ['ps', 'acp', 'dcp', 'hq', 'admin'] },
    { label: 'Analytics & Reports', path: ROUTES.ANALYTICS, icon: BarChart3, roles: ['ps', 'acp', 'dcp', 'hq', 'admin'] },
    { label: 'Audit Logs', path: ROUTES.AUDIT_LOGS, icon: History, roles: ['hq', 'admin'] },
    { label: 'Administration', path: ROUTES.ADMIN_PANEL, icon: Settings, roles: ['admin', 'dcp', 'hq'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role));

  const getJurisdictionLabel = () => {
    if (!user) return '';
    if (user.role === 'hq') return 'Delhi Police HQ';
    if (user.role === 'admin') return 'System Administrator';
    if (user.role === 'dcp') return `${user.district} District (DCP)`;
    if (user.role === 'acp') return `${user.subDivision} Sub-Div (ACP)`;
    if (user.role === 'ps') return `${user.policeStationName || user.policeStation} (PS)`;
    return '';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Header Navbar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-6 z-40">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-amber-500"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Shield size={20} className="text-zinc-950" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-zinc-100 block md:inline">DELHI POLICE</span>
              <span className="text-zinc-500 text-[10px] md:text-xs ml-0 md:ml-2 font-medium md:border-l md:border-zinc-800 pl-0 md:pl-2 block md:inline">
                Operational Reporting Portal
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Active Scope Flag */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/60 rounded-full border border-zinc-700/50 text-xs text-amber-500 font-medium">
            <MapPin size={14} />
            <span>{getJurisdictionLabel()}</span>
          </div>

          <div className="flex items-center gap-3 pl-3 border-l border-zinc-800">
            <div className="text-right hidden md:block">
              <div className="font-semibold text-zinc-200 text-sm">{user?.username}</div>
              <div className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{user?.role}</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-amber-500">
              {user?.username?.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 pt-16">
        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/45 backdrop-blur-xs z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`fixed top-16 bottom-0 left-0 bg-zinc-900 border-r border-zinc-800 transition-all duration-300 z-30 flex flex-col ${sidebarOpen ? 'w-64' : 'w-0 -translate-x-full'}`}>
          <div className="flex-1 py-6 overflow-y-auto px-4 space-y-1">
            <div className="px-3 mb-2 text-zinc-600 text-xs font-bold uppercase tracking-wider">
              Navigation
            </div>
            
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleLinkClick}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${isActive ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'}`}
                >
                  <Icon size={18} className={isActive ? 'text-zinc-950' : 'text-zinc-400 group-hover:text-amber-500 transition-colors'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Footer Action */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
            >
              <LogOut size={18} />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className={`flex-1 min-h-[calc(100vh-4rem)] p-6 md:p-8 bg-zinc-950 transition-all duration-300 ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-0'}`}>
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
