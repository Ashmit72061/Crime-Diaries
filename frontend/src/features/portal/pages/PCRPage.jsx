import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore.js';
import { ROUTES } from '../../../utils/constants.js';
import axios from 'axios';
import { 
  Plus, Search, Calendar, PhoneCall, ChevronRight, Save, Send, 
  ArrowLeft, Edit3, Clock, AlertTriangle, FileSpreadsheet, ListFilter
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── SUB-COMPONENT: PCR LIST ──────────────────────────────────────────────────
const PcrList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [pcrs, setPcrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPcrs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (statusFilter) params.submissionStatus = statusFilter;

      const response = await axios.get('/api/v1/records/pcr', { params });
      setPcrs(response.data.data.pcrs);
    } catch (err) {
      toast.error('Failed to load PCR records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPcrs();
  }, [dateFrom, dateTo, statusFilter]);

  const triggerExport = () => {
    const query = new URLSearchParams({
      recordType: 'pcr',
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
            <PhoneCall className="text-amber-500" />
            <span>PCR Call / Kalandra Register</span>
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Browse and review PCR emergency dispatch logs and preventive action items.
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
              <span>Record new call</span>
            </Link>
          )}
        </div>
      </div>

      {/* Quick Links Section */}
      <div className="flex flex-wrap gap-2">
        <Link
          to="/analytics?module=pcr&report=preventive"
          className="px-3.5 py-2 bg-zinc-900 border border-zinc-850 hover:border-amber-500/30 text-zinc-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <span>PA-Details (Preventive Action Shortcut)</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card p-4 rounded-xl border border-zinc-800 flex flex-wrap items-center gap-4 bg-zinc-900/20">
        <div className="flex-1 min-w-[200px] relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Search GD, Call Type, Complainant, IO..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 focus:border-amber-500 focus:outline-none rounded-lg text-xs text-zinc-200 placeholder-zinc-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg text-xs text-zinc-300 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg text-xs text-zinc-300 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg text-xs text-zinc-300 focus:outline-none"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft (Editable)</option>
            <option value="submitted">Submitted (Locked)</option>
          </select>
        </div>

        <button
          onClick={fetchPcrs}
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
      ) : pcrs.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-2xl border border-zinc-850">
          <AlertTriangle className="mx-auto text-amber-500/60 mb-3" size={32} />
          <h3 className="font-bold text-zinc-300">No records found</h3>
          <p className="text-zinc-500 text-xs mt-1">Adjust filters or register a new PCR call entry.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pcrs.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(String(p.id))}
              className="glass-card p-5 rounded-xl border border-zinc-800 bg-zinc-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:border-amber-500/30 transition-all"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-bold text-xs text-amber-500 font-mono bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                    S.No: {p.seq_no}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider bg-zinc-800/80 px-2 py-1 rounded border border-zinc-700/50">
                    {p.ps_name}
                  </span>
                  <span className="text-zinc-500 text-xs">
                    GD No: <span className="text-zinc-300 font-medium">{p.gd_no}</span>
                  </span>
                  <span className="text-zinc-500 text-xs">
                    ({p.gd_date})
                  </span>
                </div>

                <div className="text-sm font-semibold text-zinc-200">
                  {p.call_head} &mdash;{' '}
                  <span className="text-zinc-400 font-medium text-xs">
                    {p.complainant_name}
                  </span>
                </div>

                <p className="text-zinc-400 text-xs line-clamp-1">
                  Gist: {p.call_gist}
                </p>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-4 border-t border-zinc-850 pt-3 md:border-none md:pt-0">
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${p.submission_status === 'submitted' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                    {p.submission_status}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    IO: {p.io_name}
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

// ── SUB-COMPONENT: PCR DETAILS ──────────────────────────────────────────────────
const PcrDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/records/pcr/${id}`);
      setDetails(response.data.data);
    } catch (err) {
      toast.error('Failed to load PCR details.');
      navigate(ROUTES.PCR);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Clock className="animate-spin text-amber-500" size={32} />
      </div>
    );
  }

  const p = details?.pcr;
  const cfs = details?.customFields || {};
  const logs = details?.auditLogs || [];

  return (
    <div className="space-y-8">
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
            PCR Entry: <span className="text-amber-500 font-mono">S.No {p?.seq_no} ({p?.record_date})</span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 md:p-8 rounded-2xl border border-zinc-800 space-y-6">
            <h2 className="text-md font-bold text-zinc-200 border-b border-zinc-800 pb-3 flex items-center justify-between">
              <span>PCR Call Details</span>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${p?.submission_status === 'submitted' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                {p?.submission_status}
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Police Station</span>
                <span className="font-semibold text-zinc-200">{p?.ps_name} ({p?.district_name})</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">General Diary Entry</span>
                <span className="font-semibold text-zinc-200">{p?.gd_no} (Date: {p?.gd_date} Time: {p?.gd_time})</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Complainant / Victim</span>
                <span className="font-semibold text-zinc-200 block">{p?.complainant_name}</span>
                <span className="text-zinc-400 text-xs">{p?.complainant_address}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Call Category Head</span>
                <span className="font-semibold text-amber-500 uppercase">{p?.call_head}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Investigating Officers</span>
                <span className="font-semibold text-zinc-200 block">IO: {p?.io_name}</span>
                {p?.eo_name && <span className="text-zinc-400 text-xs block mt-0.5">EO: {p?.eo_name}</span>}
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Resolution Status</span>
                <span className="font-semibold text-zinc-200 block">{p?.status}</span>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-6">
              <span className="text-zinc-500 text-xs block mb-2">PCR Call Gist / Complaint Facts</span>
              <p className="text-zinc-300 text-xs bg-zinc-900/50 p-4 rounded-xl border border-zinc-850 leading-relaxed font-mono">
                {p?.call_gist}
              </p>
            </div>
          </div>

          {/* Dispatch arrival details */}
          <div className="glass-card p-6 rounded-2xl border border-zinc-800 space-y-6">
            <h2 className="text-md font-bold text-zinc-200 border-b border-zinc-800 pb-3">
              Dispatch Arrival & Geo-Location
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Arrival DD Entry</span>
                <span className="font-semibold text-zinc-200 block">{p?.arrival_dd_no} (Date: {p?.arrival_date} Time: {p?.arrival_time})</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Beat / Location Coordinate</span>
                <span className="font-semibold text-zinc-200 block">Beat No: {p?.beat_no}</span>
                {(p?.latitude || p?.longitude) && (
                  <span className="text-zinc-400 text-xs block mt-0.5">Lat: {p?.latitude || 'N/A'} | Long: {p?.longitude || 'N/A'}</span>
                )}
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-6">
              <span className="text-zinc-500 text-xs block mb-2">Action Taken Report</span>
              <p className="text-zinc-300 text-xs bg-zinc-900/50 p-4 rounded-xl border border-zinc-850 leading-relaxed">
                {p?.action_taken}
              </p>
            </div>
          </div>

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

        {/* Audit Revisions Log */}
        <div className="glass-card p-6 rounded-2xl border border-zinc-800 space-y-4">
          <h3 className="font-bold text-zinc-200 border-b border-zinc-800 pb-2">
            Revision Log
          </h3>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
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
  );
};

// ── SUB-COMPONENT: PCR FORM (NEW/EDIT) ──────────────────────────────────────────
const PcrForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Reference lists
  const [callHeads, setCallHeads] = useState([]);
  const [customFieldsDef, setCustomFieldsDef] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [recordDate, setRecordDate] = useState(new Date().toISOString().slice(0, 10));
  const [gdNo, setGdNo] = useState('');
  const [gdDate, setGdDate] = useState(new Date().toISOString().slice(0, 10));
  const [gdTime, setGdTime] = useState('');
  const [callHead, setCallHead] = useState('');
  const [complainantName, setComplainantName] = useState('');
  const [complainantAddress, setComplainantAddress] = useState('');
  const [callGist, setCallGist] = useState('');
  const [ioName, setIoName] = useState('');
  const [eoName, setEoName] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [status, setStatus] = useState('Pending');
  const [arrivalDdNo, setArrivalDdNo] = useState('');
  const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().slice(0, 10));
  const [arrivalTime, setArrivalTime] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [beatNo, setBeatNo] = useState('');
  const [customFields, setCustomFields] = useState({});

  const loadReferenceData = async () => {
    try {
      const chRes = await axios.get('/api/v1/admin/case-heads');
      const filtered = chRes.data.data.caseHeads.filter(ch => ch.category === 'PCR');
      setCallHeads(filtered);

      const cfsRes = await axios.get('/api/v1/admin/custom-fields/ps?module=pcr');
      setCustomFieldsDef(cfsRes.data.data.customFields);
    } catch (e) {
      toast.error('Failed to load lists.');
    }
  };

  const loadDraftDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/records/pcr/${id}`);
      const p = response.data.data.pcr;
      const cfs = response.data.data.customFields;

      if (response.data.data.submission_status === 'submitted') {
        toast.error('Record is submitted and locked.');
        navigate(ROUTES.PCR);
        return;
      }

      setRecordDate(p.record_date);
      setGdNo(p.gd_no);
      setGdDate(p.gd_date);
      setGdTime(p.gd_time);
      setCallHead(p.call_head);
      setComplainantName(p.complainant_name);
      setComplainantAddress(p.complainant_address);
      setCallGist(p.call_gist);
      setIoName(p.io_name);
      setEoName(p.eo_name || '');
      setActionTaken(p.action_taken);
      setStatus(p.status);
      setArrivalDdNo(p.arrival_dd_no);
      setArrivalDate(p.arrival_date);
      setArrivalTime(p.arrival_time);
      setLatitude(p.latitude || '');
      setLongitude(p.longitude || '');
      setBeatNo(p.beat_no);

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
    setCustomFields(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async (submitType) => {
    if (!gdNo || !gdDate || !gdTime || !callHead || !complainantName || !complainantAddress || !callGist || !ioName || !actionTaken || !status || !arrivalDdNo || !arrivalDate || !arrivalTime || !beatNo) {
      toast.error('Please fill in all mandatory fields.');
      return;
    }

    // Dynamic checks
    for (const def of customFieldsDef) {
      if (def.isRequired && !customFields[def.fieldKey]) {
        toast.error(`Custom field "${def.fieldLabel}" is required.`);
        return;
      }
    }

    const payload = {
      recordDate,
      gdNo,
      gdDate,
      gdTime,
      callHead,
      complainantName,
      complainantAddress,
      callGist,
      ioName,
      eoName,
      actionTaken,
      status,
      arrivalDdNo,
      arrivalDate,
      arrivalTime,
      latitude,
      longitude,
      beatNo,
      submissionStatus: submitType,
      customFields
    };

    try {
      if (isEdit) {
        await axios.put(`/api/v1/records/pcr/${id}`, payload);
        toast.success(submitType === 'submitted' ? 'PCR submitted & locked.' : 'Draft updated.');
      } else {
        await axios.post('/api/v1/records/pcr', payload);
        toast.success(submitType === 'submitted' ? 'PCR registered & locked.' : 'Draft saved.');
      }
      navigate(ROUTES.PCR);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transaction submission failed.');
    }
  };

  return (
    <div className="space-y-6">
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
            {isEdit ? 'Update PCR Call Entry' : 'Register New PCR / Kalandra'}
          </h1>
        </div>
      </div>

      <div className="space-y-6 bg-zinc-950 p-1">
        {/* Section 1: GD No. Date & Time */}
        <div className="glass-card p-6 rounded-2xl border border-zinc-850 bg-zinc-900/10 space-y-4">
          <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-zinc-850 pb-2">
            1. GD (General Diary) Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              <label className="text-xs font-semibold text-zinc-400 uppercase">GD Entry Number</label>
              <input
                type="text"
                placeholder="e.g. PCR-44B"
                value={gdNo}
                onChange={(e) => setGdNo(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>

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
        </div>

        {/* Section 2: Call Head & Beat */}
        <div className="glass-card p-6 rounded-2xl border border-zinc-850 bg-zinc-900/10 space-y-4">
          <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-zinc-850 pb-2">
            2. Call Category & Beat
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">PCR Call Category (Head)</label>
              <select
                value={callHead}
                onChange={(e) => setCallHead(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              >
                <option value="">Select Category...</option>
                {callHeads.map(ch => (
                  <option key={ch.id} value={ch.code}>{ch.code} - {ch.description}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Beat Number</label>
              <input
                type="text"
                placeholder="e.g. Beat 4"
                value={beatNo}
                onChange={(e) => setBeatNo(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Name & Address of Complainant */}
        <div className="glass-card p-6 rounded-2xl border border-zinc-850 bg-zinc-900/10 space-y-4">
          <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-zinc-850 pb-2">
            3. Name & Address of Complainant / Caller
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Complainant / Caller Name</label>
              <input
                type="text"
                placeholder="Caller Name"
                value={complainantName}
                onChange={(e) => setComplainantName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Complainant Address</label>
              <input
                type="text"
                placeholder="Location/Address"
                value={complainantAddress}
                onChange={(e) => setComplainantAddress(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Section 4: PCR Call Gist */}
        <div className="glass-card p-6 rounded-2xl border border-zinc-850 bg-zinc-900/10 space-y-4">
          <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-zinc-850 pb-2">
            4. PCR Call Gist (Complaint details)
          </h2>
          <div className="space-y-2">
            <textarea
              value={callGist}
              onChange={(e) => setCallGist(e.target.value)}
              rows="3"
              className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              placeholder="Summarize the nature of complaint or emergency..."
            />
          </div>
        </div>

        {/* Section 5: Arrival DD No. Date & Time */}
        <div className="glass-card p-6 rounded-2xl border border-zinc-850 bg-zinc-900/10 space-y-4">
          <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-zinc-850 pb-2">
            5. Arrival details at Scene
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Arrival DD Entry Number</label>
              <input
                type="text"
                placeholder="e.g. ARR-14A"
                value={arrivalDdNo}
                onChange={(e) => setArrivalDdNo(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Arrival Date</label>
              <input
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Arrival Time</label>
              <input
                type="time"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Section 6: Location (Lat. & Long.) */}
        <div className="glass-card p-6 rounded-2xl border border-zinc-850 bg-zinc-900/10 space-y-4">
          <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-zinc-850 pb-2">
            6. Location coordinates (Latitude & Longitude)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Latitude (Decimal Degrees)</label>
              <input
                type="text"
                placeholder="e.g. 28.7041"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Longitude (Decimal Degrees)</label>
              <input
                type="text"
                placeholder="e.g. 77.1025"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Section 7: Name of IO/EO & Status */}
        <div className="glass-card p-6 rounded-2xl border border-zinc-850 bg-zinc-900/10 space-y-4">
          <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-zinc-850 pb-2">
            7. Officers assigned & Resolution Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Investigating Officer (IO) Name</label>
              <input
                type="text"
                placeholder="IO Name"
                value={ioName}
                onChange={(e) => setIoName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Enquiry Officer (EO) Name (Optional)</label>
              <input
                type="text"
                placeholder="EO Name"
                value={eoName}
                onChange={(e) => setEoName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Resolution Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              >
                <option value="Pending">Pending</option>
                <option value="Action Taken">Action Taken</option>
                <option value="Referred">Referred</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 8: Action Taken Brief */}
        <div className="glass-card p-6 rounded-2xl border border-zinc-850 bg-zinc-900/10 space-y-4">
          <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-zinc-850 pb-2">
            8. Action Taken Brief
          </h2>
          <div className="space-y-2">
            <textarea
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              rows="3"
              className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              placeholder="Outline action taken, warning, compromise, or preventive detention..."
            />
          </div>
        </div>

        {/* Dynamic Custom Fields EAV */}
        {customFieldsDef.length > 0 && (
          <div className="glass-card p-6 rounded-2xl border border-zinc-850 bg-zinc-900/10 space-y-4">
            <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-zinc-850 pb-2">
              9. District/Station Custom Fields
            </h2>
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
                      className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">Choose item...</option>
                      {def.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input
                      type={def.fieldType === 'number' ? 'number' : def.fieldType === 'date' ? 'date' : 'text'}
                      value={customFields[def.fieldKey] || ''}
                      onChange={(e) => handleCustomFieldChange(def.fieldKey, e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                      placeholder={`Enter ${def.fieldLabel.toLowerCase()}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Buttons Panel */}
        <div className="flex justify-end gap-3 pt-6 border-t border-zinc-800">
          <button
            type="button"
            onClick={() => navigate(ROUTES.PCR)}
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
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

export const PCRPage = () => {
  return (
    <Routes>
      <Route path="" element={<PcrList />} />
      <Route path="new" element={<PcrForm />} />
      <Route path=":id" element={<PcrDetails />} />
      <Route path=":id/edit" element={<PcrForm />} />
    </Routes>
  );
};
