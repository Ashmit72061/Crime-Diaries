import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Archive, Upload, Eye, CheckCircle2, XCircle,
  AlertTriangle, Loader2, Clock, RefreshCw, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore.js';
import api from '../../utils/api.js';

// ── Status Badge ──────────────────────────────────────────────────────────────
const STATUS_CLS = {
  PENDING:   'bg-amber-500/10 text-amber-500 border-amber-500/20',
  APPROVED:  'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  REJECTED:  'bg-rose-500/10 text-rose-500 border-rose-500/20',
  COMPLETED: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
};

function StatusBadge({ status }) {
  const cls = STATUS_CLS[status] || 'bg-[var(--bg-page-main)] border-[var(--border-card-theme)] text-[var(--text-main-theme)]/80';
  return (
    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${cls}`}>
      {status || '—'}
    </span>
  );
}

// ── Import Batch Table ────────────────────────────────────────────────────────
function BatchTable({
  batches,
  isLoading,
  onViewBatch,
  onImportClick
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-14 text-[var(--text-main-theme)] opacity-80 font-semibold font-sans">
        <Loader2 size={20} className="animate-spin mr-2 text-[var(--accent-color)]" /> Loading batches…
      </div>
    );
  }
  if (!batches.length) {
    return (
      <div className="text-center py-16 text-[#A0AEC0]">
        <Archive size={40} className="mx-auto mb-3 opacity-20 text-[#003087]" />
        <p className="text-sm font-medium">No import batches found.</p>
        <p className="text-xs mt-1 text-[#CBD5E0]">Upload a file in the New Import tab to get started.</p>
        <button
          type="button"
          onClick={onImportClick}
          className="mt-4 px-4 py-2 rounded-lg bg-[#003087] text-white text-sm hover:bg-[#0046C0]"
>
  Import CSV
</button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs font-sans">
        <thead>
          <tr className="bg-[var(--bg-page-main)]/80 text-[var(--text-main-theme)] uppercase font-semibold border-b border-[var(--border-card-theme)]/70 tracking-wider">
            <th className="p-3 pl-6 text-[var(--text-main-theme)] font-bold">Batch ID</th>
            <th className="p-3 text-[var(--text-main-theme)] font-bold">Record Type</th>
            <th className="p-3 text-[var(--text-main-theme)] font-bold">Total Rows</th>
            <th className="p-3 text-[var(--text-main-theme)] font-bold">Imported</th>
            <th className="p-3 text-[var(--text-main-theme)] font-bold">Status</th>
            <th className="p-3 text-[var(--text-main-theme)] font-bold">Imported At</th>
            <th className="p-3 pr-6 text-right text-[var(--text-main-theme)] font-bold">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-card-theme)]/30 text-[var(--text-main-theme)]">
          {batches.map((batch) => (
            <tr
              key={batch.id}
              className="hover:bg-[var(--bg-page-main)]/40 transition-colors duration-150"
            >
              <td className="p-3 pl-6 font-mono text-[var(--text-main-theme)] opacity-60 text-[10px]">{batch.id?.slice(0, 12)}…</td>
              <td className="p-3 font-bold text-[var(--accent-color)]">{batch.record_type || '—'}</td>
              <td className="p-3 tabular-numbers text-[var(--text-main-theme)] opacity-80 font-semibold">{batch.total_rows ?? '—'}</td>
              <td className="p-3 tabular-numbers text-emerald-500 font-bold">{batch.imported_count ?? '—'}</td>
              <td className="p-3"><StatusBadge status={batch.status} /></td>
              <td className="p-3 font-mono text-[var(--text-main-theme)] opacity-70 text-[10px]">
                {batch.created_at
                  ? new Date(batch.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                  : '—'}
              </td>
              <td className="p-3 pr-6 text-right">
                <button
                  type="button"
                  onClick={() => onViewBatch(batch)}
                  className="inline-flex items-center gap-1.5 text-[var(--text-main-theme)] opacity-95 hover:text-[var(--accent-color)] hover:bg-[var(--bg-page-main)]/80 border border-[var(--border-card-theme)] bg-transparent px-2.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer ml-auto font-bold active:scale-95 shadow-sm"
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
      <div className="flex items-center justify-center p-14 text-[var(--text-main-theme)] opacity-80 font-semibold font-sans">
        <Loader2 size={20} className="animate-spin mr-2 text-[var(--accent-color)]" /> Loading amendments…
      </div>
    );
  }
  if (!amendments.length) {
    return (
      <div className="text-center py-16 text-[var(--text-main-theme)] opacity-60 font-semibold font-sans">
        <Clock size={40} className="mx-auto mb-3 opacity-30 text-[var(--accent-color)]" />
        <p className="text-sm font-bold text-[var(--text-main-theme)]">No pending amendments.</p>
        <p className="text-xs mt-1 text-[var(--text-main-theme)] opacity-70">All amendment requests are up to date.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs font-sans">
        <thead>
          <tr className="bg-[var(--bg-page-main)]/80 text-[var(--text-main-theme)] uppercase font-semibold border-b border-[var(--border-card-theme)]/70 tracking-wider">
            <th className="p-3 pl-6 text-[var(--text-main-theme)] font-bold">Amendment ID</th>
            <th className="p-3 text-[var(--text-main-theme)] font-bold">Record Ref</th>
            <th className="p-3 text-[var(--text-main-theme)] font-bold">Reason</th>
            <th className="p-3 text-[var(--text-main-theme)] font-bold">Requested By</th>
            <th className="p-3 text-[var(--text-main-theme)] font-bold">Status</th>
            <th className="p-3 pr-6 text-right text-[var(--text-main-theme)] font-bold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-card-theme)]/30 text-[var(--text-main-theme)]">
          {amendments.map((am) => (
            <tr
              key={am.id}
              className="hover:bg-[var(--bg-page-main)]/40 transition-colors duration-150"
            >
              <td className="p-3 pl-6 font-mono text-[var(--text-main-theme)] opacity-65 text-[10px]">{am.id?.slice(0, 12)}…</td>
              <td className="p-3 font-mono text-amber-500 font-bold">{am.record_id?.slice(0, 10) || '—'}…</td>
              <td className="p-3 max-w-[200px] truncate text-[var(--text-main-theme)] opacity-85 font-semibold" title={am.reason}>{am.reason || '—'}</td>
              <td className="p-3 text-[var(--text-main-theme)] opacity-70 font-semibold">{am.requested_by || '—'}</td>
              <td className="p-3"><StatusBadge status={am.status} /></td>
              <td className="p-3 pr-6 text-right font-semibold">
                {am.status === 'PENDING' ? (
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => onApprove(am.id)}
                      className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer font-bold border border-emerald-500/30 shadow-sm active:scale-95"
                      title="Approve"
                    >
                      <CheckCircle2 size={12} /> Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => onReject(am.id)}
                      className="inline-flex items-center gap-1 text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer font-bold border border-rose-500/30 shadow-sm active:scale-95"
                      title="Reject"
                    >
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                ) : (
                  <span className="text-[var(--text-main-theme)] opacity-30">—</span>
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
    <div className="border border-[var(--border-card-theme)] bg-[var(--bg-page-main)]/60 backdrop-blur-md rounded-2xl p-6 space-y-5 text-xs shadow-sm font-sans">
      <h3 className="font-bold text-[var(--text-main-theme)] flex items-center gap-2 text-sm font-display">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--bg-page-main)]/80 border border-[var(--border-card-theme)]/85">
          <Upload size={15} className="text-[var(--accent-color)]" />
        </span>
        Import Legacy Data (Excel / CSV)
      </h3>

      <div className="grid grid-cols-2 gap-4 text-[var(--text-main-theme)] font-semibold">
        <div className="space-y-1.5">
          <label className="text-[var(--text-main-theme)] opacity-80 font-bold">Record Type</label>
          <select
            value={recordType}
            onChange={(e) => setRecordType(e.target.value)}
            className="w-full bg-[var(--bg-page-main)] border border-[var(--border-card-theme)] rounded-xl px-3 py-2 text-[var(--text-main-theme)] outline-none focus:border-[var(--accent-color)] transition-all cursor-pointer shadow-sm font-bold"
          >
            {['CASE', 'ARREST', 'PCR_CALL', 'MISSING', 'UIDB'].map((rt) => (
              <option key={rt} value={rt} className="bg-[var(--bg-page-main)] text-[var(--text-main-theme)]">{rt}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[var(--text-main-theme)] opacity-80 font-bold">File (Excel / CSV)</label>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full bg-[var(--bg-page-main)] border border-[var(--border-card-theme)] rounded-xl px-3 py-1.5 text-[var(--text-main-theme)] opacity-80 cursor-pointer text-[11px] shadow-sm file:mr-2 file:rounded-lg file:border-0 file:bg-[var(--bg-page-main)]/80 file:text-[var(--accent-color)] file:font-bold file:px-2 file:py-0.5"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[var(--text-main-theme)] opacity-60 font-semibold">
          File will be processed in background. Check Batches tab for status.
        </p>
        <button
          type="button"
          disabled={!file || importMutation.isPending}
          onClick={() => importMutation.mutate()}
          className="flex items-center gap-1.5 bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold px-5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none shadow-sm active:scale-95"
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
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('batches'); // 'batches' | 'amendments' | 'import'
  const [selectedBatch, setSelectedBatch] = useState(null);

  const getThemeClass = () => {
    const role = user?.role;
    switch (role) {
      case 'PS':
      case 'HC':
        return 'theme-hc-page';
      case 'SHO':
        return 'theme-sho-page';
      case 'ACP':
        return 'theme-acp-page';
      case 'DISTRICT':
      case 'DISTRICT_OFFICER':
        return 'theme-district-page';
      case 'HQ':
      case 'HQ_ANALYST':
      case 'HQ_ADMIN':
        return 'theme-hq-page';
      case 'SYSTEM_ADMIN':
        return 'theme-admin-page';
      default:
        return 'theme-shared-page';
    }
  };

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
    <div className={`min-h-screen ${getThemeClass()} page-bg space-y-6 p-6 font-sans text-[var(--text-main-theme)]`}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="hero-banner-gradient px-8 py-8 shadow-lg relative overflow-hidden rounded-2xl">
        {/* subtle decorative ring */}
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full border border-white/5" />
        <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full border border-white/5" />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-[10px] font-semibold text-white/80 uppercase tracking-wider">
              <Archive size={11} /> Legacy Records
            </span>
            <h1 className="mt-3 text-2xl font-bold text-white flex items-center gap-3 font-display">
              Legacy Data Manager
            </h1>
            <p className="text-white/60 text-xs mt-1.5 max-w-lg font-semibold">
              Import historical police records from legacy Excel/CSV registers, review batch statuses, and process data correction amendments.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { refetchBatches(); refetchAmends(); }}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer hover:shadow-md shrink-0 active:scale-95"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-[var(--bg-page-main)]/60 backdrop-blur-md rounded-2xl p-1.5 shadow-sm border border-[var(--border-card-theme)] w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedBatch(null); }}
            className={`relative px-5 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer border-none ${
              activeTab === tab.id
                ? 'bg-[var(--accent-color)] text-white shadow-md shadow-[var(--accent-glow)]'
                : 'text-[var(--text-main-theme)] opacity-80 hover:text-[var(--accent-color)] hover:bg-[var(--bg-page-main)]/80 bg-transparent'
            }`}
          >
            {tab.label}
            {tab.id === 'amendments' && amendments.filter((a) => a.status === 'PENDING').length > 0 && (
              <span className="ml-1.5 bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {amendments.filter((a) => a.status === 'PENDING').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-[var(--bg-page-main)]/60 border border-[var(--border-card-theme)] backdrop-blur-md shadow-sm overflow-hidden transition-all duration-200">

        {activeTab === 'batches' && !selectedBatch && (
          <BatchTable
            batches={batches}
            isLoading={batchLoading}
            onViewBatch={(b) => setSelectedBatch(b)}
            onImportClick={() => {
              setActiveTab('import');

              setTimeout(() => {
                document.querySelector('input[type="file"]')?.click();
              }, 100);
            }}
/>
        )}

        {activeTab === 'batches' && selectedBatch && (
          <div className="p-6 space-y-5 text-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedBatch(null)}
                className="inline-flex items-center gap-1.5 text-[var(--accent-color)] hover:bg-[var(--bg-page-main)]/85 border border-[var(--border-card-theme)] bg-transparent px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer font-bold shadow-sm active:scale-95"
              >
                ← Back to Batches
              </button>
              <span className="text-[var(--border-card-theme)]">·</span>
              <span className="text-[var(--text-main-theme)] opacity-60 font-mono font-semibold">Batch: {selectedBatch.id?.slice(0, 20)}…</span>
            </div>

            {!batchDetail ? (
              <div className="flex items-center gap-2 text-[var(--text-main-theme)] opacity-80 p-8 justify-center font-semibold">
                <Loader2 size={16} className="animate-spin text-[var(--accent-color)]" /> Loading batch detail…
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
                      className="border border-[var(--border-card-theme)] bg-[var(--bg-page-main)]/60 rounded-2xl p-4 hover:border-[var(--accent-color)]/40 hover:shadow-md transition-all duration-200"
                    >
                      <div className="text-[var(--text-main-theme)] opacity-60 text-[10px] font-bold uppercase tracking-wider mb-1">{label}</div>
                      <div className="text-[var(--text-main-theme)] font-bold text-sm">{value ?? '—'}</div>
                    </div>
                  ))}
                </div>

                {batchDetail.errors?.length > 0 && (
                  <div className="border border-rose-500/30 bg-rose-500/5 rounded-2xl p-5 shadow-sm">
                    <p className="text-rose-500 font-bold mb-3 flex items-center gap-2 text-sm">
                      <AlertTriangle size={14} /> Import Errors ({batchDetail.errors.length})
                    </p>
                    <ul className="text-rose-500/90 space-y-1 max-h-36 overflow-y-auto font-semibold">
                      {batchDetail.errors.map((e, i) => (
                        <li key={i} className="font-mono text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-500 px-3 py-1.5 rounded-lg">
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