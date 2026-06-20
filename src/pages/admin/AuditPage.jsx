import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, Filter, Clock, User, Database, FileEdit, LogIn, Send, AlertTriangle } from 'lucide-react';
import api from '../../utils/api.js';

const ACTION_STYLES = {
  CREATE:   { label: 'CREATE',   cls: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40', icon: FileEdit },
  UPDATE:   { label: 'UPDATE',   cls: 'bg-blue-950/40 text-blue-400 border-blue-800/40',         icon: FileEdit },
  OVERRIDE: { label: 'OVERRIDE', cls: 'bg-amber-950/40 text-amber-400 border-amber-800/40',      icon: AlertTriangle },
  SUBMIT:   { label: 'SUBMIT',   cls: 'bg-violet-950/40 text-violet-400 border-violet-800/40',   icon: Send },
  LOGIN:    { label: 'LOGIN',    cls: 'bg-cyan-950/40 text-cyan-400 border-cyan-800/40',         icon: LogIn },
  DELETE:   { label: 'DELETE',   cls: 'bg-red-950/40 text-red-400 border-red-800/40',            icon: AlertTriangle },
};

const DEFAULT_STYLE = { label: '—', cls: 'bg-zinc-800 text-zinc-400 border-zinc-700', icon: Database };

const PAGE_SIZE = 15;

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('ALL');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'audit', page, actionFilter],
    queryFn: async () => {
      const res = await api.get('/audit');
      const logs = res.data?.data?.logs || res.data?.data || [];
      return { logs, total: logs.length };
    },
    staleTime: 30 * 1000,
    retry: 1,
  });

  const rawLogs = data?.logs || [];

  const filteredLogs = actionFilter === 'ALL'
    ? rawLogs
    : rawLogs.filter((l) => l.action === actionFilter);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const pagedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = (f) => {
    setActionFilter(f);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-zinc-100 flex items-center gap-2">
          <ShieldAlert className="text-[#cca43b]" />
          <span>Immutable Audit Ledger</span>
        </h1>
        <p className="text-zinc-400 text-xs mt-1">
          Append-only transaction log. Every CREATE, UPDATE, OVERRIDE, and SUBMIT action is recorded with identity, timestamp, and IP address.
        </p>
      </div>

      {/* ── Action Filters ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-zinc-500 text-xs font-semibold flex items-center gap-1">
          <Filter size={12} /> Filter:
        </span>
        {['ALL', 'CREATE', 'UPDATE', 'OVERRIDE', 'SUBMIT', 'LOGIN', 'DELETE'].map((action) => {
          const style = ACTION_STYLES[action] || DEFAULT_STYLE;
          const isActive = actionFilter === action;
          return (
            <button
              key={action}
              onClick={() => handleFilterChange(action)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                isActive
                  ? 'bg-[#cca43b] text-zinc-950 border-[#cca43b] shadow-md'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600'
              }`}
            >
              {action}
            </button>
          );
        })}

        <span className="ml-auto text-zinc-500 text-[11px] font-mono">
          {filteredLogs.length} entries
        </span>
      </div>

      {/* ── Log Table ─────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#cca43b] mb-4" />
          <p className="text-sm">Loading immutable audit trail...</p>
        </div>
      ) : isError ? (
        <div className="border border-red-900/60 bg-red-950/20 rounded-xl p-6 text-center">
          <AlertTriangle size={32} className="mx-auto text-red-500 mb-2" />
          <p className="text-red-400 text-sm font-semibold">Could not retrieve audit logs</p>
          <p className="text-red-600 text-xs mt-1">Ensure you have HQ_ADMIN or SYSTEM_ADMIN privileges and the backend is reachable.</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-xl p-16 text-center text-zinc-500">
          <ShieldAlert size={48} className="mx-auto text-zinc-700 mb-3" />
          <p className="text-sm font-semibold">No audit entries found</p>
          <p className="text-xs text-zinc-600 mt-1">Actions will appear here as officers use the system.</p>
        </div>
      ) : (
        <div className="border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-950/60 text-zinc-400 uppercase font-semibold border-b border-zinc-800 tracking-wider">
                  <th className="p-3.5 pl-5">Action</th>
                  <th className="p-3.5">Table / Entity</th>
                  <th className="p-3.5">Performer Role</th>
                  <th className="p-3.5">Field Modified</th>
                  <th className="p-3.5">IP Address</th>
                  <th className="p-3.5">Reason / Comment</th>
                  <th className="p-3.5 pr-5 text-right">Timestamp (IST)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {pagedLogs.map((log) => {
                  const style = ACTION_STYLES[log.action] || DEFAULT_STYLE;
                  const IconComp = style.icon;
                  return (
                    <tr key={log.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="p-3.5 pl-5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${style.cls}`}>
                          <IconComp size={9} />
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-zinc-400 text-[11px]">{log.table_name || '—'}</td>
                      <td className="p-3.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
                          {log.changed_by_role || log.role || '—'}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-amber-400 text-[11px]">{log.field_name || 'Full Payload'}</td>
                      <td className="p-3.5 font-mono text-zinc-500 text-[11px]">{log.ip_address || '—'}</td>
                      <td className="p-3.5 text-zinc-500 italic max-w-[200px] truncate" title={log.reason}>
                        {log.reason || '—'}
                      </td>
                      <td className="p-3.5 pr-5 text-right font-mono text-zinc-500 text-[11px] whitespace-nowrap">
                        {log.changed_at
                          ? new Date(log.changed_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800 bg-zinc-950/40">
              <span className="text-zinc-500 text-xs">
                Page {page} of {totalPages} · {filteredLogs.length} total entries
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 disabled:opacity-40 text-xs cursor-pointer transition-colors"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 disabled:opacity-40 text-xs cursor-pointer transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
