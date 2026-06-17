import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Shield, BookOpen, FileCheck, PhoneCall, TrendingUp, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../utils/api.js';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 95, damping: 14 } }
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-xl p-4 min-w-[180px] transition-all">
        <p className="text-xs font-extrabold text-slate-800 mb-2 font-display uppercase tracking-wider">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => {
            const dotColor = entry.name === 'FIR Cases' ? '#cca43b' : entry.name === 'PCR Calls' ? '#0f52ba' : '#16a34a';
            return (
              <div key={index} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dotColor }} />
                  {entry.name}
                </span>
                <span className="text-xs font-bold font-mono text-slate-800">{entry.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export default function DistrictDashboard() {
  const navigate = useNavigate();

  // Fetch Analytics Overview Cards
  const { data: stats = {} } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => {
      const res = await api.get('/analytics/overview');
      return res.data.data;
    },
  });

  // Fetch Station Breakdown Chart Data
  const { data: chartData = [] } = useQuery({
    queryKey: ['analytics', 'by-ps'],
    queryFn: async () => {
      const res = await api.get('/analytics/by-ps');
      return res.data.data;
    },
  });

  const cards = [
    { label: 'Total FIR Cases Registered', value: stats.cases_today || 0, color: 'text-amber-600', icon: Shield, change: '+12%', isUp: true },
    { label: 'PCR Response Dispatches', value: stats.pcr_today || 0, color: 'text-blue-600', icon: PhoneCall, change: '-4%', isUp: false },
    { label: 'Accused Arrests Filed', value: stats.arrests_today || 0, color: 'text-emerald-600', icon: FileCheck, change: '+8%', isUp: true },
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 font-display">
            <div className="crest-frame">
              <Shield className="text-[#cca43b]" size={20} />
            </div>
            <span>District DCP Command Console</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1 font-semibold">
            Aggregated operational statistics and crime logs spanning all Police Stations under district jurisdiction.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate('/compile')}
            className="bg-[#0d2a4a] hover:bg-[#16406d] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-900/10 hover:translate-y-[-1px] active:scale-[0.98]"
          >
            <BookOpen size={14} className="text-amber-400" />
            <span>Compile Daily Logs</span>
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-5"
      >
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="premium-glass-card p-6 flex items-center justify-between hover-scale cursor-pointer"
            >
              <div className="space-y-1.5">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider font-display">{card.label}</span>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-extrabold font-display text-slate-900 tracking-tight">
                    {card.value}
                  </div>
                  <span className={`text-xs font-bold flex items-center gap-0.5 ${card.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {card.isUp ? '↑' : '↓'} {card.change}
                  </span>
                </div>
              </div>
              <div className={`p-3.5 rounded-xl bg-slate-50 border border-slate-100 ${card.color} shadow-inner`}>
                <Icon size={22} />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Recharts Analytics Breakdown */}
      <motion.div 
        variants={itemVariants}
        className="premium-glass-card p-6 space-y-5"
      >
        <h3 className="text-sm font-bold tracking-wide text-slate-800 font-display uppercase border-l-3 border-[#cca43b] pl-3 flex items-center gap-2">
          <BarChart3 size={16} className="text-[#cca43b]" />
          <span>Station-wise Operational Volume comparison</span>
        </h3>

        <div className="h-[340px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="casesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#cca43b" />
                  <stop offset="100%" stopColor="#cca43b" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="pcrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f52ba" />
                  <stop offset="100%" stopColor="#0f52ba" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="arrestsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16a34a" />
                  <stop offset="100%" stopColor="#16a34a" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="station" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} className="font-semibold" />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dx={-10} className="font-semibold" />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', opacity: 0.5 }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '15px', fontWeight: 600, color: '#475569' }} />
              <Bar dataKey="cases" name="FIR Cases" fill="url(#casesGrad)" radius={[6, 6, 0, 0]} maxBarSize={30} />
              <Bar dataKey="pcr" name="PCR Calls" fill="url(#pcrGrad)" radius={[6, 6, 0, 0]} maxBarSize={30} />
              <Bar dataKey="arrests" name="Arrests" fill="url(#arrestsGrad)" radius={[6, 6, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>
  );
}
