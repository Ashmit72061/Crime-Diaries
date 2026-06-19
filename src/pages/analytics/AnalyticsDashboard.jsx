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
  TrendingUp, AlertCircle, Radio,
} from 'lucide-react';
import api from '../../utils/api.js';

// ── Shared chart tooltip style ────────────────────────────────────────────────
const CHART_TOOLTIP = {
  contentStyle: {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    color: '#1A202C',
    fontSize: '11px',
    boxShadow: '0 4px 24px rgba(0,48,135,0.08)',
  },
  labelStyle: { color: '#4A5568', fontWeight: 600 },
  itemStyle:  { color: '#1A202C' },
};

const COLORS = ['#003087', '#D97706', '#059669', '#DC2626', '#7C3AED', '#0891B2', '#EA580C'];

// ── KPI Card Component ────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, color, sub }) {
  const tileMeta = {
    'text-amber-500':   { bg: 'bg-[#FFFBEB]', border: 'border-[#FDE68A]' },
    'text-emerald-500': { bg: 'bg-[#ECFDF5]', border: 'border-[#6EE7B7]' },
    'text-blue-500':    { bg: 'bg-[#EFF6FF]', border: 'border-[#BFDBFE]' },
    'text-violet-500':  { bg: 'bg-[#F5F3FF]', border: 'border-[#C4B5FD]' },
  };
  const tile = tileMeta[color] || { bg: 'bg-[#F0F4F9]', border: 'border-[#E2E8F0]' };
  return (
    <div className="group rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#003087]/5">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#718096]">{label}</span>
          <div className="text-3xl font-bold tabular-nums text-[#0A1628]">{value ?? '—'}</div>
          {sub && <span className="text-[10px] text-[#718096]">{sub}</span>}
        </div>
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border ${tile.border} ${tile.bg} transition-transform duration-200 group-hover:scale-110 ${color}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="mt-3 text-xs text-[#718096]">Last 30 days</div>
    </div>
  );
}

// ── Status Badge colours ───────────────────────────────────────────────────────
const STATUS_COLORS = {
  DRAFT:           'bg-[#F0F4F9]  text-[#718096] border-[#E2E8F0]',
  SENT_BACK_HC:    'bg-[#FEF2F2]  text-[#DC2626] border-[#FCA5A5]',
  PENDING_SHO:     'bg-[#FFFBEB]  text-[#D97706] border-[#FDE68A]',
  ACP_REVIEW:      'bg-[#FFF7ED]  text-[#EA580C] border-[#FDBA74]',
  DISTRICT_REVIEW: 'bg-[#EFF6FF]  text-[#003087] border-[#BFDBFE]',
  HQ_RECEIVED:     'bg-[#F5F3FF]  text-[#7C3AED] border-[#C4B5FD]',
  CLOSED:          'bg-[#ECFDF5]  text-[#059669] border-[#6EE7B7]',
  COMPILED:        'bg-[#ECFEFF]  text-[#0891B2] border-[#A5F3FC]',
};

// ── Progress bar colour per status ────────────────────────────────────────────
const STATUS_BAR = {
  DRAFT:           'bg-[#CBD5E0]',
  SENT_BACK_HC:    'bg-[#DC2626]',
  PENDING_SHO:     'bg-[#D97706]',
  ACP_REVIEW:      'bg-[#EA580C]',
  DISTRICT_REVIEW: 'bg-[#003087]',
  HQ_RECEIVED:     'bg-[#7C3AED]',
  CLOSED:          'bg-[#059669]',
  COMPILED:        'bg-[#0891B2]',
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
    { label: 'Cases (FIR)',     value: summary.CASES,   icon: FileText, color: 'text-amber-500',   sub: 'Submitted & above' },
    { label: 'Arrests',         value: summary.ARREST,  icon: Shield,   color: 'text-emerald-500', sub: 'In workflow' },
    { label: 'PCR Calls',       value: summary.PCR,     icon: Phone,    color: 'text-blue-500',    sub: 'In workflow' },
    { label: 'Missing Persons', value: summary.MISSING, icon: Search,   color: 'text-violet-500',  sub: 'In workflow' },
  ];

  // ── Shared panel section label ─────────────────────────────────────────────
  const SectionLabel = ({ children }) => (
    <div className="mb-5 flex items-center gap-3">
      <div className="h-5 w-1 rounded-full bg-gradient-to-b from-[#003087] to-[#0046C0]" />
      <h2 className="text-xs font-bold uppercase tracking-widest text-[#4A5568]">{children}</h2>
      <div className="h-px flex-1 bg-[#E2E8F0]" />
    </div>
  );

  // ── Shared empty-state ─────────────────────────────────────────────────────
  const EmptyState = ({ icon: EIcon, message }) => (
    <div className="flex h-full flex-col items-center justify-center gap-3 py-12">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E2E8F0] bg-[#F0F4F9]">
        <EIcon size={24} className="text-[#A0AEC0]" />
      </div>
      <p className="text-xs font-medium text-[#718096]">{message}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0F4F9] text-[#1A202C]">

      {/* ══════════════ HERO HEADER ══════════════ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0A1628] via-[#003087] to-[#0046C0] px-8 py-12">
        {/* Decorative blur orbs */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-1/3 h-56 w-56 rounded-full bg-[#0046C0]/50 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 right-1/4 h-28 w-28 rounded-full bg-white/5 blur-2xl" />
        {/* Grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,white 0,white 1px,transparent 1px,transparent 48px),repeating-linear-gradient(90deg,white 0,white 1px,transparent 1px,transparent 48px)' }}
        />

        <div className="relative z-10 mx-auto max-w-screen-xl">
          {/* Top badge row */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-white/80 backdrop-blur-sm">
              <BarChart3 size={12} className="text-amber-400" />
              DELHI POLICE · OPERATIONAL ANALYTICS
            </span>
            <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-4 py-1.5 backdrop-blur-sm">
              <Radio size={11} className="animate-pulse text-emerald-400" />
              <span className="text-xs font-semibold tracking-wide text-emerald-300">LIVE METRICS</span>
            </div>
          </div>

          {/* Heading + period toggle */}
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-white">
                Operational Analytics
              </h1>
              <p className="mt-1 text-xl font-medium tracking-wide text-white/40">
                Command Console
              </p>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/55">
                Live jurisdiction-scoped metrics, category breakdowns, workflow status distribution, and station comparative performance.
              </p>
            </div>

            {/* Period toggle — same logic, reskinned */}
            <div className="flex flex-shrink-0 items-center gap-1.5 self-start rounded-2xl border border-white/20 bg-white/10 p-1.5 backdrop-blur-sm xl:self-end">
              <div className="flex items-center pl-2 pr-1">
                <Calendar size={13} className="text-white/50" />
              </div>
              {['daily', 'weekly', 'monthly'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-xl px-4 py-1.5 text-xs font-semibold capitalize cursor-pointer transition-all duration-150 ${
                    period === p
                      ? 'bg-white text-[#003087] shadow-sm'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom separator */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* ══════════════ PAGE BODY ══════════════ */}
      <div className="mx-auto max-w-screen-xl px-6 pb-12">

        {/* ── KPI Cards ── */}
        <div className="mt-8">
          <SectionLabel>Summary KPIs</SectionLabel>
          {summaryLoading ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl border border-[#E2E8F0] bg-white shadow-sm" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {kpiCards.map((card) => (
                <KpiCard key={card.label} {...card} />
              ))}
            </div>
          )}
        </div>

        {/* ── Main Charts Row ── */}
        <div className="mt-8">
          <SectionLabel>Incident Analysis</SectionLabel>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

            {/* Crime Head Breakdown — Donut */}
            <div className="overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#003087]/5">
              <div className="relative flex items-center gap-3 border-b border-[#E2E8F0] bg-gradient-to-r from-[#F8FAFF] to-white px-6 py-4">
                <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b from-[#003087] to-[#0046C0]" />
                <div className="ml-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#003087] to-[#0046C0] shadow-md shadow-blue-500/20">
                  <PieIcon size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1A202C]">Category Incident Ratios</p>
                  <p className="text-xs text-[#718096]">Crime head breakdown · Donut view</p>
                </div>
              </div>
              <div className="p-5">
                {categoryData.length === 0 ? (
                  <EmptyState icon={AlertCircle} message="No category data available" />
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
                        <Legend wrapperStyle={{ fontSize: '10px', color: '#718096' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Combined Time-Series Trends — Line */}
            <div className="overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#003087]/5">
              <div className="relative flex items-center gap-3 border-b border-[#E2E8F0] bg-gradient-to-r from-[#F8FAFF] to-white px-6 py-4">
                <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b from-[#003087] to-[#0046C0]" />
                <div className="ml-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#003087] to-[#0046C0] shadow-md shadow-blue-500/20">
                  <LineIcon size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1A202C]">Daily Activity Timeline</p>
                  <p className="text-xs text-[#718096]">Combined trends · {period} view</p>
                </div>
              </div>
              <div className="p-5">
                {trendData.length === 0 ? (
                  <EmptyState icon={TrendingUp} message="No trend data available" />
                ) : (
                  <div className="h-[280px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="name" stroke="#A0AEC0" fontSize={9} tickLine={false} />
                        <YAxis stroke="#A0AEC0" fontSize={10} tickLine={false} />
                        <Tooltip {...CHART_TOOLTIP} />
                        <Legend wrapperStyle={{ fontSize: '10px', color: '#718096' }} />
                        <Line type="monotone" dataKey="cases"   name="FIR Cases" stroke="#D97706" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#D97706' }} />
                        <Line type="monotone" dataKey="pcr"     name="PCR Calls" stroke="#003087" strokeWidth={2}   dot={false} activeDot={{ r: 4, fill: '#003087' }} />
                        <Line type="monotone" dataKey="arrests" name="Arrests"   stroke="#059669" strokeWidth={2}   dot={false} activeDot={{ r: 4, fill: '#059669' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Row: Status + Station Bar ── */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Workflow Status Distribution */}
          <div className="overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#003087]/5">
            <div className="relative flex items-center gap-3 border-b border-[#E2E8F0] bg-gradient-to-r from-[#F8FAFF] to-white px-6 py-4">
              <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b from-[#003087] to-[#0046C0]" />
              <div className="ml-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#003087] to-[#0046C0] shadow-md shadow-blue-500/20">
                <Activity size={14} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1A202C]">Workflow Status Distribution</p>
                <p className="text-xs text-[#718096]">{statusData.length} status stages · All record types</p>
              </div>
            </div>
            <div className="p-5">
              {statusData.length === 0 ? (
                <EmptyState icon={AlertCircle} message="No status data available" />
              ) : (
                <div className="max-h-[240px] space-y-3 overflow-y-auto pr-1 pt-1">
                  {statusData.map((row) => {
                    const total = statusData.reduce((s, r) => s + r.count, 0) || 1;
                    const pct = Math.round((row.count / total) * 100);
                    const cls = STATUS_COLORS[row.status] || 'bg-[#F0F4F9] text-[#718096] border-[#E2E8F0]';
                    const bar = STATUS_BAR[row.status]  || 'bg-[#003087]';
                    return (
                      <div key={row.status} className="group flex items-center gap-3 rounded-xl border border-transparent px-2 py-1.5 text-xs transition-all duration-150 hover:border-[#E2E8F0] hover:bg-[#F8FAFF]">
                        <span className={`inline-flex w-36 flex-shrink-0 justify-center rounded-lg border px-2 py-1 text-[10px] font-bold ${cls}`}>
                          {row.status}
                        </span>
                        <div className="flex-1 h-2 overflow-hidden rounded-full bg-[#F0F4F9]">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${bar}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-10 text-right font-mono font-semibold tabular-nums text-[#4A5568]">
                          {row.count}
                        </span>
                        <span className="w-8 text-right font-mono text-[#A0AEC0]">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Station Comparative Performance */}
          <div className="overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#003087]/5">
            <div className="relative flex items-center gap-3 border-b border-[#E2E8F0] bg-gradient-to-r from-[#F8FAFF] to-white px-6 py-4">
              <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b from-[#003087] to-[#0046C0]" />
              <div className="ml-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#003087] to-[#0046C0] shadow-md shadow-blue-500/20">
                <BarChart3 size={14} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1A202C]">Station Comparative Performance</p>
                <p className="text-xs text-[#718096]">Top {Math.min(8, stationData.length)} stations · Cases, Arrests, PCR</p>
              </div>
            </div>
            <div className="p-5">
              {stationData.length === 0 ? (
                <EmptyState icon={AlertCircle} message="No station data available" />
              ) : (
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stationData.slice(0, 8)} margin={{ top: 4, right: 4, left: -20, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis
                        dataKey="station"
                        stroke="#A0AEC0"
                        fontSize={8}
                        tickLine={false}
                        angle={-35}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis stroke="#A0AEC0" fontSize={10} tickLine={false} />
                      <Tooltip {...CHART_TOOLTIP} />
                      <Legend wrapperStyle={{ fontSize: '10px', color: '#718096' }} />
                      <Bar dataKey="cases"   name="Cases"   fill="#D97706" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="arrests" name="Arrests" fill="#059669" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pcr"     name="PCR"     fill="#003087" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="h-px w-20 bg-[#E2E8F0]" />
          <p className="text-xs font-medium text-[#A0AEC0]">
            Delhi Police Command System · Data refreshes on page load · All times IST
          </p>
          <div className="h-px w-20 bg-[#E2E8F0]" />
        </div>
      </div>
    </div>
  );
}