import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { APP_NAME } from '../../utils/constants.js';

export const Footer = () => (
  <footer className="border-t border-zinc-850 bg-zinc-950 py-12 text-zinc-400">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

        {/* Brand */}
        <div className="col-span-1 md:col-span-2 flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-[#cca43b]" />
            <span className="font-bold text-zinc-100 font-display tracking-wider">{APP_NAME}</span>
          </div>
          <p className="text-sm text-zinc-500 max-w-sm leading-relaxed">
            Police Reporting, Intelligence & Statistics Management (PRISM) is an internal secure command portal operated by the IT Division, Delhi Police.
          </p>
          <div className="text-xs text-red-500/80 border border-red-900/20 bg-red-950/20 p-3 rounded-lg max-w-sm mt-2">
            <strong>Security Alert:</strong> Access is restricted strictly to authorized personnel of the Delhi Police. All session activities are monitored under Section 66 of IT Act, 2000.
          </div>
        </div>

        {/* Column 1: Helplines */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-200 mb-3 uppercase tracking-wider">Emergency Helplines</h3>
          <ul className="space-y-1.5 text-sm text-zinc-500">
            <li>National Emergency Support: <strong>112</strong></li>
            <li>Police Control Room: <strong>100</strong></li>
            <li>Women Helpline: <strong>1091</strong></li>
            <li>Special Anti-Harassment: <strong>1096</strong></li>
          </ul>
        </div>

        {/* Column 2: Government Links */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-200 mb-3 uppercase tracking-wider">Agency Portals</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="https://delhipolice.gov.in" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-[#cca43b] transition-colors">
                Delhi Police Official
              </a>
            </li>
            <li>
              <a href="https://mha.gov.in" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-[#cca43b] transition-colors">
                Ministry of Home Affairs
              </a>
            </li>
            <li>
              <a href="https://ncrb.gov.in" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-[#cca43b] transition-colors">
                NCRB India Portal
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-zinc-800/60 text-center text-xs text-zinc-600">
        <p>© {new Date().getFullYear()} Delhi Police, IT Division. Government of NCT of Delhi.</p>
        <p className="mt-1 text-zinc-700">Protected by national cyber law regulations. Unauthorized intrusion is subject to prosecution.</p>
      </div>
    </div>
  </footer>
);
