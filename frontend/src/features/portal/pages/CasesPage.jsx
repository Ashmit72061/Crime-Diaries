import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore.js';
import { ROUTES } from '../../../utils/constants.js';
import axios from 'axios';
import Papa from 'papaparse';
import {
  Plus, Search, Calendar, FileText, ChevronRight, Save, Send,
  ArrowLeft, Edit3, ShieldAlert, Clock, AlertTriangle, FileSpreadsheet, ListFilter,
  Download, UploadCloud
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── SUB-COMPONENT: CASE LIST ──────────────────────────────────────────────────
const CasesList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchCases = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (statusFilter) params.submissionStatus = statusFilter;

      const response = await axios.get('/api/v1/records/cases', { params });
      setCases(response.data.data.cases);
    } catch (err) {
      toast.error('Failed to load cases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [dateFrom, dateTo, statusFilter]);

  const triggerExport = () => {
    const query = new URLSearchParams({
      recordType: 'cases',
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
    }).toString();
    window.open(`/api/v1/analytics/export?${query}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-zinc-100 flex items-center gap-2">
            <FileText className="text-amber-500" />
            <span>Cases (FIR) Register</span>
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Browse and review Case / FIR operational entries within your jurisdiction.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={triggerExport}
            className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-zinc-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <FileSpreadsheet size={16} className="text-emerald-500" />
            <span>Export list</span>
          </button>

          {user?.role === 'ps' && (
            <Link
              to="new"
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
            >
              <Plus size={16} />
              <span>Record new case</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card p-4 rounded-xl border border-zinc-800 flex flex-wrap items-center gap-4 bg-zinc-900/20">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Search UID, FIR, GD, Accused..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 focus:border-amber-500 focus:outline-none rounded-lg text-xs text-zinc-200 placeholder-zinc-500"
          />
        </div>

        {/* Date From */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Date To */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Submission Status */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft (Editable)</option>
            <option value="submitted">Submitted (Locked)</option>
          </select>
        </div>

        {/* Manual search trigger */}
        <button
          onClick={fetchCases}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ListFilter size={14} />
          <span>Apply</span>
        </button>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(idx => (
            <div key={idx} className="h-24 bg-zinc-900/30 border border-zinc-850 animate-pulse rounded-xl"></div>
          ))}
        </div>
      ) : cases.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-2xl border border-zinc-850">
          <AlertTriangle className="mx-auto text-amber-500/60 mb-3" size={32} />
          <h3 className="font-bold text-zinc-300">No records found</h3>
          <p className="text-zinc-500 text-xs mt-1">Adjust filters or register a new case entry.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map((c) => (
            <div
              key={c.id}
              onClick={() => navigate(String(c.id))}
              className="glass-card p-5 rounded-xl border border-zinc-800 bg-zinc-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:border-amber-500/30 transition-all"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-bold text-xs text-amber-500 font-mono bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                    {c.uid}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider bg-zinc-800/80 px-2 py-1 rounded border border-zinc-700/50">
                    {c.ps_name}
                  </span>
                  <span className="text-zinc-500 text-xs">
                    GD No: <span className="text-zinc-300 font-medium">{c.gd_no}</span>
                  </span>
                  <span className="text-zinc-500 text-xs">
                    ({c.gd_date})
                  </span>
                </div>

                <div className="text-sm font-semibold text-zinc-200">
                  {c.act_name} {c.section_text} —{' '}
                  <span className="text-amber-500 font-medium">
                    {c.override_code || c.case_head_code}
                  </span>
                </div>

                <p className="text-zinc-400 text-xs line-clamp-1">
                  Facts: {c.brief_facts}
                </p>
              </div>

              {/* Status and actions */}
              <div className="flex items-center justify-between md:justify-end gap-4 border-t border-zinc-850 pt-3 md:border-none md:pt-0">
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${c.submission_status === 'submitted' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                    {c.submission_status}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    IO: {c.io_name}
                  </span>
                </div>

                <ChevronRight size={18} className="text-zinc-500" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── SUB-COMPONENT: CASE DETAILS & OVERRIDE ──────────────────────────────────────
const CaseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  // Override Modal States
  const [overrideModal, setOverrideModal] = useState(false);
  const [caseHeadsList, setCaseHeadsList] = useState([]);
  const [selectedHead, setSelectedHead] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/records/cases/${id}`);
      setDetails(response.data.data);
    } catch (err) {
      toast.error('Failed to load case details.');
      navigate(ROUTES.CASES);
    } finally {
      setLoading(false);
    }
  };

  const loadCaseHeads = async () => {
    try {
      const response = await axios.get('/api/v1/admin/case-heads');
      const filtered = response.data.data.caseHeads.filter(ch => ch.category === 'Cases');
      setCaseHeadsList(filtered);
    } catch (e) {
      toast.error('Failed to load classifications.');
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHead) {
      toast.error('Please select a new classification.');
      return;
    }
    if (overrideReason.trim().length < 10) {
      toast.error('Reason must be at least 10 characters.');
      return;
    }

    try {
      await axios.patch(`/api/v1/records/cases/${id}/override`, {
        caseHeadId: selectedHead,
        reason: overrideReason
      });
      toast.success('Case Head overridden successfully.');
      setOverrideModal(false);
      fetchDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Override failed.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Clock className="animate-spin text-amber-500" size={32} />
      </div>
    );
  }

  const c = details?.case;
  const cfs = details?.customFields || {};
  const logs = details?.auditLogs || [];

  return (
    <div className="space-y-8">
      {/* Header breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-100 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
            Record Registry
          </span>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            Case Detail: <span className="text-amber-500 font-mono">{c?.uid}</span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core fields card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 md:p-8 rounded-2xl border border-zinc-800 space-y-6">
            <h2 className="text-md font-bold text-zinc-200 border-b border-zinc-800 pb-3 flex items-center justify-between">
              <span>Primary Details</span>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${c?.submission_status === 'submitted' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                {c?.submission_status}
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Police Station</span>
                <span className="font-semibold text-zinc-200">{c?.ps_name} ({c?.district_name})</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">GD Ref Number</span>
                <span className="font-semibold text-zinc-200">{c?.gd_no} (Date: {c?.gd_date} Time: {c?.gd_time})</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">FIR Number</span>
                <span className="font-semibold text-zinc-200">{c?.fir_no || 'Pending'} {c?.fir_date && `(Date: ${c?.fir_date})`}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Incident Time/Place</span>
                <span className="font-semibold text-zinc-200">{c?.occurrence_place} (Date: {c?.occurrence_date})</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Classification Category</span>
                <span className="font-semibold text-amber-500 uppercase">{c?.case_head_code}</span>
                <span className="text-zinc-400 text-xs block">{c?.case_head_desc}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">DCP Overridden Classification</span>
                {c?.override_code ? (
                  <>
                    <span className="font-semibold text-red-400 uppercase">{c?.override_code}</span>
                    <span className="text-zinc-400 text-xs block">{c?.override_desc}</span>
                  </>
                ) : (
                  <span className="text-zinc-500 italic">None applied</span>
                )}
              </div>
            </div>

            {/* Theft & Classification specifics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm border-t border-zinc-800 pt-6">
              <div>
                <span className="text-zinc-500 text-xs block mb-1">RC No. (Remand/Court)</span>
                <span className="font-semibold text-zinc-200">{c?.rc_no || '—'}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">SID Number</span>
                <span className="font-semibold text-zinc-200">{c?.sid_no || '—'}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Theft From (Location Subtype)</span>
                <span className="font-semibold text-zinc-200">{c?.theft_from || '—'}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Time of Theft (Time Band)</span>
                <span className="font-semibold text-zinc-200">{c?.time_of_theft || '—'}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Motive</span>
                <span className="font-semibold text-zinc-200">{c?.motive || '—'}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Hotspot?</span>
                <span className="font-semibold text-zinc-200">{c?.hotspot || '—'}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Stolen Article Type</span>
                <span className="font-semibold text-zinc-200">{c?.stolen_article_type || '—'}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Weapon Used?</span>
                <span className="font-semibold text-zinc-200">{c?.weapon_used || '—'}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Vehicle Used?</span>
                <span className="font-semibold text-zinc-200">{c?.vehicle_used || '—'}</span>
              </div>
            </div>

            {/* Police & Agency Specifics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm border-t border-zinc-800 pt-6">
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Agency In-Charge</span>
                <span className="font-semibold text-zinc-200">{c?.agency || 'Local Police'}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Agency Order Details / Date</span>
                <span className="font-semibold text-zinc-200">{c?.agency_order_date || '—'}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Pending Investigation Age</span>
                <span className="font-semibold text-zinc-200">{c?.pending_investigation_age || '—'}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Victim Mobile</span>
                <span className="font-semibold text-zinc-200">{c?.victim_mobile || '—'}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">IO Rank</span>
                <span className="font-semibold text-zinc-200">{c?.io_position || '—'}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Accused Count</span>
                <span className="font-semibold text-zinc-200">{c?.accused_count || '0'}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Accused-Victim Relation</span>
                <span className="font-semibold text-zinc-200">{c?.accused_victim_relation || '—'}</span>
              </div>
            </div>

            {/* Case Outcomes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm border-t border-zinc-800 pt-6">
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Worked Out?</span>
                <span className="font-semibold text-zinc-200">{c?.work_out || 'No'}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Date of Work Out</span>
                <span className="font-semibold text-zinc-200">{c?.date_of_work_out || '—'}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Disposed Date</span>
                <span className="font-semibold text-zinc-200">{c?.disposed_date || '—'}</span>
              </div>
              <div className="md:col-span-3">
                <span className="text-zinc-500 text-xs block mb-1">Pending Investigation Reason</span>
                <span className="font-semibold text-zinc-200">{c?.pending_investigation_reason || '—'}</span>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-6">
              <span className="text-zinc-500 text-xs block mb-2">Brief Facts / Permission No.</span>
              <p className="text-zinc-300 text-xs bg-zinc-900/50 p-4 rounded-xl border border-zinc-850 leading-relaxed font-mono">
                {c?.brief_facts}
              </p>
            </div>
          </div>

          {/* Involved parties */}
          <div className="glass-card p-6 rounded-2xl border border-zinc-800 space-y-6">
            <h2 className="text-md font-bold text-zinc-200 border-b border-zinc-800 pb-3">
              Involved Parties & Officers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Complainant / Victim</span>
                <span className="font-semibold text-zinc-200 block">{c?.complainant_name}</span>
                <span className="text-zinc-400 text-xs">{c?.complainant_address}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Accused Details</span>
                <span className="font-semibold text-zinc-200 block">{c?.accused_name}</span>
                <span className="text-zinc-400 text-xs">{c?.accused_address}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Investigating Officer (IO)</span>
                <span className="font-semibold text-zinc-200 block">{c?.io_name} (PIS: {c?.io_pis})</span>
                <span className="text-zinc-400 text-xs">Mobile: {c?.io_mobile}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Beat Assignment</span>
                <span className="font-semibold text-zinc-200 block">Beat No: {c?.beat_no}</span>
              </div>
            </div>
          </div>

          {/* Accused Persons Grid */}
          {details?.accusedList && details?.accusedList.length > 0 && (
            <div className="glass-card p-6 rounded-2xl border border-zinc-800 space-y-4">
              <h2 className="text-md font-bold text-zinc-200 border-b border-zinc-800 pb-3">
                Accused Details (Repeating Grid)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-zinc-300">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3">Name</th>
                      <th className="p-3">Father's Name</th>
                      <th className="p-3">Address</th>
                      <th className="p-3">Arrest Date</th>
                      <th className="p-3">Age</th>
                      <th className="p-3">State of Origin</th>
                      <th className="p-3">Recovery Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.accusedList.map((acc, idx) => (
                      <tr key={idx} className="border-b border-zinc-850 hover:bg-zinc-900/20">
                        <td className="p-3 font-semibold text-zinc-100">{acc.name}</td>
                        <td className="p-3">{acc.father_name || '—'}</td>
                        <td className="p-3">{acc.address || '—'}</td>
                        <td className="p-3">{acc.arrest_date || '—'}</td>
                        <td className="p-3">{acc.age || '—'}</td>
                        <td className="p-3">{acc.state_origin || '—'}</td>
                        <td className="p-3">{acc.recovery_details || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Custom EAV Fields */}
          {Object.keys(cfs).length > 0 && (
            <div className="glass-card p-6 rounded-2xl border border-zinc-800 space-y-6">
              <h2 className="text-md font-bold text-zinc-200 border-b border-zinc-800 pb-3">
                Local Custom Fields (District Defined)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                {Object.entries(cfs).map(([key, item]) => (
                  <div key={key}>
                    <span className="text-zinc-500 text-xs block mb-1">{item.label}</span>
                    <span className="font-semibold text-zinc-200 block">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Override panel & Action Log */}
        <div className="space-y-6">
          {/* DCP Review panel */}
          {user?.role === 'dcp' && (
            <div className="glass-card p-6 rounded-2xl border border-red-500/20 bg-red-950/5 space-y-4">
              <h3 className="font-bold text-zinc-200 flex items-center gap-2">
                <ShieldAlert className="text-red-400 animate-pulse" />
                <span>DCP Reclassification Review</span>
              </h3>
              <p className="text-zinc-400 text-xs">
                As District DCP, you can modify the Case Head classification of this submitted record.
              </p>
              <button
                onClick={() => {
                  loadCaseHeads();
                  setOverrideModal(true);
                }}
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Apply Reclassification
              </button>
            </div>
          )}

          {/* Action Log panel */}
          <div className="glass-card p-6 rounded-2xl border border-zinc-800 space-y-4">
            <h3 className="font-bold text-zinc-200 border-b border-zinc-800 pb-2">
              Revision Log
            </h3>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {logs.length === 0 ? (
                <div className="text-zinc-500 text-xs italic text-center py-4">No modifications logged</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="text-xs space-y-1 bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-850">
                    <div className="flex justify-between font-bold text-zinc-300">
                      <span className="uppercase text-amber-500">{log.action}</span>
                      <span className="text-[10px] text-zinc-500">{new Date(log.changed_at).toLocaleString()}</span>
                    </div>
                    <div className="text-zinc-400">
                      User: <span className="text-zinc-200 font-semibold">{log.username} ({log.changed_by_role})</span>
                    </div>
                    {log.field_name && (
                      <div className="text-[11px] text-zinc-300">
                        {log.field_name}: {log.old_value} &rarr; {log.new_value}
                      </div>
                    )}
                    {log.reason && (
                      <div className="text-[11px] text-zinc-500 italic mt-1 font-serif">
                        &ldquo;{log.reason}&rdquo;
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Override Modal */}
      {overrideModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 max-w-md w-full rounded-2xl shadow-2xl p-6 space-y-5">
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <ShieldAlert className="text-red-400" />
              <span>DCP Override Form</span>
            </h3>

            <form onSubmit={handleOverrideSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">New Case Head Code</label>
                <select
                  value={selectedHead}
                  onChange={(e) => setSelectedHead(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="">Select Category...</option>
                  {caseHeadsList.map(ch => (
                    <option key={ch.id} value={ch.id}>{ch.code} - {ch.description}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Justification / Reason (min 10 chars)</label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  rows="3"
                  className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  placeholder="State the justification for upgrading or overriding the classification..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOverrideModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Confirm Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
const CasesForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // States
  const [caseHeads, setCaseHeads] = useState([]);
  const [acts, setActs] = useState([]);
  const [sections, setSections] = useState([]);
  const [customFieldsDef, setCustomFieldsDef] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [recordDate, setRecordDate] = useState(new Date().toISOString().slice(0, 10));
  const [firNo, setFirNo] = useState('');
  const [firDate, setFirDate] = useState('');
  const [gdNo, setGdNo] = useState('');
  const [gdDate, setGdDate] = useState(new Date().toISOString().slice(0, 10));
  const [gdTime, setGdTime] = useState('');
  const [occurrenceDate, setOccurrenceDate] = useState('');
  const [occurrenceTime, setOccurrenceTime] = useState('');
  const [occurrencePlace, setOccurrencePlace] = useState('');
  const [briefFacts, setBriefFacts] = useState('');
  const [caseHeadId, setCaseHeadId] = useState('');
  const [actName, setActName] = useState('');
  const [sectionText, setSectionText] = useState('');
  const [complainantName, setComplainantName] = useState('');
  const [complainantAddress, setComplainantAddress] = useState('');
  const [accusedName, setAccusedName] = useState('');
  const [accusedAddress, setAccusedAddress] = useState('');
  const [arrestDate, setArrestDate] = useState('');
  const [ioName, setIoName] = useState('');
  const [ioPis, setIoPis] = useState('');
  const [ioMobile, setIoMobile] = useState('');
  const [stolenProperty, setStolenProperty] = useState('');
  const [recoveredProperty, setRecoveredProperty] = useState('');
  const [status, setStatus] = useState('Open');
  const [statusOther, setStatusOther] = useState('');
  const [remarks, setRemarks] = useState('');
  const [beatNo, setBeatNo] = useState('');
  const [sidNo, setSidNo] = useState('');
  const [caseType, setCaseType] = useState('CCTNS');
  const [caseTypeOther, setCaseTypeOther] = useState('');

  // Checkbox Flags
  const [cctnsFlag, setCctnsFlag] = useState(false);

  // 19 New fields from Delhi Police Master Sheet & Field Guide
  const [rcNo, setRcNo] = useState('');
  const [theftFrom, setTheftFrom] = useState('');
  const [timeOfTheft, setTimeOfTheft] = useState('');
  const [motive, setMotive] = useState('');
  const [hotspot, setHotspot] = useState('No');
  const [agency, setAgency] = useState('');
  const [agencyOrderDate, setAgencyOrderDate] = useState('');
  const [pendingInvestigationAge, setPendingInvestigationAge] = useState('');
  const [victimMobile, setVictimMobile] = useState('');
  const [ioPosition, setIoPosition] = useState('');
  const [accusedCount, setAccusedCount] = useState('');
  const [accusedVictimRelation, setAccusedVictimRelation] = useState('');
  const [stolenArticleType, setStolenArticleType] = useState('');
  const [weaponUsed, setWeaponUsed] = useState('');
  const [vehicleUsed, setVehicleUsed] = useState('');
  const [workOut, setWorkOut] = useState('No');
  const [dateOfWorkOut, setDateOfWorkOut] = useState('');
  const [disposedDate, setDisposedDate] = useState('');
  const [pendingInvestigationReason, setPendingInvestigationReason] = useState('');

  // Accused repeating list (repeating grid)
  const [accusedList, setAccusedList] = useState([]);

  // Custom Field Answers
  const [customFields, setCustomFields] = useState({});

  // PS Appended Custom Fields States
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');

  const addBlankAccused = () => {
    setAccusedList(prev => [...prev, {
      name: '',
      fatherName: '',
      address: '',
      arrestDate: '',
      age: '',
      stateOrigin: '',
      recoveryDetails: ''
    }]);
  };

  const removeAccusedRow = (index) => {
    setAccusedList(prev => prev.filter((_, i) => i !== index));
    toast.success('Accused removed from list.');
  };

  const handleAccusedFieldChange = (index, field, value) => {
    setAccusedList(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleAddNewField = async () => {
    if (!newFieldLabel.trim()) {
      toast.error('Please enter a field label.');
      return;
    }

    if (newFieldType === 'dropdown' && !newFieldOptions.trim()) {
      toast.error('Please enter comma-separated options for the dropdown list.');
      return;
    }

    const fieldKey = 'ps_added_' + newFieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();

    try {
      const payload = {
        module: 'cases',
        fieldKey,
        fieldLabel: newFieldLabel.trim(),
        fieldType: newFieldType,
        isRequired: false,
        scopeLevel: 'district',
        scopeId: user?.district
      };

      if (newFieldType === 'dropdown') {
        payload.options = newFieldOptions
          .split(',')
          .map(opt => opt.trim())
          .filter(Boolean);
      }

      await axios.post('/api/v1/admin/custom-fields', payload);

      toast.success(`Field "${newFieldLabel}" appended to form successfully!`);
      setShowAddField(false);
      setNewFieldLabel('');
      setNewFieldType('text');
      setNewFieldOptions('');

      // Re-fetch custom field definitions
      const cfsResponse = await axios.get('/api/v1/admin/custom-fields/ps?module=cases');
      setCustomFieldsDef(cfsResponse.data.data.customFields);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to append custom field.');
    }
  };

  const fileInputRef = useRef(null);

  const generateCsvTemplate = () => {
    const headers = [
      'gdNo', 'gdDate', 'gdTime', 'firNo', 'firDate', 'occurrenceDate', 'occurrenceTime', 'occurrencePlace',
      'briefFacts', 'caseHeadId', 'actName', 'sectionText', 'complainantName', 'complainantAddress',
      'accusedName', 'accusedAddress', 'arrestDate', 'ioName', 'ioPis', 'ioMobile',
      'beatNo', 'stolenProperty', 'recoveredProperty', 'status', 'statusOther', 'remarks',
      'caseType', 'caseTypeOther', 'sidNo',
      'rcNo', 'theftFrom', 'timeOfTheft', 'motive', 'hotspot', 'agency', 'agencyOrderDate',
      'pendingInvestigationAge', 'victimMobile', 'ioPosition', 'accusedCount', 'accusedVictimRelation',
      'stolenArticleType', 'weaponUsed', 'vehicleUsed', 'workOut', 'dateOfWorkOut', 'disposedDate', 'pendingInvestigationReason'
    ];

    // Add dynamic custom fields if any
    customFieldsDef.forEach(def => {
      headers.push(`Custom_${def.fieldKey}`);
    });

    const csvContent = headers.join(',') + '\n' + headers.map(() => '').join(',');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "FIR_Cases_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const row = results.data[0]; // grab the first data row

          if (row.gdNo) setGdNo(row.gdNo);
          if (row.gdDate) setGdDate(row.gdDate);
          if (row.gdTime) setGdTime(row.gdTime);
          if (row.firNo) setFirNo(row.firNo);
          if (row.firDate) setFirDate(row.firDate);
          if (row.occurrenceDate) setOccurrenceDate(row.occurrenceDate);
          if (row.occurrenceTime) setOccurrenceTime(row.occurrenceTime);
          if (row.occurrencePlace) setOccurrencePlace(row.occurrencePlace);
          if (row.briefFacts) setBriefFacts(row.briefFacts);
          if (row.caseHeadId) setCaseHeadId(row.caseHeadId);
          if (row.actName) setActName(row.actName);
          if (row.sectionText) setSectionText(row.sectionText);
          if (row.complainantName) setComplainantName(row.complainantName);
          if (row.complainantAddress) setComplainantAddress(row.complainantAddress);
          if (row.accusedName) setAccusedName(row.accusedName);
          if (row.accusedAddress) setAccusedAddress(row.accusedAddress);
          if (row.arrestDate) setArrestDate(row.arrestDate);
          if (row.ioName) setIoName(row.ioName);
          if (row.ioPis) setIoPis(row.ioPis);
          if (row.ioMobile) setIoMobile(row.ioMobile);
          if (row.beatNo) setBeatNo(row.beatNo);
          if (row.stolenProperty) setStolenProperty(row.stolenProperty);
          if (row.recoveredProperty) setRecoveredProperty(row.recoveredProperty);
          if (row.status) setStatus(row.status);
          if (row.statusOther) setStatusOther(row.statusOther);
          if (row.remarks) setRemarks(row.remarks);
          if (row.caseType) setCaseType(row.caseType);
          if (row.caseTypeOther) setCaseTypeOther(row.caseTypeOther);
          if (row.sidNo) setSidNo(row.sidNo);

          if (row.rcNo) setRcNo(row.rcNo);
          if (row.theftFrom) setTheftFrom(row.theftFrom);
          if (row.timeOfTheft) setTimeOfTheft(row.timeOfTheft);
          if (row.motive) setMotive(row.motive);
          if (row.hotspot) setHotspot(row.hotspot);
          if (row.agency) setAgency(row.agency);
          if (row.agencyOrderDate) setAgencyOrderDate(row.agencyOrderDate);
          if (row.pendingInvestigationAge) setPendingInvestigationAge(row.pendingInvestigationAge);
          if (row.victimMobile) setVictimMobile(row.victimMobile);
          if (row.ioPosition) setIoPosition(row.ioPosition);
          if (row.accusedCount) setAccusedCount(row.accusedCount);
          if (row.accusedVictimRelation) setAccusedVictimRelation(row.accusedVictimRelation);
          if (row.stolenArticleType) setStolenArticleType(row.stolenArticleType);
          if (row.weaponUsed) setWeaponUsed(row.weaponUsed);
          if (row.vehicleUsed) setVehicleUsed(row.vehicleUsed);
          if (row.workOut) setWorkOut(row.workOut);
          if (row.dateOfWorkOut) setDateOfWorkOut(row.dateOfWorkOut);
          if (row.disposedDate) setDisposedDate(row.disposedDate);
          if (row.pendingInvestigationReason) setPendingInvestigationReason(row.pendingInvestigationReason);

          // Process Custom fields
          const newCustomFields = { ...customFields };
          customFieldsDef.forEach(def => {
            const key = `Custom_${def.fieldKey}`;
            if (row[key]) {
              newCustomFields[def.fieldKey] = row[key];
            }
          });
          setCustomFields(newCustomFields);

          toast.success('Form auto-filled from CSV successfully!');
        } else {
          toast.error('CSV file seems empty or invalid.');
        }

        // Reset file input so same file can be uploaded again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      error: () => {
        toast.error('Failed to parse the CSV file.');
      }
    });
  };

  const loadReferenceData = async () => {
    try {
      const response = await axios.get('/api/v1/admin/case-heads');
      const filtered = response.data.data.caseHeads.filter(ch => ch.category === 'Cases');
      setCaseHeads(filtered);
      setActs(response.data.data.acts);
      setSections(response.data.data.sections);

      // Load active Custom Fields for PS level Cases
      const cfsResponse = await axios.get('/api/v1/admin/custom-fields/ps?module=cases');
      setCustomFieldsDef(cfsResponse.data.data.customFields);
    } catch (e) {
      toast.error('Failed to load reference lists.');
    }
  };

  const loadDraftDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/records/cases/${id}`);
      const c = response.data.data.case;
      const cfs = response.data.data.customFields;

      if (response.data.data.submission_status === 'submitted') {
        toast.error('Submitted records are locked and cannot be edited.');
        navigate(ROUTES.CASES);
        return;
      }

      setRecordDate(c.record_date);
      setFirNo(c.fir_no || '');
      setFirDate(c.fir_date || '');
      setGdNo(c.gd_no);
      setGdDate(c.gd_date);
      setGdTime(c.gd_time);
      setOccurrenceDate(c.occurrence_date);
      setOccurrenceTime(c.occurrence_time || '');
      setOccurrencePlace(c.occurrence_place);
      setBriefFacts(c.brief_facts);
      setCaseHeadId(c.case_head_id);
      setActName(c.act_name);
      setSectionText(c.section_text);
      setComplainantName(c.complainant_name);
      setComplainantAddress(c.complainant_address);
      setAccusedName(c.accused_name);
      setAccusedAddress(c.accused_address);
      setArrestDate(c.arrest_date || '');
      setIoName(c.io_name);
      setIoPis(c.io_pis);
      setIoMobile(c.io_mobile);
      setStolenProperty(c.stolen_property || '');
      setRecoveredProperty(c.recovered_property || '');
      setStatus(c.status);
      setStatusOther(c.status_other || '');
      setRemarks(c.remarks || '');
      setBeatNo(c.beat_no);
      setSidNo(c.sid_no || '');
      setCaseType(c.case_type || 'CCTNS');
      setCaseTypeOther(c.case_type_other || '');

      setCctnsFlag(!!c.cctns_flag);

      // 19 New fields
      setRcNo(c.rc_no || '');
      setTheftFrom(c.theft_from || '');
      setTimeOfTheft(c.time_of_theft || '');
      setMotive(c.motive || '');
      setHotspot(c.hotspot || 'No');
      setAgency(c.agency || '');
      setAgencyOrderDate(c.agency_order_date || '');
      setPendingInvestigationAge(c.pending_investigation_age || '');
      setVictimMobile(c.victim_mobile || '');
      setIoPosition(c.io_position || '');
      setAccusedCount(c.accused_count || '');
      setAccusedVictimRelation(c.accused_victim_relation || '');
      setStolenArticleType(c.stolen_article_type || '');
      setWeaponUsed(c.weapon_used || '');
      setVehicleUsed(c.vehicle_used || '');
      setWorkOut(c.work_out || 'No');
      setDateOfWorkOut(c.date_of_work_out || '');
      setDisposedDate(c.disposed_date || '');
      setPendingInvestigationReason(c.pending_investigation_reason || '');

      // Accused list
      const acc = response.data.data.accusedList || [];
      setAccusedList(acc.map(a => ({
        name: a.name,
        fatherName: a.father_name || '',
        address: a.address || '',
        arrestDate: a.arrest_date || '',
        age: a.age || '',
        stateOrigin: a.state_origin || '',
        recoveryDetails: a.recovery_details || ''
      })));

      // Map custom fields
      const initialCfs = {};
      Object.entries(cfs).forEach(([key, item]) => {
        initialCfs[key] = item.value;
      });
      setCustomFields(initialCfs);
    } catch (e) {
      toast.error('Failed to load draft details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferenceData();
    if (isEdit) {
      loadDraftDetails();
    }
  }, [id]);

  const handleCustomFieldChange = (key, val) => {
    setCustomFields(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const handleSave = async (submitType) => {
    // Basic validation
    if (!gdNo || !gdDate || !gdTime || !occurrenceDate || !occurrencePlace || !briefFacts || !caseHeadId || !actName || !sectionText || !complainantName || !complainantAddress || !ioName || !ioPis || !ioMobile || !beatNo) {
      toast.error('Please fill in all mandatory fields.');
      return;
    }

    // Custom fields mandatory checks
    for (const def of customFieldsDef) {
      if (def.isRequired && !customFields[def.fieldKey]) {
        toast.error(`Custom field "${def.fieldLabel}" is required.`);
        return;
      }
    }

    const payload = {
      recordDate,
      firNo,
      firDate: firDate || null,
      gdNo,
      gdDate,
      gdTime,
      occurrenceDate,
      occurrenceTime: occurrenceTime || null,
      occurrencePlace,
      briefFacts,
      caseHeadId,
      actName,
      sectionText,
      complainantName,
      complainantAddress,
      accusedName,
      accusedAddress,
      arrestDate: arrestDate || null,
      ioName,
      ioPis,
      ioMobile,
      stolenProperty,
      recoveredProperty,
      status,
      statusOther: status === 'Other' ? statusOther : '',
      remarks,
      beatNo,
      sidNo,
      caseType,
      caseTypeOther: caseType === 'Other' ? caseTypeOther : '',
      submissionStatus: submitType,
      customFields,

      cctnsFlag,

      // 19 New fields
      rcNo,
      theftFrom,
      timeOfTheft,
      motive,
      hotspot,
      agency,
      agencyOrderDate,
      pendingInvestigationAge,
      victimMobile,
      ioPosition,
      accusedCount,
      accusedVictimRelation,
      stolenArticleType,
      weaponUsed,
      vehicleUsed,
      workOut,
      dateOfWorkOut: dateOfWorkOut || null,
      disposedDate: disposedDate || null,
      pendingInvestigationReason,

      // Accused Repeating Grid List
      accusedList
    };

    try {
      if (isEdit) {
        await axios.put(`/api/v1/records/cases/${id}`, payload);
        toast.success(submitType === 'submitted' ? 'Case submitted & locked.' : 'Draft updated.');
      } else {
        await axios.post('/api/v1/records/cases', payload);
        toast.success(submitType === 'submitted' ? 'Case registered & locked.' : 'Draft saved.');
      }
      navigate(ROUTES.CASES);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transaction submission failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-100 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
              {isEdit ? 'Revisions' : 'Registrations'}
            </span>
            <h1 className="text-xl font-bold text-zinc-100">
              {isEdit ? 'Update Case Record' : 'Register New Case / FIR'}
            </h1>
          </div>
        </div>

        {/* CSV Auto-Fill Actions */}
        {!isEdit && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={generateCsvTemplate}
              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download size={16} className="text-amber-500" />
              <span className="hidden sm:inline">Download Template</span>
            </button>

            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleCsvUpload}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <UploadCloud size={16} />
              <span className="hidden sm:inline">Auto-Fill from CSV</span>
            </label>
          </div>
        )}
      </div>

      <div className="glass-card p-6 md:p-8 rounded-2xl border border-zinc-800 space-y-8 bg-zinc-900/10">
        {/* Section 1: Identification & Registration */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest border-b border-zinc-850 pb-2">
            1. Identification & Registration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Daily Diary Record Date</label>
              <input
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                disabled={isEdit}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">SID Number</label>
              <input
                type="text"
                placeholder="e.g. SID-12345"
                value={sidNo}
                onChange={(e) => setSidNo(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">GD Entry Number</label>
              <input
                type="text"
                placeholder="e.g. GD-12A"
                value={gdNo}
                onChange={(e) => setGdNo(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">GD Date</label>
                <input
                  type="date"
                  value={gdDate}
                  onChange={(e) => setGdDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">GD Time</label>
                <input
                  type="time"
                  value={gdTime}
                  onChange={(e) => setGdTime(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">FIR Number (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 145/2026"
                value={firNo}
                onChange={(e) => setFirNo(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">FIR Date (Optional)</label>
              <input
                type="date"
                value={firDate}
                onChange={(e) => setFirDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">RC No. (Remand/Court Ref)</label>
              <input
                type="text"
                placeholder="e.g. RC-456/2026"
                value={rcNo}
                onChange={(e) => setRcNo(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Crime Classification */}
        <div className="space-y-4 pt-4 border-t border-zinc-850">
          <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest border-b border-zinc-850 pb-2">
            2. Crime Classification
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Incident Head Category</label>
              <select
                value={caseHeadId}
                onChange={(e) => setCaseHeadId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              >
                <option value="">Select category...</option>
                {caseHeads.map(ch => (
                  <option key={ch.id} value={ch.id}>{ch.code} - {ch.description}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Act Name (e.g. IPC, POCSO)</label>
              <input
                type="text"
                list="acts-datalist"
                placeholder="e.g. IPC"
                value={actName}
                onChange={(e) => setActName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
              <datalist id="acts-datalist">
                {acts.map(a => <option key={a} value={a} />)}
              </datalist>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Sections Text</label>
              <input
                type="text"
                placeholder="e.g. 302, 34"
                value={sectionText}
                onChange={(e) => setSectionText(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Case Type</label>
              <select
                value={caseType}
                onChange={(e) => setCaseType(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              >
                <option value="CCTNS">CCTNS</option>
                <option value="eTheft">eTheft</option>
                <option value="eMVT">eMVT</option>
                <option value="NCRP">NCRP</option>
                <option value="Zero FIR">Zero FIR</option>
                <option value="Other">Other</option>
              </select>
              {caseType === 'Other' && (
                <input
                  type="text"
                  placeholder="Specify other case type"
                  value={caseTypeOther}
                  onChange={(e) => setCaseTypeOther(e.target.value)}
                  className="w-full mt-2 bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Theft From (Location Subtype)</label>
              <select
                value={theftFrom}
                onChange={(e) => setTheftFrom(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              >
                <option value="">Select location subtype...</option>
                <option value="House/Residence">House/Residence</option>
                <option value="Shop/Commercial">Shop/Commercial</option>
                <option value="Bank/ATM">Bank/ATM</option>
                <option value="On Road">On Road</option>
                <option value="Vehicle">Vehicle</option>
                <option value="Parking Lot">Parking Lot</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Time of Theft (Time Band)</label>
              <select
                value={timeOfTheft}
                onChange={(e) => setTimeOfTheft(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              >
                <option value="">Select time band...</option>
                <option value="Day (06:00 - 18:00)">Day (06:00 - 18:00)</option>
                <option value="Night (18:00 - 06:00)">Night (18:00 - 06:00)</option>
                <option value="Morning (06:00 - 12:00)">Morning (06:00 - 12:00)</option>
                <option value="Afternoon (12:00 - 16:00)">Afternoon (12:00 - 16:00)</option>
                <option value="Evening (16:00 - 20:00)">Evening (16:00 - 20:00)</option>
                <option value="Late Night (20:00 - 06:00)">Late Night (20:00 - 06:00)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Motive</label>
              <select
                value={motive}
                onChange={(e) => setMotive(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              >
                <option value="">Select motive...</option>
                <option value="Gain">Gain</option>
                <option value="Enmity">Enmity</option>
                <option value="Dispute">Dispute</option>
                <option value="Passion">Passion</option>
                <option value="None/Other">None/Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Hotspot?</label>
              <select
                value={hotspot}
                onChange={(e) => setHotspot(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Incident Details */}
        <div className="space-y-4 pt-4 border-t border-zinc-850">
          <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest border-b border-zinc-850 pb-2">
            3. Incident Details & Location
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Incident Occurrence Date</label>
              <input
                type="date"
                value={occurrenceDate}
                onChange={(e) => setOccurrenceDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Incident Occurrence Time</label>
              <input
                type="time"
                value={occurrenceTime}
                onChange={(e) => setOccurrenceTime(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Incident Place / Address</label>
              <input
                type="text"
                placeholder="e.g. Main Road, Adarsh Nagar"
                value={occurrencePlace}
                onChange={(e) => setOccurrencePlace(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Beat Number</label>
              <input
                type="text"
                placeholder="e.g. Beat 1"
                value={beatNo}
                onChange={(e) => setBeatNo(e.target.value)}
                className="w-full bg-zinc-955 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Investigating Officer & Agency Details */}
        <div className="space-y-4 pt-4 border-t border-zinc-850">
          <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest border-b border-zinc-850 pb-2">
            4. Investigating Officer & Agency Assignment
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">IO Officer Name</label>
              <input
                type="text"
                placeholder="e.g. Satish Kumar"
                value={ioName}
                onChange={(e) => setIoName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">IO Rank</label>
              <select
                value={ioPosition}
                onChange={(e) => setIoPosition(e.target.value)}
                className="w-full bg-zinc-955 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              >
                <option value="">Select rank...</option>
                <option value="Inspector (PI)">Inspector (PI)</option>
                <option value="Sub-Inspector (SI)">Sub-Inspector (SI)</option>
                <option value="Asst. Sub-Inspector (ASI)">Asst. Sub-Inspector (ASI)</option>
                <option value="Head Constable (HC)">Head Constable (HC)</option>
                <option value="Constable (Ct)">Constable (Ct)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">IO PIS Number</label>
              <input
                type="text"
                placeholder="e.g. PIS-99330"
                value={ioPis}
                onChange={(e) => setIoPis(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">IO Mobile Number</label>
              <input
                type="text"
                placeholder="e.g. 9876543210"
                value={ioMobile}
                onChange={(e) => setIoMobile(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Transfer Agency In-Charge (Optional)</label>
              <select
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                className="w-full bg-zinc-955 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              >
                <option value="">Local Police (Default)</option>
                <option value="Special Cell">Special Cell</option>
                <option value="Crime Branch">Crime Branch</option>
                <option value="Narcotics Branch">Narcotics Branch</option>
                <option value="ATS (Anti-Terrorism)">ATS (Anti-Terrorism)</option>
                <option value="Other Agency">Other Agency</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Agency Order Details & Date</label>
              <input
                type="text"
                placeholder="e.g. Order No. 23/F, dated 2026-04-12"
                value={agencyOrderDate}
                onChange={(e) => setAgencyOrderDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Complainant, Victim & General Accused Details */}
        <div className="space-y-4 pt-4 border-t border-zinc-850">
          <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest border-b border-zinc-850 pb-2">
            5. Parties Involved
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Complainant / Victim details</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-semibold">Complainant Name</label>
                  <input
                    type="text"
                    placeholder="Name"
                    value={complainantName}
                    onChange={(e) => setComplainantName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-semibold">Complainant Address</label>
                  <input
                    type="text"
                    placeholder="Address"
                    value={complainantAddress}
                    onChange={(e) => setComplainantAddress(e.target.value)}
                    className="w-full bg-zinc-955 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-semibold">Victim Mobile</label>
                  <input
                    type="text"
                    placeholder="Victim Mobile Contact"
                    value={victimMobile}
                    onChange={(e) => setVictimMobile(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Accused (Master Summary & Relation)</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-semibold">Primary Accused Name(s) Summary</label>
                  <input
                    type="text"
                    placeholder="Summary / Names"
                    value={accusedName}
                    onChange={(e) => setAccusedName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase font-semibold">Primary Accused Address Summary</label>
                  <input
                    type="text"
                    placeholder="Address summary"
                    value={accusedAddress}
                    onChange={(e) => setAccusedAddress(e.target.value)}
                    className="w-full bg-zinc-955 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase font-semibold">Relationship</label>
                    <select
                      value={accusedVictimRelation}
                      onChange={(e) => setAccusedVictimRelation(e.target.value)}
                      className="w-full bg-zinc-955 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                    >
                      <option value="">Select relation...</option>
                      <option value="Stranger">Stranger</option>
                      <option value="Known Person">Known Person</option>
                      <option value="Relative">Relative</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Business Associate">Business Associate</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase font-semibold">Accused Count</label>
                    <input
                      type="number"
                      placeholder="Total Persons Involved"
                      value={accusedCount}
                      onChange={(e) => setAccusedCount(e.target.value)}
                      className="w-full bg-zinc-955 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Accused Repeating Grid */}
        <div className="space-y-4 pt-4 border-t border-zinc-850">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest">
              6. Accused Repeating Grid
            </h3>
            <button
              type="button"
              onClick={addBlankAccused}
              className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-amber-500/30 text-amber-500 hover:text-amber-400 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus size={12} />
              <span>Add Accused Profile</span>
            </button>
          </div>

          <div className="space-y-4">
            {accusedList.length === 0 ? (
              <p className="text-xs text-zinc-555 italic">No repeating accused profiles added yet. Click "Add Accused Profile" above to append rows.</p>
            ) : (
              accusedList.map((acc, index) => (
                <div key={index} className="p-4 bg-zinc-955/40 border border-zinc-850 rounded-xl space-y-3 relative">
                  <button
                    type="button"
                    onClick={() => removeAccusedRow(index)}
                    className="absolute top-2.5 right-2.5 text-red-500 hover:text-red-400 text-xs font-bold transition-colors"
                  >
                    Remove
                  </button>
                  <h4 className="text-[10px] font-extrabold text-zinc-555 uppercase tracking-wider">Accused #{index + 1} Profile</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase font-semibold">Accused Name</label>
                      <input
                        type="text"
                        value={acc.name}
                        onChange={(e) => handleAccusedFieldChange(index, 'name', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs text-zinc-200 focus:outline-none"
                        placeholder="Name"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase font-semibold">Father's Name</label>
                      <input
                        type="text"
                        value={acc.fatherName}
                        onChange={(e) => handleAccusedFieldChange(index, 'fatherName', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs text-zinc-200 focus:outline-none"
                        placeholder="Father's Name"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase font-semibold">Residence Address</label>
                      <input
                        type="text"
                        value={acc.address}
                        onChange={(e) => handleAccusedFieldChange(index, 'address', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs text-zinc-200 focus:outline-none"
                        placeholder="Residence address"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase font-semibold">Arrest Date</label>
                      <input
                        type="date"
                        value={acc.arrestDate}
                        onChange={(e) => handleAccusedFieldChange(index, 'arrestDate', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs text-zinc-200 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase font-semibold">Age</label>
                      <input
                        type="number"
                        value={acc.age}
                        onChange={(e) => handleAccusedFieldChange(index, 'age', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs text-zinc-200 focus:outline-none"
                        placeholder="Age"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase font-semibold">State of Origin (FROM)</label>
                      <input
                        type="text"
                        value={acc.stateOrigin}
                        onChange={(e) => handleAccusedFieldChange(index, 'stateOrigin', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs text-zinc-200 focus:outline-none"
                        placeholder="e.g. Bihar, UP, Delhi"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] text-zinc-400 uppercase font-semibold">Recovery per Accused</label>
                      <input
                        type="text"
                        value={acc.recoveryDetails}
                        onChange={(e) => handleAccusedFieldChange(index, 'recoveryDetails', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs text-zinc-200 focus:outline-none"
                        placeholder="Details of recovery from this specific accused"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 7: Property & Evidence */}
        <div className="space-y-4 pt-4 border-t border-zinc-850">
          <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest border-b border-zinc-850 pb-2">
            7. Property & Evidence Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Stolen Article Type</label>
              <select
                value={stolenArticleType}
                onChange={(e) => setStolenArticleType(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
              >
                <option value="">Select article type...</option>
                <option value="Mobile">Mobile</option>
                <option value="Laptop/Electronics">Laptop/Electronics</option>
                <option value="Gold/Jewelry">Gold/Jewelry</option>
                <option value="Cash">Cash</option>
                <option value="Vehicle">Vehicle</option>
                <option value="Document">Document</option>
                <option value="House Articles">House Articles</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Stolen Property Description</label>
              <input
                type="text"
                placeholder="Description of stolen items"
                value={stolenProperty}
                onChange={(e) => setStolenProperty(e.target.value)}
                className="w-full bg-zinc-955 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Recovered Property Description</label>
              <input
                type="text"
                placeholder="Description of recovered items"
                value={recoveredProperty}
                onChange={(e) => setRecoveredProperty(e.target.value)}
                className="w-full bg-zinc-955 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Weapon Used (e.g. Knife, Pistol, None)</label>
              <input
                type="text"
                placeholder="e.g. Knife, None"
                value={weaponUsed}
                onChange={(e) => setWeaponUsed(e.target.value)}
                className="w-full bg-zinc-955 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Vehicle Used (e.g. Splendor Bike, Auto, None)</label>
              <input
                type="text"
                placeholder="e.g. Splendor Bike, None"
                value={vehicleUsed}
                onChange={(e) => setVehicleUsed(e.target.value)}
                className="w-full bg-zinc-955 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 8: Status, Outcomes & Narrative */}
        <div className="space-y-4 pt-4 border-t border-zinc-850">
          <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest border-b border-zinc-850 pb-2">
            8. Status, Outcomes & Narrative
          </h3>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase">Brief Facts / Permission No. (Narrative)</label>
            <textarea
              value={briefFacts}
              onChange={(e) => setBriefFacts(e.target.value)}
              rows="4"
              className="w-full bg-zinc-955 border border-zinc-800 p-3 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              placeholder="Type summary facts, permission details, and case narrative..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Investigation Status (Case Status)</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-zinc-955 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
              >
                <option value="Open">Open</option>
                <option value="Chargesheeted">Chargesheeted</option>
                <option value="Closed">Closed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Other">Other</option>
              </select>
              {status === 'Other' && (
                <input
                  type="text"
                  placeholder="Specify other status"
                  value={statusOther}
                  onChange={(e) => setStatusOther(e.target.value)}
                  className="w-full mt-2 bg-zinc-955 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Work Out?</label>
              <select
                value={workOut}
                onChange={(e) => setWorkOut(e.target.value)}
                className="w-full bg-zinc-955 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Date of Work Out</label>
              <input
                type="date"
                value={dateOfWorkOut}
                onChange={(e) => setDateOfWorkOut(e.target.value)}
                className="w-full bg-zinc-955 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Disposed Date</label>
              <input
                type="date"
                value={disposedDate}
                onChange={(e) => setDisposedDate(e.target.value)}
                className="w-full bg-zinc-955 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Pending Investigation Age Bucket</label>
              <select
                value={pendingInvestigationAge}
                onChange={(e) => setPendingInvestigationAge(e.target.value)}
                className="w-full bg-zinc-955 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
              >
                <option value="">Select age bucket...</option>
                <option value="Under 1 Month">Under 1 Month</option>
                <option value="1 - 3 Months">1 - 3 Months</option>
                <option value="3 - 6 Months">3 - 6 Months</option>
                <option value="Over 6 Months">Over 6 Months</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Remarks / General Comments</label>
              <input
                type="text"
                placeholder="Remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full bg-zinc-955 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
              />
            </div>

            <div className="md:col-span-3 space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Reason of PI (Pending Investigation Reason)</label>
              <input
                type="text"
                placeholder="State details for why the investigation is pending / open..."
                value={pendingInvestigationReason}
                onChange={(e) => setPendingInvestigationReason(e.target.value)}
                className="w-full bg-zinc-955 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
              />
            </div>
          </div>

          {/* Uploaded to CCTNS check */}
          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="cctns-checkbox"
              checked={cctnsFlag}
              onChange={(e) => setCctnsFlag(e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded bg-zinc-955 border-zinc-800 focus:ring-amber-500"
            />
            <label htmlFor="cctns-checkbox" className="text-xs font-bold text-zinc-350 select-none cursor-pointer">
              Uploaded to CCTNS flag
            </label>
          </div>
        </div>

        {/* Dynamic Custom Fields EAV */}
        <div className="pt-4 border-t border-zinc-850 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Custom Case Fields</h3>
            {(user?.role === 'dcp' || user?.role === 'admin') && (
              <button
                type="button"
                onClick={() => setShowAddField(!showAddField)}
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-amber-500/30 text-amber-500 hover:text-amber-400 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} />
                <span>Append Custom Field</span>
              </button>
            )}
          </div>

          {/* Add Field Inline Form */}
          {showAddField && (
            <div className="p-4 bg-zinc-955 border border-zinc-850 rounded-xl space-y-3 max-w-md">
              <h4 className="text-xs font-bold text-zinc-300">Add New Dynamic Field</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase font-semibold">Field Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Accused Phone Model"
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 p-2.5 rounded text-xs text-zinc-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase font-semibold">Field Type</label>
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 p-2.5 rounded text-xs text-zinc-300 focus:outline-none"
                  >
                    <option value="text">Text Input</option>
                    <option value="long_text">Long Text Input</option>
                    <option value="number">Number Input</option>
                    <option value="date">Date Input</option>
                    <option value="dropdown">Dropdown List</option>
                  </select>
                </div>
                {newFieldType === 'dropdown' && (
                  <div className="space-y-1 col-span-2">
                    <label className="text-[10px] text-zinc-400 uppercase font-semibold">Dropdown Options (comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Apple, Samsung, OnePlus, Nokia"
                      value={newFieldOptions}
                      onChange={(e) => setNewFieldOptions(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 p-2.5 rounded text-xs text-zinc-200 focus:outline-none"
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddField(false);
                    setNewFieldLabel('');
                    setNewFieldType('text');
                    setNewFieldOptions('');
                  }}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-855 text-zinc-400 rounded text-[10px] font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddNewField}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded text-[10px] font-bold transition-colors cursor-pointer"
                >
                  Append to Form
                </button>
              </div>
            </div>
          )}

          {customFieldsDef.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {customFieldsDef.map(def => (
                <div key={def.id} className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase">
                    {def.fieldLabel} {def.isRequired && <span className="text-red-500">*</span>}
                  </label>
                  {def.fieldType === 'dropdown' ? (
                    <select
                      value={customFields[def.fieldKey] || ''}
                      onChange={(e) => handleCustomFieldChange(def.fieldKey, e.target.value)}
                      className="w-full bg-zinc-955 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                    >
                      <option value="">Choose item...</option>
                      {def.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : def.fieldType === 'long_text' ? (
                    <textarea
                      value={customFields[def.fieldKey] || ''}
                      onChange={(e) => handleCustomFieldChange(def.fieldKey, e.target.value)}
                      rows="3"
                      className="w-full bg-zinc-955 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                      placeholder={`Enter ${def.fieldLabel.toLowerCase()}`}
                    />
                  ) : (
                    <input
                      type={def.fieldType === 'number' ? 'number' : def.fieldType === 'date' ? 'date' : 'text'}
                      value={customFields[def.fieldKey] || ''}
                      onChange={(e) => handleCustomFieldChange(def.fieldKey, e.target.value)}
                      className="w-full bg-zinc-955 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                      placeholder={`Enter ${def.fieldLabel.toLowerCase()}`}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-650 italic">No dynamic fields appended for this location yet.</p>
          )}
        </div>

        {/* Buttons Panel */}
        <div className="flex justify-end gap-3 pt-6 border-t border-zinc-800">
          <button
            type="button"
            onClick={() => navigate(ROUTES.CASES)}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-red-600/10"
          >
            <span>STOP / Cancel</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('draft')}
            className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Save size={16} />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('submitted')}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
          >
            <Send size={16} />
            <span>Submit & Lock</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const CasesPage = () => {
  return (
    <Routes>
      <Route path="" element={<CasesList />} />
      <Route path="new" element={<CasesForm />} />
      <Route path=":id" element={<CaseDetails />} />
      <Route path=":id/edit" element={<CasesForm />} />
    </Routes>
  );
};
