import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Shield, BookOpen, FileCheck, PhoneCall, TrendingUp, BarChart3 } from 'lucide-react';
import api from '../../utils/api.js';

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
    { label: 'Total FIR Cases Registered', value: stats.cases_today || 0, color: 'text-amber-500', icon: Shield },
    { label: 'PCR Response Dispatches', value: stats.pcr_today || 0, color: 'text-blue-500', icon: PhoneCall },
    { label: 'Accused Arrests Filed', value: stats.arrests_today || 0, color: 'text-emerald-500', icon: FileCheck },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-zinc-100 flex items-center gap-2">
            <Shield className="text-[#cca43b]" />
            <span>District DCP Console</span>
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Aggregated operational statistics and crime logs spanning all Police Stations under district jurisdiction.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate('/compile')}
            className="bg-[#cca43b] hover:bg-amber-600 text-zinc-950 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <BookOpen size={14} />
            <span>Compile Daily Logs</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
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

      {/* Recharts Analytics Breakdown */}
      <div className="border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md rounded-xl p-5 shadow-lg space-y-4">
        <h3 className="text-sm font-bold tracking-wide text-zinc-100 font-display uppercase border-l-2 border-[#cca43b] pl-2 flex items-center gap-2">
          <BarChart3 size={16} className="text-[#cca43b]" />
          <span>Station-wise Operational Volume comparison</span>
        </h3>

        <div className="h-[320px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="station" stroke="#a1a1aa" fontSize={10} tickLine={false} />
              <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                  color: '#f4f4f5',
                  fontSize: '11px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
              <Bar dataKey="cases" name="FIR Cases" fill="#eab308" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pcr" name="PCR Calls" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="arrests" name="Arrests" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
