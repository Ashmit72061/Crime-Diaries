import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, LineChart as LineIcon, PieChart as PieIcon, Calendar, Compass, Shield } from 'lucide-react';
import useAuthStore from '../../store/authStore.js';
import api from '../../utils/api.js';

export default function AnalyticsDashboard() {
  const { user } = useAuthStore();
  const [period, setPeriod] = useState('weekly');

  // Fetch Crime Category breakdown
  const { data: categoryData = [] } = useQuery({
    queryKey: ['analytics', 'by-crime-head'],
    queryFn: async () => {
      const res = await api.get('/analytics/by-crime-head');
      return res.data.data;
    },
  });

  // Fetch Time series trends
  const { data: trendData = [] } = useQuery({
    queryKey: ['analytics', 'trends', period],
    queryFn: async () => {
      const res = await api.get(`/analytics/trends?period=${period}`);
      return res.data.data;
    },
  });

  const COLORS = ['#cca43b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-zinc-100 flex items-center gap-2">
            <BarChart3 className="text-[#cca43b]" />
            <span>Operational Analytics Console</span>
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Comparative timelines, breakdown ratios, and station-wise performance metric graphs.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-xs">
          <Calendar size={14} className="text-zinc-500 ml-1" />
          <button
            onClick={() => setPeriod('daily')}
            className={`px-3 py-1 rounded font-semibold cursor-pointer ${
              period === 'daily' ? 'bg-[#cca43b] text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setPeriod('weekly')}
            className={`px-3 py-1 rounded font-semibold cursor-pointer ${
              period === 'weekly' ? 'bg-[#cca43b] text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-3 py-1 rounded font-semibold cursor-pointer ${
              period === 'monthly' ? 'bg-[#cca43b] text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crime Head Breakdown Chart */}
        <div className="border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold tracking-wide text-zinc-100 font-display uppercase border-l-2 border-[#cca43b] pl-2 flex items-center gap-2">
            <PieIcon size={16} className="text-[#cca43b]" />
            <span>Category Incident Ratios</span>
          </h3>

          <div className="h-[280px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#18181b',
                    border: '1px solid #3f3f46',
                    borderRadius: '8px',
                    color: '#f4f4f5',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Trend Timelines Chart */}
        <div className="border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold tracking-wide text-zinc-100 font-display uppercase border-l-2 border-[#cca43b] pl-2 flex items-center gap-2">
            <LineIcon size={16} className="text-[#cca43b]" />
            <span>Weekly Reporting Timelines</span>
          </h3>

          <div className="h-[280px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={10} tickLine={false} />
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
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="cases" name="FIR Cases" stroke="#eab308" strokeWidth={2.5} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="pcr" name="PCR Calls" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="arrests" name="Arrests" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
