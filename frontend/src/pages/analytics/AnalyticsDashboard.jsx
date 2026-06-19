import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  BarChart3, LineChart as LineIcon, PieChart as PieIcon,
  Calendar, FileText, Shield, Phone, Search, Activity,
  TrendingUp, AlertCircle,
} from 'lucide-react';
import api from '../../utils/api.js';

// ── Shared chart tooltip style ────────────────────────────────────────────────
const CHART_TOOLTIP = {
  contentStyle: {
    background: '#18181b',
    border: '1px solid #3f3f46',
    borderRadius: '8px',
    color: '#f4f4f5',
    fontSize: '11px',
  },
};

const COLORS = ['#cca43b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b', '#06b6d4'];

// ── KPI Card Component ────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md rounded-xl p-5 shadow-lg flex items-center justify-between gap-4">
      <div className="space-y-1">
        <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">{label}</span>
        <div className="text-3xl font-serif font-bold text-zinc-100 tabular-numbers">{value ?? '—'}</div>
        {sub && <span className="text-[10px] text-zinc-500">{sub}</span>}
      </div>
      <div className={`p-3 rounded-lg bg-zinc-950 border border-zinc-800 ${color}`}>
        <Icon size={20} />
      </div>
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  DRAFT:           'bg-zinc-800 text-zinc-400 border-zinc-700',
  SENT_BACK_HC:    'bg-red-950/40 text-red-400 border-red-800/40',
  PENDING_SHO:     'bg-amber-950/40 text-amber-400 border-amber-800/40',
  ACP_REVIEW:      'bg-orange-950/40 text-orange-400 border-orange-800/40',
  DISTRICT_REVIEW: 'bg-blue-950/40 text-blue-400 border-blue-800/40',
  HQ_RECEIVED:     'bg-violet-100 text-violet-800 border-violet-300',
  CLOSED:          'bg-emerald-950/40 text-emerald-400 border-emerald-800/40',
  COMPILED:        'bg-cyan-950/40 text-cyan-400 border-cyan-800/40',
};

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState('weekly');

  // ── 1. Summary KPI data: GET /analytics/summary ───────────────────────────
  const { data: summary = {}, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: async () => {
      const res = await api.get('/analytics/summary');
      // Backend returns { success: true, data: { summary: { CASES, ARREST, PCR, MISSING } } }
      return res.data?.data?.summary ?? {};
    },
  });

  // ── 2. Crime Category breakdown: GET /analytics/by-crime-head ────────────
  const { data: categoryData = [] } = useQuery({
    queryKey: ['analytics', 'by-crime-head'],
    queryFn: async () => {
      const res = await api.get('/analytics/by-crime-head');
      // Returns { success: true, data: [{ name, count }] }
      return Array.isArray(res.data?.data) ? res.data.data : [];
    },
  });

  // ── 3. Combined time-series trends: GET /analytics/trends ────────────────
  // No recordType → getCombinedTrends → returns [{ name, cases, pcr, arrests }]
  const { data: trendData = [] } = useQuery({
    queryKey: ['analytics', 'trends', period],
    queryFn: async () => {
      const res = await api.get('/analytics/trends');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    },
  });

  // ── 4. Status breakdown: GET /analytics/status-breakdown ─────────────────
  const { data: statusData = [] } = useQuery({
    queryKey: ['analytics', 'status-breakdown'],
    queryFn: async () => {
      const res = await api.get('/analytics/status-breakdown');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    },
  });

  // ── 5. Station comparison: GET /analytics/by-ps ──────────────────────────
  const { data: stationData = [] } = useQuery({
    queryKey: ['analytics', 'by-ps'],
    queryFn: async () => {
      const res = await api.get('/analytics/by-ps');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    },
  });

  const kpiCards = [
    { label: 'Cases (FIR)',    value: summary.CASES,   icon: FileText,  color: 'text-amber-500',   sub: 'Submitted & above' },
    { label: 'Arrests',        value: summary.ARREST,  icon: Shield,    color: 'text-emerald-500', sub: 'In workflow' },
    { label: 'PCR Calls',      value: summary.PCR,     icon: Phone,     color: 'text-blue-500',    sub: 'In workflow' },
    { label: 'Missing Persons', value: summary.MISSING, icon: Search,    color: 'text-violet-500',  sub: 'In workflow' },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-zinc-100 flex items-center gap-2">
            <BarChart3 className="text-[#cca43b]" />
            <span>Operational Analytics Console</span>
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Live jurisdiction-scoped metrics, category breakdowns, workflow status distribution, and station comparative performance.
          </p>
        </div>

        {/* Period toggle (kept for future per-type trend filtering) */}
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-xs">
          <Calendar size={14} className="text-zinc-500 ml-1" />
          {['daily', 'weekly', 'monthly'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded font-semibold cursor-pointer capitalize ${
                period === p ? 'bg-[#cca43b] text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Summary KPI Cards ───────────────────────────────────────────────── */}
      {summaryLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border border-zinc-800 bg-zinc-900/40 rounded-xl p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card) => (
            <KpiCard key={card.label} {...card} />
          ))}
        </div>
      )}

      {/* ── Main Charts Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crime Head Breakdown — Donut */}
        <div className="border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold tracking-wide text-zinc-100 font-display uppercase border-l-2 border-[#cca43b] pl-2 flex items-center gap-2">
            <PieIcon size={16} className="text-[#cca43b]" />
            <span>Category Incident Ratios</span>
          </h3>
          {categoryData.length === 0 ? (
            <div className="h-[280px] flex flex-col items-center justify-center text-zinc-600">
              <AlertCircle size={32} className="mb-2 opacity-30" />
              <p className="text-xs">No category data available</p>
            </div>
          ) : (
            <div className="h-[280px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="name"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Combined Time-Series Trends — Line */}
        <div className="border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold tracking-wide text-zinc-100 font-display uppercase border-l-2 border-[#cca43b] pl-2 flex items-center gap-2">
            <LineIcon size={16} className="text-[#cca43b]" />
            <span>Daily Activity Timeline</span>
          </h3>
          {trendData.length === 0 ? (
            <div className="h-[280px] flex flex-col items-center justify-center text-zinc-600">
              <TrendingUp size={32} className="mb-2 opacity-30" />
              <p className="text-xs">No trend data available</p>
            </div>
          ) : (
            <div className="h-[280px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#a1a1aa" fontSize={9} tickLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} />
                  <Tooltip {...CHART_TOOLTIP} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Line type="monotone" dataKey="cases" name="FIR Cases" stroke="#eab308" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="pcr" name="PCR Calls" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="arrests" name="Arrests" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Row: Status Breakdown + Station Bar ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workflow Status Distribution */}
        <div className="border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold tracking-wide text-zinc-100 font-display uppercase border-l-2 border-[#cca43b] pl-2 flex items-center gap-2">
            <Activity size={16} className="text-[#cca43b]" />
            <span>Workflow Status Distribution</span>
          </h3>
          {statusData.length === 0 ? (
            <div className="h-[220px] flex flex-col items-center justify-center text-zinc-600">
              <AlertCircle size={32} className="mb-2 opacity-30" />
              <p className="text-xs">No status data available</p>
            </div>
          ) : (
            <div className="space-y-2 pt-2 max-h-[220px] overflow-y-auto pr-1">
              {statusData.map((row) => {
                const total = statusData.reduce((s, r) => s + r.count, 0) || 1;
                const pct = Math.round((row.count / total) * 100);
                const cls = STATUS_COLORS[row.status] || 'bg-zinc-800 text-zinc-400 border-zinc-700';
                return (
                  <div key={row.status} className="flex items-center gap-3 text-xs">
                    <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded border ${cls} shrink-0 w-36 justify-center`}>
                      {row.status}
                    </span>
                    <div className="flex-1 h-2 bg-zinc-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#cca43b] rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="tabular-numbers text-zinc-400 w-10 text-right font-mono">{row.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Station Comparative Performance */}
        <div className="border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold tracking-wide text-zinc-100 font-display uppercase border-l-2 border-[#cca43b] pl-2 flex items-center gap-2">
            <BarChart3 size={16} className="text-[#cca43b]" />
            <span>Station Comparative Performance</span>
          </h3>
          {stationData.length === 0 ? (
            <div className="h-[220px] flex flex-col items-center justify-center text-zinc-600">
              <AlertCircle size={32} className="mb-2 opacity-30" />
              <p className="text-xs">No station data available</p>
            </div>
          ) : (
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stationData.slice(0, 8)} margin={{ top: 4, right: 4, left: -20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="station"
                    stroke="#a1a1aa"
                    fontSize={8}
                    tickLine={false}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} />
                  <Tooltip {...CHART_TOOLTIP} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="cases" name="Cases" fill="#cca43b" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="arrests" name="Arrests" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="pcr" name="PCR" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
