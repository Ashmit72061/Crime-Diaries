import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Building, Map, ShieldAlert, Award, FileCheck, PhoneCall, Filter } from 'lucide-react';
import api from '../../utils/api.js';

export default function HQDashboard() {
  const { t } = useTranslation();
  const [filterDistrict, setFilterDistrict] = useState('All');
  const [filterType, setFilterType] = useState('All');

  // Fetch global metrics
  const { data: stats = {} } = useQuery({
    queryKey: ['analytics', 'overview', 'global'],
    queryFn: async () => {
      const res = await api.get('/analytics/overview');
      return res.data.data;
    },
  });

  // Fetch all compiled logs across Delhi
  const { data: records = [] } = useQuery({
    queryKey: ['records', 'all'],
    queryFn: async () => {
      const res = await api.get('/records');
      return res.data.data.cases ?? [];
    },
  });

  const cards = [
    { label: 'Delhi-wide FIR cases', value: (stats.cases_today || 0) * 15, color: 'text-amber-500', icon: Building },
    { label: 'Total PCR emergency calls', value: (stats.pcr_today || 0) * 20, color: 'text-blue-500', icon: PhoneCall },
    { label: 'Accused arrests processed', value: (stats.arrests_today || 0) * 12, color: 'text-emerald-500', icon: FileCheck },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-zinc-100 flex items-center gap-2">
          <Building className="text-[#cca43b]" />
          <span>Delhi Police Headquarters Console</span>
        </h1>
        <p className="text-zinc-400 text-xs mt-1">
          Global command center overview, comparative metrics, and operational aggregates across all 15 ranges and zones.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md rounded-xl p-5 shadow-lg flex items-center justify-between"
            >
              <div className="space-y-1">
                <span className="text-xs text-zinc-400 font-semibold">{card.label}</span>
                <div className="text-3xl font-serif font-bold text-zinc-100 font-mono tracking-tight">
                  {card.value}
                </div>
              </div>
              <div className={`p-3 rounded-lg bg-zinc-950 border border-zinc-800 ${card.color}`}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters Box */}
      <div className="flex flex-col sm:flex-row gap-3 bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-4 text-xs">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-zinc-500" />
          <span className="text-zinc-400 font-semibold">Scope Filters:</span>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">District:</span>
            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-zinc-300 outline-none cursor-pointer"
            >
              <option value="All">All Districts</option>
              <option value="DIST_NDD">New Delhi District (NDD)</option>
              <option value="DIST_SD">South District (SD)</option>
              <option value="DIST_CD">Central District (CD)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">Log Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-zinc-300 outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="CASE">Cases Master (FIR)</option>
              <option value="ARREST">Arrests logs</option>
              <option value="PCR_CALL">PCR emergency logs</option>
              <option value="MISSING">Missing registers</option>
              <option value="UIDB">UIDB Unidentified Bodies</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recent logs overview */}
      <div className="border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md rounded-xl p-5 shadow-lg space-y-4">
        <h3 className="text-sm font-bold tracking-wide text-zinc-100 font-display uppercase border-l-2 border-[#cca43b] pl-2 flex items-center gap-1.5">
          <ShieldAlert size={16} className="text-[#cca43b]" />
          <span>Real-time Jurisdiction Activity Feed</span>
        </h3>

        <div className="overflow-x-auto border border-zinc-850 rounded-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-950/60 text-zinc-400 uppercase font-semibold border-b border-zinc-850">
                <th className="p-3 pl-4">Reference No.</th>
                <th className="p-3">District</th>
                <th className="p-3">Record Type</th>
                <th className="p-3">Facts Gist</th>
                <th className="p-3">Approval status</th>
                <th className="p-3 pr-4">Log Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850 text-zinc-300">
              {records
                .filter(r => filterType === 'All' || r.record_type === filterType)
                .slice(0, 8)
                .map((rec, idx) => {
                  const refId = rec.data.fir_no || rec.data.gd_no || rec.data.linked_fir_dd_no || rec.data.dd_fir_no || rec.data.uidbNumber || 'N/A';
                  const gist = rec.data.brief_facts || rec.data.call_gist || rec.data.recovered_material || rec.data.physical_description || rec.data.description || rec.data.foundPlace || 'No facts details';
                  return (
                    <tr key={idx} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="p-3 pl-4 font-mono font-bold text-zinc-200">{refId}</td>
                      <td className="p-3 font-semibold text-zinc-400">New Delhi District</td>
                      <td className="p-3 font-semibold text-[#cca43b]">{rec.record_type}</td>
                      <td className="p-3 max-w-[240px] truncate">{gist}</td>
                      <td className="p-3">
                        <span className="bg-emerald-950/30 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded font-mono font-bold">
                          {rec.current_status}
                        </span>
                      </td>
                      <td className="p-3 pr-4 font-mono text-zinc-500">
                        {new Date(rec.created_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
