import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Archive, Upload, Eye, CheckCircle2, XCircle,
  AlertTriangle, Loader2, Clock, RefreshCw, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api.js';

// ── Status Badge ──────────────────────────────────────────────────────────────
const STATUS_CLS = {
  PENDING:   'bg-amber-950/40 text-amber-400 border-amber-800/40',
  APPROVED:  'bg-emerald-950/40 text-emerald-400 border-emerald-800/40',
  REJECTED:  'bg-red-950/40 text-red-400 border-red-800/40',
  COMPLETED: 'bg-blue-950/40 text-blue-400 border-blue-800/40',
};

function StatusBadge({ status }) {
  const cls = STATUS_CLS[status] || 'bg-zinc-800 text-zinc-400 border-zinc-700';
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cls}`}>
      {status || '—'}
    </span>
  );
}

// ── Import Batch Table ────────────────────────────────────────────────────────
function BatchTable({ batches, isLoading, onViewBatch }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10 text-zinc-500">
        <Loader2 size={20} className="animate-spin mr-2" /> Loading batches…
      </div>
    );
  }
  if (!batches.length) {
    return (
      <div className="text-center py-12 text-zinc-600">
        <Archive size={36} className="mx-auto mb-2 opacity-20" />
        <p className="text-sm">No import batches found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-zinc-950/60 text-zinc-400 uppercase font-semibold border-b border-zinc-800 tracking-wider">
            <th className="p-3 pl-5">Batch ID</th>
            <th className="p-3">Record Type</th>
            <th className="p-3">Total Rows</th>
            <th className="p-3">Imported</th>
            <th className="p-3">Status</th>
            <th className="p-3">Imported At</th>
            <th className="p-3 pr-5 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
          {batches.map((batch) => (
            <tr key={batch.id} className="hover:bg-zinc-800/20 transition-colors">
              <td className="p-3 pl-5 font-mono text-zinc-400 text-[10px]">{batch.id?.slice(0, 12)}…</td>
              <td className="p-3 font-bold text-[#cca43b]">{batch.record_type || '—'}</td>
              <td className="p-3 tabular-numbers">{batch.total_rows ?? '—'}</td>
              <td className="p-3 tabular-numbers text-emerald-400">{batch.imported_count ?? '—'}</td>
              <td className="p-3"><StatusBadge status={batch.status} /></td>
              <td className="p-3 font-mono text-zinc-500 text-[10px]">
                {batch.created_at
                  ? new Date(batch.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                  : '—'}
              </td>
              <td className="p-3 pr-5 text-right">
                <button
                  type="button"
                  onClick={() => onViewBatch(batch)}
                  className="flex items-center gap-1 text-zinc-500 hover:text-blue-400 transition-colors cursor-pointer ml-auto"
                  title="View details"
                >
                  <Eye size={13} />
                  <span>Details</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Amendments Table ──────────────────────────────────────────────────────────
function AmendmentsTable({ amendments, isLoading, onApprove, onReject }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10 text-zinc-500">
        <Loader2 size={20} className="animate-spin mr-2" /> Loading amendments…
      </div>
    );
  }
  if (!amendments.length) {
    return (
      <div className="text-center py-12 text-zinc-600">
        <Clock size={36} className="mx-auto mb-2 opacity-20" />
        <p className="text-sm">No pending amendments.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-zinc-950/60 text-zinc-400 uppercase font-semibold border-b border-zinc-800 tracking-wider">
            <th className="p-3 pl-5">Amendment ID</th>
            <th className="p-3">Record Ref</th>
            <th className="p-3">Reason</th>
            <th className="p-3">Requested By</th>
            <th className="p-3">Status</th>
            <th className="p-3 pr-5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
          {amendments.map((am) => (
            <tr key={am.id} className="hover:bg-zinc-800/20 transition-colors">
              <td className="p-3 pl-5 font-mono text-zinc-400 text-[10px]">{am.id?.slice(0, 12)}…</td>
              <td className="p-3 font-mono text-amber-400">{am.record_id?.slice(0, 10) || '—'}…</td>
              <td className="p-3 max-w-[200px] truncate text-zinc-300" title={am.reason}>{am.reason || '—'}</td>
              <td className="p-3 text-zinc-400">{am.requested_by || '—'}</td>
              <td className="p-3"><StatusBadge status={am.status} /></td>
              <td className="p-3 pr-5 text-right">
                {am.status === 'PENDING' ? (
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => onApprove(am.id)}
                      className="flex items-center gap-1 text-emerald-500 hover:text-emerald-300 transition-colors cursor-pointer"
                      title="Approve"
                    >
                      <CheckCircle2 size={13} /> Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => onReject(am.id)}
                      className="flex items-center gap-1 text-red-500 hover:text-red-300 transition-colors cursor-pointer"
                      title="Reject"
                    >
                      <XCircle size={13} /> Reject
                    </button>
                  </div>
                ) : (
                  <span className="text-zinc-600">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── File Import Panel ─────────────────────────────────────────────────────────
function ImportPanel({ onImported }) {
  const [recordType, setRecordType] = useState('CASE');
  const [file, setFile] = useState(null);

  const importMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('record_type', recordType);
      const res = await api.post('/legacy/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Legacy import triggered successfully');
      setFile(null);
      onImported?.();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Import failed'),
  });

  return (
    <div className="border border-zinc-800 bg-zinc-900/40 rounded-xl p-5 space-y-4 text-xs">
      <h3 className="font-bold text-zinc-200 flex items-center gap-2">
        <Upload size={14} className="text-[#cca43b]" />
        Import Legacy Data (Excel / CSV)
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-zinc-400 font-semibold">Record Type</label>
          <select
            value={recordType}
            onChange={(e) => setRecordType(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 outline-none focus:border-[#cca43b] transition-all cursor-pointer"
          >
            {['CASE', 'ARREST', 'PCR_CALL', 'MISSING', 'UIDB'].map((rt) => (
              <option key={rt} value={rt}>{rt}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-zinc-400 font-semibold">File (Excel / CSV)</label>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-300 cursor-pointer text-[11px]"
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-zinc-600">
          File will be processed in background. Check Batches tab for status.
        </p>
        <button
          type="button"
          disabled={!file || importMutation.isPending}
          onClick={() => importMutation.mutate()}
          className="flex items-center gap-1.5 bg-[#cca43b] hover:bg-amber-600 text-zinc-950 font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          {importMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          Start Import
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LegacyDataPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('batches'); // 'batches' | 'amendments' | 'import'
  const [selectedBatch, setSelectedBatch] = useState(null);

  // ── Fetch Batches ─────────────────────────────────────────────────────────
  const { data: batches = [], isLoading: batchLoading, refetch: refetchBatches } = useQuery({
    queryKey: ['legacy', 'batches'],
    queryFn: async () => {
      const res = await api.get('/legacy/batches');
      const raw = res.data?.data;
      return Array.isArray(raw) ? raw : [];
    },
  });

  // ── Fetch Batch Detail ────────────────────────────────────────────────────
  const { data: batchDetail } = useQuery({
    queryKey: ['legacy', 'batch', selectedBatch?.id],
    queryFn: async () => {
      const res = await api.get(`/legacy/batches/${selectedBatch.id}`);
      return res.data?.data;
    },
    enabled: !!selectedBatch?.id,
  });

  // ── Fetch Amendments ──────────────────────────────────────────────────────
  const { data: amendments = [], isLoading: amendLoading, refetch: refetchAmends } = useQuery({
    queryKey: ['legacy', 'amendments'],
    queryFn: async () => {
      const res = await api.get('/legacy/amendments');
      const raw = res.data?.data;
      return Array.isArray(raw) ? raw : [];
    },
    enabled: activeTab === 'amendments',
  });

  // ── Amendment Mutations ───────────────────────────────────────────────────
  const approveMutation = useMutation({
    mutationFn: (id) => api.post(`/legacy/amendments/${id}/approve`),
    onSuccess: () => { toast.success('Amendment approved'); refetchAmends(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Approve failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => api.post(`/legacy/amendments/${id}/reject`),
    onSuccess: () => { toast.success('Amendment rejected'); refetchAmends(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Reject failed'),
  });

  const TABS = [
    { id: 'batches',    label: 'Import Batches' },
    { id: 'amendments', label: 'Amendments Queue' },
    { id: 'import',     label: 'New Import' },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-zinc-100 flex items-center gap-2">
            <Archive className="text-[#cca43b]" />
            <span>Legacy Data Manager</span>
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Import historical police records from legacy Excel/CSV registers, review batch statuses, and process data correction amendments.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { refetchBatches(); refetchAmends(); }}
          className="flex items-center gap-2 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-zinc-800 pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedBatch(null); }}
            className={`px-5 py-2 text-xs font-bold rounded-t transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'border border-b-0 border-zinc-700 bg-zinc-900 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab.label}
            {tab.id === 'amendments' && amendments.filter((a) => a.status === 'PENDING').length > 0 && (
              <span className="ml-1.5 bg-amber-500 text-zinc-950 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {amendments.filter((a) => a.status === 'PENDING').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ────────────────────────────────────────────────────── */}
      <div className="border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md rounded-xl overflow-hidden shadow-lg">
        {activeTab === 'batches' && !selectedBatch && (
          <BatchTable
            batches={batches}
            isLoading={batchLoading}
            onViewBatch={(b) => setSelectedBatch(b)}
          />
        )}

        {activeTab === 'batches' && selectedBatch && (
          <div className="p-5 space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedBatch(null)}
                className="text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer font-semibold"
              >
                ← Back to Batches
              </button>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-400 font-mono">Batch: {selectedBatch.id?.slice(0, 20)}…</span>
            </div>
            {!batchDetail ? (
              <div className="flex items-center gap-2 text-zinc-500 p-6 justify-center">
                <Loader2 size={16} className="animate-spin" /> Loading batch detail…
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Record Type',    value: batchDetail.record_type },
                    { label: 'Total Rows',     value: batchDetail.total_rows },
                    { label: 'Imported',       value: batchDetail.imported_count },
                    { label: 'Status',         value: batchDetail.status },
                  ].map(({ label, value }) => (
                    <div key={label} className="border border-zinc-800 bg-zinc-950/40 rounded-lg p-3">
                      <div className="text-zinc-500 text-[10px] mb-1">{label}</div>
                      <div className="text-zinc-200 font-bold">{value ?? '—'}</div>
                    </div>
                  ))}
                </div>
                {batchDetail.errors?.length > 0 && (
                  <div className="border border-red-900/40 bg-red-950/15 rounded-xl p-4">
                    <p className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                      <AlertTriangle size={13} /> Import Errors ({batchDetail.errors.length})
                    </p>
                    <ul className="text-red-300 space-y-1 max-h-32 overflow-y-auto">
                      {batchDetail.errors.map((e, i) => (
                        <li key={i} className="font-mono text-[10px]">Row {e.row}: {e.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'amendments' && (
          <AmendmentsTable
            amendments={amendments}
            isLoading={amendLoading}
            onApprove={(id) => approveMutation.mutate(id)}
            onReject={(id) => rejectMutation.mutate(id)}
          />
        )}

        {activeTab === 'import' && (
          <div className="p-5">
            <ImportPanel onImported={() => { refetchBatches(); setActiveTab('batches'); }} />
          </div>
        )}
      </div>
    </div>
  );
}
