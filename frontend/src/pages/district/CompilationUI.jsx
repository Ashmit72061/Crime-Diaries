import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, BookOpen, Send, Calendar, CheckCircle, Database } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api.js';

export default function CompilationUI() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [compileDate, setCompileDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Fetch district compilations list
  const { data: compilations = [], isLoading } = useQuery({
    queryKey: ['compilations'],
    queryFn: async () => {
      const res = await api.get('/compilations');
      return res.data.data;
    },
  });

  // Create Compilation Mutation
  const createCompMutation = useMutation({
    mutationFn: async (date) => {
      const res = await api.post('/compilations', { period: date, district_id: 'DIST_NDD' });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Compilation generated successfully');
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
            Aggregate station records into a unified district operations log before sending to Headquarters.
          </p>
        </div>
      </div>

      {/* Date trigger card */}
      <div className="border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md rounded-xl p-5 shadow-lg space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Calendar size={14} className="text-[#cca43b]" />
          <span>Select Target Compilation Date</span>
        </h3>

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
            {createCompMutation.isPending ? 'Aggregating Data...' : 'Compile Station Logs'}
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
        ) : compilations.length === 0 ? (
          <div className="border border-zinc-800 p-8 text-center text-zinc-500 rounded-xl">
            No compilations created yet. Select a date above to initialize your first compilation.
          </div>
        ) : (
          <div className="space-y-3">
            {compilations.map((comp) => (
              <div
                key={comp.id}
                className="border border-zinc-800 bg-zinc-950/40 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-200">Date Log: {comp.period}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        comp.status === 'SUBMITTED'
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                      }`}
                    >
                      {comp.status}
                    </span>
                  </div>
                  <div className="flex gap-4 text-zinc-400 text-[11px] pt-1 flex-wrap">
                    <span>Cases: <strong>{comp.compiled_summary.firs}</strong></span>
                    <span>Arrests: <strong>{comp.compiled_summary.arrests}</strong></span>
                    <span>PCR Calls: <strong>{comp.compiled_summary.pcrCalls}</strong></span>
                    <span>Missing: <strong>{comp.compiled_summary.missing || 0}</strong></span>
                    <span>UIDB: <strong>{comp.compiled_summary.uidb || 0}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {comp.status !== 'SUBMITTED' && (
                    <button
                      onClick={() => {
                        if (window.confirm('Send compiled district diary to HQ? This action is locked and audited.')) {
                          submitCompMutation.mutate(comp.id);
                        }
                      }}
                      className="bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 px-5.5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Send size={12} />
                      <span>Dispatch to HQ</span>
                    </button>
                  )}
                  {comp.status === 'SUBMITTED' && (
                    <span className="text-zinc-500 flex items-center gap-1">
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
