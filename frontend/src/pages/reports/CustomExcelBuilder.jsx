import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileSpreadsheet, Download, RefreshCw, ChevronDown, Search,
  X, Link2, AlertTriangle, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api.js';
import useAuthStore from '../../store/authStore.js';

// Maps primary table → available join tables
const JOIN_OPTIONS = {
  CASE: [
    { value: 'ARREST',  label: 'FIR + Arrests (joined by FIR No.)' },
    { value: 'MISSING', label: 'FIR + Missing Persons (joined by DD No.)' },
  ],
};

const TABLE_LABELS = {
  CASE:     'FIR Master (CASE)',
  ARREST:   'Arrest Master (ARREST)',
  PCR_CALL: 'PCR / Kalandra (PCR_CALL)',
  MISSING:  'Missing Persons (MISSING)',
  UIDB:     'Unidentified Bodies (UIDB)',
};

const today = new Date().toISOString().split('T')[0];
const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

// Shared input style
const inputCls = 'w-full bg-[#0d1117] border border-[#1c2430] rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-[#e53e3e] transition-all font-semibold shadow-sm';
const labelCls = 'text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5';

function MultiSelectDropdown({ label, options, selected, onToggle, onSelectAll, search, setSearch, open, setOpen, dropRef }) {
  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div ref={dropRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-[#0d1117] border border-[#1c2430] rounded-xl text-xs text-slate-200 px-3 py-2.5 outline-none focus:border-[#e53e3e] transition-all cursor-pointer font-semibold"
      >
        <span className="truncate text-left">{label}</span>
        <ChevronDown size={13} className="text-slate-500 shrink-0" />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#10141d] border border-[#1c2430] rounded-xl shadow-xl overflow-hidden flex flex-col max-h-72">
          <div className="p-2 border-b border-[#1c2430] flex flex-col gap-1.5 bg-[#0d1117]">
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#10141d] border border-[#1c2430] rounded-lg pl-6 pr-2 py-1 text-[11px] text-slate-200 outline-none focus:border-[#e53e3e] font-semibold"
              />
            </div>
            <div className="flex items-center justify-between text-[10px] px-0.5 text-slate-500">
              <button type="button" onClick={onSelectAll} className="hover:text-[#e53e3e] transition-colors font-bold">
                {selected.size === options.length ? 'Deselect All' : 'Select All'}
              </button>
              <span>{selected.size} of {options.length} selected</span>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 scrollbar-thin">
            {filtered.length === 0 && (
              <p className="text-[11px] text-slate-600 text-center py-4">No matches</p>
            )}
            {filtered.map(opt => (
              <label
                key={opt.value}
                className="flex items-center gap-2 px-3 py-2 text-[11px] hover:bg-[#e53e3e]/5 transition-colors cursor-pointer select-none text-slate-300"
              >
                <input
                  type="checkbox"
                  checked={selected.has(opt.value)}
                  onChange={() => onToggle(opt.value)}
                  className="rounded border-[#1c2430] w-3.5 h-3.5 cursor-pointer accent-[#e53e3e]"
                />
                <span className="flex-1 font-semibold">{opt.label}</span>
                {opt.badge && (
                  <span className="text-[9px] font-bold px-1 py-px rounded border bg-amber-900/30 text-amber-400 border-amber-700/40 shrink-0">
                    {opt.badge}
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomExcelBuilder() {
  const { user } = useAuthStore();
  const role = user?.role || 'HC';

  const [table, setTable]       = useState('CASE');
  const [join, setJoin]         = useState(null);
  const [selectedFields, setSelectedFields] = useState(new Set());
  const [dateFrom, setDateFrom] = useState(sevenDaysAgo);
  const [dateTo, setDateTo]     = useState(today);
  const [psId, setPsId]         = useState(null);

  const [fieldDropOpen, setFieldDropOpen] = useState(false);
  const [fieldSearch, setFieldSearch]     = useState('');
  const fieldDropRef = useRef(null);

  const [jobState, setJobState] = useState({ status: 'idle', jobId: null });

  useEffect(() => {
    const handler = e => {
      if (fieldDropRef.current && !fieldDropRef.current.contains(e.target)) setFieldDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: metaRes, isLoading: metaLoading, error: metaError } = useQuery({
    queryKey: ['report-builder-metadata'],
    queryFn: () => api.get('/reports/builder/metadata').then(r => r.data.data),
    staleTime: 300000,
  });

  const { data: stationsList = [] } = useQuery({
    queryKey: ['report-builder-stations'],
    queryFn: () => api.get('/reports/builder/lookups/police-stations').then(r => r.data.data || []),
    staleTime: 600000,
    enabled: ['DISTRICT_OFFICER', 'JCP', 'SCP', 'HQ_ANALYST', 'HQ_ADMIN', 'SYSTEM_ADMIN'].includes(role),
  });

  const fieldOptions = useMemo(() => {
    if (!metaRes?.tables) return [];
    const tables = join ? [table, join] : [table];
    const opts = [];
    for (const t of tables) {
      const tData = metaRes.tables[t];
      if (!tData) continue;
      for (const f of tData.fields) {
        opts.push({
          value: `${t}.${f.key}`,
          label: tables.length > 1 ? `[${t}] ${f.label_en}` : f.label_en,
          badge: f.is_pii ? 'PII' : null,
        });
      }
      for (const f of (tData.system_fields || [])) {
        opts.push({
          value: `${t}.${f.key}`,
          label: tables.length > 1 ? `[${t}] ${f.label_en}` : f.label_en,
          badge: null,
        });
      }
    }
    return opts;
  }, [metaRes, table, join]);

  const changeTable = (newTable) => {
    setTable(newTable);
    setJoin(null);
    setSelectedFields(new Set());
    setFieldSearch('');
  };

  const changeJoin = (newJoin) => {
    setJoin(newJoin || null);
    setSelectedFields(new Set());
    setFieldSearch('');
  };

  const toggleField = (val) => {
    setSelectedFields(prev => {
      const next = new Set(prev);
      if (next.has(val)) next.delete(val); else next.add(val);
      return next;
    });
  };

  const toggleAllFields = () => {
    if (selectedFields.size === fieldOptions.length) {
      setSelectedFields(new Set());
    } else {
      setSelectedFields(new Set(fieldOptions.map(o => o.value)));
    }
  };

  const handleExport = async () => {
    if (selectedFields.size === 0) {
      toast.error('Select at least one field to export.');
      return;
    }
    if (!dateFrom || !dateTo) {
      toast.error('Please set a date range.');
      return;
    }

    const hasJoin = !!join;
    const fields = Array.from(selectedFields).map(ref => {
      const [t, f] = ref.split('.');
      return hasJoin ? { field: f, table: t } : f;
    });

    const conditions = [];
    if (dateFrom) conditions.push({ field: '_record_date', table, operator: 'AFTER',  value: dateFrom });
    if (dateTo)   conditions.push({ field: '_record_date', table, operator: 'BEFORE', value: dateTo });
    if (psId)     conditions.push({ field: '_ps_id',       table, operator: 'EQ',     value: psId });

    const payload = {
      table,
      ...(join && { join }),
      fields,
      filters: conditions.length > 0 ? { logic: 'AND', conditions } : undefined,
      format: 'xlsx',
    };

    setJobState({ status: 'pending', jobId: null });

    try {
      const res = await api.post('/reports/builder/export', payload);
      const jobId = res.data?.data?.job_id;
      if (!jobId) throw new Error('No job ID returned');
      setJobState({ status: 'pending', jobId });

      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('access_token');
      const authHeaders = { 'Authorization': token ? `Bearer ${token}` : '' };
      const loadingToastId = toast.loading('Building Excel report…');

      let attempts = 0;
      const iv = setInterval(async () => {
        attempts++;
        try {
          const sr = await fetch(`${BASE_URL}/reports/status/${jobId}`, { headers: authHeaders });
          const sj = await sr.json();
          const status = sj?.data?.job?.status || sj?.data?.status;
          if (status === 'READY') {
            clearInterval(iv);
            toast.dismiss(loadingToastId);
            setJobState({ status: 'ready', jobId });
          } else if (status === 'FAILED' || attempts > 40) {
            clearInterval(iv);
            toast.dismiss(loadingToastId);
            toast.error('Report generation failed.');
            setJobState({ status: 'failed', jobId });
          }
        } catch {
          clearInterval(iv);
          toast.dismiss(loadingToastId);
          toast.error('Lost connection while polling report status.');
          setJobState({ status: 'failed', jobId });
        }
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start report generation.');
      setJobState({ status: 'idle', jobId: null });
    }
  };

  const handleDownload = async () => {
    const { jobId } = jobState;
    if (!jobId) return;
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${BASE_URL}/reports/download/${jobId}`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const blob = new Blob([await res.arrayBuffer()], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PHAROS_${table}${join ? `_${join}` : ''}_${dateFrom}_${dateTo}.xlsx`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => { link.remove(); URL.revokeObjectURL(url); }, 500);
      toast.success('Excel downloaded!');
      setJobState({ status: 'idle', jobId: null });
    } catch (err) {
      toast.error('Download failed: ' + err.message);
    }
  };

  const joinOptions = JOIN_OPTIONS[table] || [];
  const isExporting = jobState.status === 'pending';

  if (metaLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#e53e3e] mr-3" />
        Loading field registry…
      </div>
    );
  }

  if (metaError) {
    return (
      <div className="flex items-center gap-3 p-4 border border-red-800/40 bg-red-950/20 rounded-xl text-sm text-red-400">
        <AlertTriangle size={16} />
        <span>Failed to load field metadata. Check that the backend is running.</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-sans text-slate-200">

      {/* ── Record Type & Columns ─────────────────────────────────────────── */}
      <div style={{ background: '#10141d', border: '1px solid #1c2430' }} className="rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-[#1c2430] pb-2 flex items-center gap-1.5">
          <FileSpreadsheet size={13} className="text-[#e53e3e]" />
          <span>Record Type &amp; Columns</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Primary table */}
          <div>
            <label className={labelCls}>Primary Record Type</label>
            <select
              value={table}
              onChange={e => changeTable(e.target.value)}
              className={inputCls + ' cursor-pointer'}
            >
              {Object.entries(TABLE_LABELS).map(([val, lbl]) => (
                <option key={val} value={val} style={{ background: '#10141d' }}>{lbl}</option>
              ))}
            </select>
          </div>

          {/* Join */}
          <div>
            <label className={labelCls}>
              <Link2 size={10} className="inline mr-1" />
              Link / Join Table
              <span className="text-[9px] font-normal normal-case text-slate-600 ml-1">(optional)</span>
            </label>
            <select
              value={join || ''}
              onChange={e => changeJoin(e.target.value || null)}
              disabled={joinOptions.length === 0}
              className={inputCls + ' cursor-pointer disabled:opacity-40'}
            >
              <option value="" style={{ background: '#10141d' }}>No join — single table</option>
              {joinOptions.map(o => (
                <option key={o.value} value={o.value} style={{ background: '#10141d' }}>{o.label}</option>
              ))}
            </select>
            {joinOptions.length === 0 && (
              <p className="text-[10px] text-slate-600 mt-1">No joins available for {table}</p>
            )}
          </div>

          {/* Field multi-select */}
          <div>
            <label className={labelCls}>Columns to Export</label>
            <MultiSelectDropdown
              label={
                selectedFields.size === 0
                  ? 'Select fields…'
                  : selectedFields.size === fieldOptions.length
                    ? `All Fields (${fieldOptions.length})`
                    : `${selectedFields.size} Field${selectedFields.size !== 1 ? 's' : ''} Selected`
              }
              options={fieldOptions}
              selected={selectedFields}
              onToggle={toggleField}
              onSelectAll={toggleAllFields}
              search={fieldSearch}
              setSearch={setFieldSearch}
              open={fieldDropOpen}
              setOpen={setFieldDropOpen}
              dropRef={fieldDropRef}
            />
          </div>
        </div>

        {/* Selected field chips */}
        {selectedFields.size > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {Array.from(selectedFields).map(ref => {
              const opt = fieldOptions.find(o => o.value === ref);
              return (
                <span
                  key={ref}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ background: 'rgba(229,62,62,0.12)', color: '#e53e3e', border: '1px solid rgba(229,62,62,0.2)' }}
                >
                  {opt?.label || ref}
                  {opt?.badge && (
                    <span className="text-[8px] font-bold bg-amber-900/30 text-amber-400 rounded px-0.5">{opt.badge}</span>
                  )}
                  <button type="button" onClick={() => toggleField(ref)} className="hover:text-red-300 transition-colors cursor-pointer">
                    <X size={9} />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div style={{ background: '#10141d', border: '1px solid #1c2430' }} className="rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-[#1c2430] pb-2">
          Filters
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className={inputCls}
            />
          </div>
          {stationsList.length > 0 && (
            <div>
              <label className={labelCls}>
                Police Station
                <span className="text-[9px] font-normal normal-case text-slate-600 ml-1">(optional)</span>
              </label>
              <select
                value={psId || ''}
                onChange={e => setPsId(e.target.value || null)}
                className={inputCls + ' cursor-pointer'}
              >
                <option value="" style={{ background: '#10141d' }}>All Stations</option>
                {stationsList.map(ps => (
                  <option key={ps.id} value={ps.id} style={{ background: '#10141d' }}>{ps.name_en} ({ps.code})</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ── Export Button & Status ─────────────────────────────────────────── */}
      <div className="flex items-center gap-4 flex-wrap">
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting || selectedFields.size === 0}
          style={{ background: '#e53e3e', borderColor: '#e53e3e' }}
          className="text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95 hover:brightness-110"
        >
          {isExporting ? (
            <><RefreshCw size={14} className="animate-spin" /><span>Building Report…</span></>
          ) : (
            <><FileSpreadsheet size={14} /><span>Export as Excel</span></>
          )}
        </button>

        {jobState.status === 'ready' && (
          <div className="flex items-center gap-3 rounded-xl px-4 py-2" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold text-emerald-400">Report ready!</span>
            <button
              type="button"
              onClick={handleDownload}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer border-none shadow-sm active:scale-95"
            >
              <Download size={11} />
              <span>Download Excel</span>
            </button>
          </div>
        )}

        {jobState.status === 'failed' && (
          <div className="flex items-center gap-2 text-red-400 text-xs font-semibold">
            <AlertTriangle size={14} />
            <span>Export failed. Try again.</span>
          </div>
        )}

        {selectedFields.size === 0 && (
          <p className="text-[11px] text-slate-600 font-semibold">
            Select at least one field to enable export.
          </p>
        )}
      </div>
    </div>
  );
}
