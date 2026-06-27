import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileSignature, Plus, Edit2, Save, X, Loader2, AlertTriangle,
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
    <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans text-slate-800">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-slate-600 font-semibold">Hierarchy Level *</label>
          <select
            value={form.level}
            onChange={set('level')}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-[var(--accent-color)] transition-all cursor-pointer font-semibold"
          >
            {['PS', 'SHO', 'ACP', 'DISTRICT', 'HQ'].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-slate-600 font-semibold">Record Type *</label>
          <select
            value={form.record_type}
            onChange={set('record_type')}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-[var(--accent-color)] transition-all cursor-pointer font-semibold"
          >
            {['CASE', 'ARREST', 'PCR_CALL', 'MISSING', 'UIDB'].map((rt) => (
              <option key={rt} value={rt}>{rt}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-slate-600 font-semibold">Max Turnaround (hours)</label>
          <input
            type="number"
            min={1}
            value={form.max_turnaround_h}
            onChange={set('max_turnaround_h')}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-[var(--accent-color)] transition-all font-semibold"
          />
        </div>
        <div className="space-y-1">
          <label className="text-slate-600 font-semibold">Escalation After (hours)</label>
          <input
            type="number"
            min={1}
            value={form.escalation_after_h}
            onChange={set('escalation_after_h')}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-[var(--accent-color)] transition-all font-semibold"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-slate-600 font-semibold">Notes / Remarks</label>
        <textarea
          value={form.notes}
          onChange={set('notes')}
          rows={2}
          placeholder="Optional compliance notes…"
          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-[var(--accent-color)] transition-all resize-none font-semibold"
        />
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-350 transition-colors cursor-pointer font-bold"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold transition-colors cursor-pointer disabled:opacity-50 border-none shadow-sm"
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
    PS:       'bg-emerald-50 text-emerald-700 border-emerald-200',
    SHO:      'bg-indigo-50 text-indigo-700 border-indigo-200',
    ACP:      'bg-purple-50 text-purple-700 border-purple-200',
    DISTRICT: 'bg-rose-50 text-rose-700 border-rose-200',
    HQ:       'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <div className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-sm">
      <div
        className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${LEVEL_COLORS[contract.level] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
          {contract.level}
        </span>
        <span className="font-bold text-slate-800 text-xs">{contract.record_type}</span>
        <span className="text-slate-550 text-[11px] ml-auto font-semibold">
          Turnaround: <strong className="text-slate-800">{contract.max_turnaround_h}h</strong>
          {' · '}Escalate after: <strong className="text-amber-600">{contract.escalation_after_h}h</strong>
        </span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit(contract); }}
          className="text-slate-400 hover:text-[var(--accent-color)] transition-colors cursor-pointer p-1 rounded ml-2 border-none bg-transparent"
          title="Edit"
        >
          <Edit2 size={13} />
        </button>
        {expanded ? <ChevronUp size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
      </div>

      {expanded && (
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 space-y-2 text-xs text-slate-600 font-semibold">
          <div className="flex items-start gap-2">
            <Info size={12} className="mt-0.5 text-slate-400 flex-shrink-0" />
            <p>{contract.notes || 'No additional notes.'}</p>
          </div>
          {contract.created_at && (
            <p className="text-slate-400 font-mono text-[10px]">
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
    <div className="space-y-6 theme-admin-page p-5 rounded-2xl bg-[var(--bg-page-main)] border border-slate-200 shadow-sm font-sans text-slate-800">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 font-display">
            <FileSignature className="text-[var(--accent-color)]" />
            <span>Level Contracts</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1 font-semibold">
            Define SLA turnaround times and escalation thresholds for each hierarchy level and record type. These contracts govern workflow compliance monitoring.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditContract(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer border-none shadow-sm active:scale-95"
        >
          <Plus size={14} />
          New Contract
        </button>
      </div>

      {/* ── Info Banner ────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 border border-blue-200 bg-blue-50/50 rounded-xl p-4 text-xs text-blue-750 font-semibold shadow-sm">
        <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0 text-blue-600" />
        <p>
          Level contracts define the maximum time (in hours) a record should remain at each hierarchy level before triggering an automatic escalation alert.
          This is a SYSTEM_ADMIN–only configuration.
        </p>
      </div>

      {/* ── Create/Edit Form ───────────────────────────────────────────────── */}
      {(showForm || editContract) && (
        <div className="border border-[var(--accent-color)] bg-white rounded-xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              {editContract ? 'Edit Contract' : 'Create New Level Contract'}
            </h3>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditContract(null); }}
              className="text-slate-500 hover:text-slate-700 cursor-pointer border-none bg-transparent"
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
        <div className="flex flex-col items-center justify-center p-16 text-slate-500 border border-slate-200 bg-white rounded-xl shadow-sm">
          <Loader2 size={28} className="animate-spin mb-3 text-[var(--accent-color)]" />
          <p className="text-sm font-semibold">Loading level contracts…</p>
        </div>
      ) : isError ? (
        <div className="border border-red-200 bg-red-50/50 rounded-xl p-8 text-center shadow-sm">
          <AlertTriangle size={28} className="mx-auto text-red-500 mb-2" />
          <p className="text-red-700 text-sm font-semibold">Failed to load contracts</p>
        </div>
      ) : contracts.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-xl p-16 text-center text-slate-400 bg-white shadow-sm">
          <FileSignature size={48} className="mx-auto opacity-20 mb-3 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No level contracts defined yet</p>
          <p className="text-xs mt-1 text-slate-500">Click <strong className="text-[var(--accent-color)]">New Contract</strong> to define your first SLA.</p>
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
