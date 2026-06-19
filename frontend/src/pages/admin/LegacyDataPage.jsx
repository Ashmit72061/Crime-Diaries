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
  PENDING:   'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
  APPROVED:  'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]',
  REJECTED:  'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]',
  COMPLETED: 'bg-[#EFF6FF] text-[#003087] border-[#BFDBFE]',
};

function StatusBadge({ status }) {
  const cls = STATUS_CLS[status] || 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]';
  return (
    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${cls}`}>
      {status || '—'}
    </span>
  );
}

// ── Import Batch Table ────────────────────────────────────────────────────────
function BatchTable({ batches, isLoading, onViewBatch }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-14 text-[#718096]">
        <Loader2 size={20} className="animate-spin mr-2 text-[#003087]" /> Loading batches…
      </div>
    );
  }
  if (!batches.length) {
    return (
      <div className="text-center py-16 text-[#A0AEC0]">
        <Archive size={40} className="mx-auto mb-3 opacity-20 text-[#003087]" />
        <p className="text-sm font-medium">No import batches found.</p>
        <p className="text-xs mt-1 text-[#CBD5E0]">Upload a file in the New Import tab to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-[#F8FAFC] text-[#4A5568] uppercase font-semibold border-b border-[#E2E8F0] tracking-wider">
            <th className="p-3 pl-6">Batch ID</th>
            <th className="p-3">Record Type</th>
            <th className="p-3">Total Rows</th>
            <th className="p-3">Imported</th>
            <th className="p-3">Status</th>
            <th className="p-3">Imported At</th>
            <th className="p-3 pr-6 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EDF2F7] text-[#2D3748]">
          {batches.map((batch) => (
            <tr
              key={batch.id}
              className="hover:bg-[#EFF6FF] transition-colors duration-150"
            >
              <td className="p-3 pl-6 font-mono text-[#718096] text-[10px]">{batch.id?.slice(0, 12)}…</td>
              <td className="p-3 font-bold text-[#003087]">{batch.record_type || '—'}</td>
              <td className="p-3 tabular-numbers text-[#4A5568]">{batch.total_rows ?? '—'}</td>
              <td className="p-3 tabular-numbers text-[#059669] font-semibold">{batch.imported_count ?? '—'}</td>
              <td className="p-3"><StatusBadge status={batch.status} /></td>
              <td className="p-3 font-mono text-[#A0AEC0] text-[10px]">
                {batch.created_at
                  ? new Date(batch.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                  : '—'}
              </td>
              <td className="p-3 pr-6 text-right">
                <button
                  type="button"
                  onClick={() => onViewBatch(batch)}
                  className="inline-flex items-center gap-1.5 text-[#718096] hover:text-[#003087] hover:bg-[#EFF6FF] px-2.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer ml-auto font-semibold"
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
      <div className="flex items-center justify-center p-14 text-[#718096]">
        <Loader2 size={20} className="animate-spin mr-2 text-[#003087]" /> Loading amendments…
      </div>
    );
  }
  if (!amendments.length) {
    return (
      <div className="text-center py-16 text-[#A0AEC0]">
        <Clock size={40} className="mx-auto mb-3 opacity-20 text-[#003087]" />
        <p className="text-sm font-medium">No pending amendments.</p>
        <p className="text-xs mt-1 text-[#CBD5E0]">All amendment requests are up to date.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-[#F8FAFC] text-[#4A5568] uppercase font-semibold border-b border-[#E2E8F0] tracking-wider">
            <th className="p-3 pl-6">Amendment ID</th>
            <th className="p-3">Record Ref</th>
            <th className="p-3">Reason</th>
            <th className="p-3">Requested By</th>
            <th className="p-3">Status</th>
            <th className="p-3 pr-6 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EDF2F7] text-[#2D3748]">
          {amendments.map((am) => (
            <tr
              key={am.id}
              className="hover:bg-[#EFF6FF] transition-colors duration-150"
            >
              <td className="p-3 pl-6 font-mono text-[#718096] text-[10px]">{am.id?.slice(0, 12)}…</td>
              <td className="p-3 font-mono text-[#D97706] font-semibold">{am.record_id?.slice(0, 10) || '—'}…</td>
              <td className="p-3 max-w-[200px] truncate text-[#4A5568]" title={am.reason}>{am.reason || '—'}</td>
              <td className="p-3 text-[#718096]">{am.requested_by || '—'}</td>
              <td className="p-3"><StatusBadge status={am.status} /></td>
              <td className="p-3 pr-6 text-right">
                {am.status === 'PENDING' ? (
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => onApprove(am.id)}
                      className="inline-flex items-center gap-1 text-[#059669] bg-[#ECFDF5] hover:bg-[#D1FAE5] px-2.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer font-semibold border border-[#A7F3D0]"
                      title="Approve"
                    >
                      <CheckCircle2 size={12} /> Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => onReject(am.id)}
                      className="inline-flex items-center gap-1 text-[#DC2626] bg-[#FEF2F2] hover:bg-[#FEE2E2] px-2.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer font-semibold border border-[#FECACA]"
                      title="Reject"
                    >
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                ) : (
                  <span className="text-[#CBD5E0]">—</span>
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
    <div className="border border-[#E2E8F0] bg-white rounded-2xl p-6 space-y-5 text-xs shadow-sm">
      <h3 className="font-bold text-[#1A202C] flex items-center gap-2 text-sm">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EFF6FF]">
          <Upload size={15} className="text-[#003087]" />
        </span>
        Import Legacy Data (Excel / CSV)
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[#4A5568] font-semibold">Record Type</label>
          <select
            value={recordType}
            onChange={(e) => setRecordType(e.target.value)}
            className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-[#1A202C] outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10 transition-all cursor-pointer shadow-sm"
          >
            {['CASE', 'ARREST', 'PCR_CALL', 'MISSING', 'UIDB'].map((rt) => (
              <option key={rt} value={rt}>{rt}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[#4A5568] font-semibold">File (Excel / CSV)</label>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-[#4A5568] cursor-pointer text-[11px] shadow-sm file:mr-2 file:rounded-lg file:border-0 file:bg-[#EFF6FF] file:text-[#003087] file:font-semibold file:px-2 file:py-0.5"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[#A0AEC0]">
          File will be processed in background. Check Batches tab for status.
        </p>
        <button
          type="button"
          disabled={!file || importMutation.isPending}
          onClick={() => importMutation.mutate()}
          className="flex items-center gap-1.5 bg-gradient-to-r from-[#003087] to-[#0046C0] hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 text-white font-bold px-5 py-2 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
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
    <div className="min-h-screen bg-[#F0F4F9] space-y-6 p-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-br from-[#0A1628] via-[#003087] to-[#0046C0] px-8 py-8 shadow-lg relative overflow-hidden">
        {/* subtle decorative ring */}
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full border border-white/5" />
        <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full border border-white/5" />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-[10px] font-semibold text-white/80 uppercase tracking-wider">
              <Archive size={11} /> Legacy Records
            </span>
            <h1 className="mt-3 text-2xl font-bold text-white flex items-center gap-3">
              Legacy Data Manager
            </h1>
            <p className="text-white/50 text-xs mt-1.5 max-w-lg">
              Import historical police records from legacy Excel/CSV registers, review batch statuses, and process data correction amendments.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { refetchBatches(); refetchAmends(); }}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md shrink-0"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-white rounded-2xl p-1.5 shadow-sm border border-[#E2E8F0] w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedBatch(null); }}
            className={`relative px-5 py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-[#003087] to-[#0046C0] text-white shadow-md shadow-blue-500/20'
                : 'text-[#718096] hover:text-[#003087] hover:bg-[#EFF6FF]'
            }`}
          >
            {tab.label}
            {tab.id === 'amendments' && amendments.filter((a) => a.status === 'PENDING').length > 0 && (
              <span className="ml-1.5 bg-[#D97706] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {amendments.filter((a) => a.status === 'PENDING').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-sm overflow-hidden transition-all duration-200">

        {activeTab === 'batches' && !selectedBatch && (
          <BatchTable
            batches={batches}
            isLoading={batchLoading}
            onViewBatch={(b) => setSelectedBatch(b)}
          />
        )}

        {activeTab === 'batches' && selectedBatch && (
          <div className="p-6 space-y-5 text-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedBatch(null)}
                className="inline-flex items-center gap-1.5 text-[#003087] hover:bg-[#EFF6FF] px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer font-semibold"
              >
                ← Back to Batches
              </button>
              <span className="text-[#CBD5E0]">·</span>
              <span className="text-[#A0AEC0] font-mono">Batch: {selectedBatch.id?.slice(0, 20)}…</span>
            </div>

            {!batchDetail ? (
              <div className="flex items-center gap-2 text-[#718096] p-8 justify-center">
                <Loader2 size={16} className="animate-spin text-[#003087]" /> Loading batch detail…
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Record Type', value: batchDetail.record_type },
                    { label: 'Total Rows',  value: batchDetail.total_rows },
                    { label: 'Imported',    value: batchDetail.imported_count },
                    { label: 'Status',      value: batchDetail.status },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="border border-[#E2E8F0] bg-[#F8FAFC] rounded-2xl p-4 hover:border-[#003087]/30 hover:shadow-sm transition-all duration-200"
                    >
                      <div className="text-[#A0AEC0] text-[10px] font-semibold uppercase tracking-wider mb-1">{label}</div>
                      <div className="text-[#1A202C] font-bold text-sm">{value ?? '—'}</div>
                    </div>
                  ))}
                </div>

                {batchDetail.errors?.length > 0 && (
                  <div className="border border-[#FECACA] bg-[#FFF5F5] rounded-2xl p-5">
                    <p className="text-[#DC2626] font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle size={14} /> Import Errors ({batchDetail.errors.length})
                    </p>
                    <ul className="text-[#E53E3E] space-y-1 max-h-36 overflow-y-auto">
                      {batchDetail.errors.map((e, i) => (
                        <li key={i} className="font-mono text-[10px] bg-[#FEF2F2] px-3 py-1.5 rounded-lg">
                          Row {e.row}: {e.message}
                        </li>
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
          <div className="p-6">
            <ImportPanel onImported={() => { refetchBatches(); setActiveTab('batches'); }} />
          </div>
        )}
      </div>
    </div>
  );
}