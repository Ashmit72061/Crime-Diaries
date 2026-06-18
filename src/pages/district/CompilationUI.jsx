import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Send, Calendar, CheckCircle, Database, AlertTriangle, FileText, Shield, Phone, UserX, Fingerprint } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api.js';
import useAuthStore from '../../store/authStore.js';

export default function CompilationUI() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [compileDate, setCompileDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Fetch district compilations list — backend uses JWT district, no need to send it
  const { data: compilations = [], isLoading, error: fetchError } = useQuery({
    queryKey: ['compilations'],
    queryFn: async () => {
      const res = await api.get('/compilations');
      return res.data.data || [];
    },
  });

  // Create Compilation Mutation
  const createCompMutation = useMutation({
    mutationFn: async (date) => {
      const res = await api.post('/compilations', { period: date });
      return res.data.data;
    },
    onSuccess: (data) => {
      toast.success(`Compilation created — ${data?.compiled_summary?.total_records || 0} records bundled.`);
      queryClient.invalidateQueries({ queryKey: ['compilations'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to generate compilation');
    },
  });

  // Submit Compilation Mutation
  const submitCompMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.post(`/compilations/${id}/submit`);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Compilation dispatched to HQ successfully');
      queryClient.invalidateQueries({ queryKey: ['compilations'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit compilation');
    },
  });

  const handleCompileTrigger = () => {
    createCompMutation.mutate(compileDate);
  };

  const getSummaryVal = (comp, key) => {
    const s = comp.compiled_summary;
    if (!s) return 0;
    return s[key] ?? 0;
  };

  const formatPeriod = (period) => {
    if (!period) return 'Unknown';
    try {
      return new Date(period).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return period;
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Back Header */}
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
        <button
          onClick={() => navigate('/district')}
          className="hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 p-2 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-zinc-700"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-serif font-bold text-zinc-100 flex items-center gap-2">
            <BookOpen className="text-[#cca43b]" size={20} />
            <span>District Compilation Workspace</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Aggregate approved station records for{' '}
            <span className="text-amber-400 font-semibold">
              {user?.district_id || user?.districtId || 'your district'}
            </span>{' '}
            into a unified district operations log before sending to Headquarters.
          </p>
        </div>
      </div>

      {/* Date trigger card */}
      <div className="border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md rounded-xl p-5 shadow-lg space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Calendar size={14} className="text-[#cca43b]" />
          <span>Select Target Compilation Date</span>
        </h3>

        <p className="text-xs text-zinc-500">
          This will bundle all records currently at <span className="text-amber-400 font-semibold">DISTRICT_REVIEW</span> status in your district into a single compilation packet.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="date"
            value={compileDate}
            onChange={(e) => setCompileDate(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 px-3 py-2 outline-none focus:border-[#cca43b] transition-all"
          />
          <button
            onClick={handleCompileTrigger}
            disabled={createCompMutation.isPending}
            className="bg-[#cca43b] hover:bg-amber-600 text-zinc-950 px-6 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {createCompMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-zinc-900" />
                <span>Aggregating Data...</span>
              </>
            ) : (
              <>
                <Database size={14} />
                <span>Compile Station Logs</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Compiled Records List */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Database size={14} className="text-[#cca43b]" />
          <span>Compiled District Archives</span>
        </h3>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#cca43b] mb-4"></div>
            <p>Fetching compilations register...</p>
          </div>
        ) : fetchError ? (
          <div className="border border-red-800/40 bg-red-950/20 p-6 rounded-xl flex items-center gap-3 text-red-400 text-sm">
            <AlertTriangle size={18} />
            <span>Failed to load compilations. Please try refreshing.</span>
          </div>
        ) : compilations.length === 0 ? (
          <div className="border border-zinc-800 p-8 text-center text-zinc-500 rounded-xl space-y-2">
            <Database size={32} className="mx-auto text-zinc-700" />
            <p className="font-semibold text-zinc-400">No compilations created yet.</p>
            <p className="text-xs">Select a date above and click <strong className="text-amber-400">Compile Station Logs</strong> to initialize your first compilation.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {compilations.map((comp) => (
              <div
                key={comp.id}
                className="border border-zinc-800 bg-zinc-950/40 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-zinc-200">Period: {formatPeriod(comp.period)}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        comp.status === 'SUBMITTED'
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                          : 'bg-amber-950/30 text-amber-400 border-amber-800/40'
                      }`}
                    >
                      {comp.status}
                    </span>
                    <span className="text-zinc-600 font-mono text-[10px]">#{comp.id?.slice(0, 12)}</span>
                  </div>

                  {comp.compiled_summary ? (
                    <div className="flex gap-4 text-zinc-400 text-[11px] flex-wrap pt-1">
                      <span className="flex items-center gap-1">
                        <FileText size={11} className="text-amber-500" />
                        Cases: <strong className="text-zinc-200 ml-1">{getSummaryVal(comp, 'firs')}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Shield size={11} className="text-emerald-500" />
                        Arrests: <strong className="text-zinc-200 ml-1">{getSummaryVal(comp, 'arrests')}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone size={11} className="text-blue-400" />
                        PCR Calls: <strong className="text-zinc-200 ml-1">{getSummaryVal(comp, 'pcrCalls')}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <UserX size={11} className="text-purple-400" />
                        Missing: <strong className="text-zinc-200 ml-1">{getSummaryVal(comp, 'missing')}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Fingerprint size={11} className="text-rose-400" />
                        UIDB: <strong className="text-zinc-200 ml-1">{getSummaryVal(comp, 'uidb')}</strong>
                      </span>
                      <span className="text-zinc-500 ml-2">
                        Total: <strong className="text-zinc-300">{getSummaryVal(comp, 'total_records')}</strong> records
                      </span>
                    </div>
                  ) : (
                    <div className="text-zinc-600 text-[11px]">No summary data available</div>
                  )}

                  {comp.submitted_at && (
                    <div className="text-[10px] text-zinc-600 pt-0.5">
                      Submitted: {new Date(comp.submitted_at).toLocaleString('en-IN')}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {comp.status !== 'SUBMITTED' && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Send this compilation (${getSummaryVal(comp, 'total_records')} records) to HQ? This action is locked and audited.`)) {
                          submitCompMutation.mutate(comp.id);
                        }
                      }}
                      disabled={submitCompMutation.isPending}
                      className="bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Send size={12} />
                      <span>Dispatch to HQ</span>
                    </button>
                  )}
                  {comp.status === 'SUBMITTED' && (
                    <span className="text-zinc-500 flex items-center gap-1 text-[11px]">
                      <CheckCircle size={14} className="text-emerald-500" />
                      <span>Received by HQ</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
