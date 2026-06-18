import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileContract, Plus, Edit2, Save, X, Loader2, AlertTriangle,
  ChevronDown, ChevronUp, CheckCircle2, Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api.js';

// ── Level Contract Form ───────────────────────────────────────────────────────
function ContractForm({ initialData, onSave, onCancel, isSaving }) {
  const isEdit = !!initialData?.id;
  const [form, setForm] = useState({
    level:             initialData?.level || 'PS',
    record_type:       initialData?.record_type || 'CASE',
    max_turnaround_h:  initialData?.max_turnaround_h ?? 24,
    escalation_after_h: initialData?.escalation_after_h ?? 48,
    notes:             initialData?.notes || '',
  });

  const set = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, id: initialData?.id });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-zinc-400 font-semibold">Hierarchy Level *</label>
          <select
            value={form.level}
            onChange={set('level')}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 outline-none focus:border-[#cca43b] transition-all cursor-pointer"
          >
            {['PS', 'SHO', 'ACP', 'DISTRICT', 'HQ'].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-zinc-400 font-semibold">Record Type *</label>
          <select
            value={form.record_type}
            onChange={set('record_type')}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 outline-none focus:border-[#cca43b] transition-all cursor-pointer"
          >
            {['CASE', 'ARREST', 'PCR_CALL', 'MISSING', 'UIDB'].map((rt) => (
              <option key={rt} value={rt}>{rt}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-zinc-400 font-semibold">Max Turnaround (hours)</label>
          <input
            type="number"
            min={1}
            value={form.max_turnaround_h}
            onChange={set('max_turnaround_h')}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 outline-none focus:border-[#cca43b] transition-all"
          />
        </div>
        <div className="space-y-1">
          <label className="text-zinc-400 font-semibold">Escalation After (hours)</label>
          <input
            type="number"
            min={1}
            value={form.escalation_after_h}
            onChange={set('escalation_after_h')}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 outline-none focus:border-[#cca43b] transition-all"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-zinc-400 font-semibold">Notes / Remarks</label>
        <textarea
          value={form.notes}
          onChange={set('notes')}
          rows={2}
          placeholder="Optional compliance notes…"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 outline-none focus:border-[#cca43b] transition-all resize-none"
        />
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-zinc-100 transition-colors cursor-pointer">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#cca43b] hover:bg-amber-600 text-zinc-950 font-bold transition-colors cursor-pointer disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {isEdit ? 'Update Contract' : 'Create Contract'}
        </button>
      </div>
    </form>
  );
}

// ── Collapsible Contract Row ──────────────────────────────────────────────────
function ContractRow({ contract, onEdit }) {
  const [expanded, setExpanded] = useState(false);

  const LEVEL_COLORS = {
    PS:       'bg-emerald-950/40 text-emerald-400 border-emerald-800/40',
    SHO:      'bg-blue-950/40 text-blue-400 border-blue-800/40',
    ACP:      'bg-violet-950/40 text-violet-400 border-violet-800/40',
    DISTRICT: 'bg-amber-950/40 text-amber-400 border-amber-800/40',
    HQ:       'bg-red-950/40 text-red-400 border-red-800/40',
  };

  return (
    <div className="border border-zinc-800/80 bg-zinc-900/30 rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-zinc-800/20 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${LEVEL_COLORS[contract.level] || 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
          {contract.level}
        </span>
        <span className="font-semibold text-zinc-200 text-xs">{contract.record_type}</span>
        <span className="text-zinc-500 text-[11px] ml-auto">
          Turnaround: <strong className="text-zinc-300">{contract.max_turnaround_h}h</strong>
          {' · '}Escalate after: <strong className="text-amber-400">{contract.escalation_after_h}h</strong>
        </span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit(contract); }}
          className="text-zinc-500 hover:text-blue-400 transition-colors cursor-pointer p-1 rounded ml-2"
          title="Edit"
        >
          <Edit2 size={13} />
        </button>
        {expanded ? <ChevronUp size={13} className="text-zinc-500" /> : <ChevronDown size={13} className="text-zinc-500" />}
      </div>

      {expanded && (
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/30 space-y-2 text-xs text-zinc-400">
          <div className="flex items-start gap-2">
            <Info size={12} className="mt-0.5 text-zinc-600 flex-shrink-0" />
            <p>{contract.notes || 'No additional notes.'}</p>
          </div>
          {contract.created_at && (
            <p className="text-zinc-600 font-mono text-[10px]">
              Created: {new Date(contract.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LevelContractsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editContract, setEditContract] = useState(null);

  const { data: contracts = [], isLoading, isError } = useQuery({
    queryKey: ['admin', 'level-contracts'],
    queryFn: async () => {
      const res = await api.get('/level-contracts');
      const raw = res.data?.data;
      return Array.isArray(raw) ? raw : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/level-contracts', body),
    onSuccess: () => {
      toast.success('Level contract created');
      queryClient.invalidateQueries({ queryKey: ['admin', 'level-contracts'] });
      setShowForm(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Create failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/level-contracts/${id}`, body),
    onSuccess: () => {
      toast.success('Level contract updated');
      queryClient.invalidateQueries({ queryKey: ['admin', 'level-contracts'] });
      setEditContract(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });

  const handleSave = (data) => {
    if (data.id) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-zinc-100 flex items-center gap-2">
            <FileContract className="text-[#cca43b]" />
            <span>Level Contracts</span>
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Define SLA turnaround times and escalation thresholds for each hierarchy level and record type. These contracts govern workflow compliance monitoring.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditContract(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-[#cca43b] hover:bg-amber-600 text-zinc-950 font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
        >
          <Plus size={14} />
          New Contract
        </button>
      </div>

      {/* ── Info Banner ────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 border border-blue-900/40 bg-blue-950/15 rounded-xl p-4 text-xs text-blue-300">
        <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0 text-blue-400" />
        <p>
          Level contracts define the maximum time (in hours) a record should remain at each hierarchy level before triggering an automatic escalation alert.
          This is a SYSTEM_ADMIN–only configuration.
        </p>
      </div>

      {/* ── Create/Edit Form ───────────────────────────────────────────────── */}
      {(showForm || editContract) && (
        <div className="border border-[#cca43b]/40 bg-amber-950/10 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-100">
              {editContract ? 'Edit Contract' : 'Create New Level Contract'}
            </h3>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditContract(null); }}
              className="text-zinc-500 hover:text-zinc-200 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
          <ContractForm
            initialData={editContract}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditContract(null); }}
            isSaving={isSaving}
          />
        </div>
      )}

      {/* ── Contracts List ─────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 text-zinc-500">
          <Loader2 size={28} className="animate-spin mb-3 text-[#cca43b]" />
          <p className="text-sm">Loading level contracts…</p>
        </div>
      ) : isError ? (
        <div className="border border-red-900/50 bg-red-950/20 rounded-xl p-8 text-center">
          <AlertTriangle size={28} className="mx-auto text-red-500 mb-2" />
          <p className="text-red-400 text-sm font-semibold">Failed to load contracts</p>
        </div>
      ) : contracts.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-xl p-16 text-center text-zinc-600">
          <FileContract size={48} className="mx-auto opacity-20 mb-3" />
          <p className="text-sm font-semibold text-zinc-500">No level contracts defined yet</p>
          <p className="text-xs mt-1">Click <strong className="text-amber-400">New Contract</strong> to define your first SLA.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((contract) => (
            <ContractRow
              key={contract.id}
              contract={contract}
              onEdit={(c) => { setEditContract(c); setShowForm(false); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
