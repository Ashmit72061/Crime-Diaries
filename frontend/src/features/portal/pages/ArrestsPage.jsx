import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore.js';
import { ROUTES } from '../../../utils/constants.js';
import axios from 'axios';
import { 
  Plus, Search, Calendar, ShieldAlert, ChevronRight, Save, Send, 
  ArrowLeft, Edit3, Clock, AlertTriangle, FileSpreadsheet, ListFilter, UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── SUB-COMPONENT: ARRESTS LIST ────────────────────────────────────────────────
const ArrestsList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [arrests, setArrests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchArrests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (statusFilter) params.submissionStatus = statusFilter;

      const response = await axios.get('/api/v1/records/arrests', { params });
      setArrests(response.data.data.arrests);
    } catch (err) {
      toast.error('Failed to load arrests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArrests();
  }, [dateFrom, dateTo, statusFilter]);

  const triggerExport = () => {
    const query = new URLSearchParams({
      recordType: 'arrests',
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
            <ShieldAlert className="text-amber-500" />
            <span>Arrests Register</span>
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Browse and review arrested/detained person entries under your jurisdiction.
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
              <span>Record new arrest</span>
            </Link>
          )}
        </div>
      </div>

      {/* Quick Links Section */}
      <div className="flex flex-wrap gap-2">
        <Link
          to="/analytics?module=arrests&report=headwise"
          className="px-3.5 py-2 bg-zinc-900 border border-zinc-850 hover:border-amber-500/30 text-zinc-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <span>Headwise Criminals View</span>
        </Link>
        <Link
          to="/analytics?module=arrests&report=recovery"
          className="px-3.5 py-2 bg-zinc-900 border border-zinc-850 hover:border-amber-500/30 text-zinc-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <span>Criminals with Recovery</span>
        </Link>
        <Link
          to="/analytics?module=arrests&report=property"
          className="px-3.5 py-2 bg-zinc-900 border border-zinc-850 hover:border-amber-500/30 text-zinc-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <span>Property Criminals View</span>
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
            placeholder="Search Arrested Name, FIR, Officers..."
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
            className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
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
          onClick={fetchArrests}
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
      ) : arrests.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-2xl border border-zinc-850">
          <AlertTriangle className="mx-auto text-amber-500/60 mb-3" size={32} />
          <h3 className="font-bold text-zinc-300">No records found</h3>
          <p className="text-zinc-500 text-xs mt-1">Adjust filters or register a new arrest entry.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {arrests.map((a) => (
            <div
              key={a.id}
              onClick={() => navigate(String(a.id))}
              className="glass-card p-5 rounded-xl border border-zinc-800 bg-zinc-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:border-amber-500/30 transition-all"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-bold text-xs text-amber-500 font-mono bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                    S.No: {a.seq_no}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider bg-zinc-800/80 px-2 py-1 rounded border border-zinc-700/50">
                    {a.ps_name}
                  </span>
                  {a.linked_fir_dd_no && (
                    <span className="text-zinc-400 text-xs">
                      FIR: <span className="font-semibold text-zinc-300">{a.linked_fir_dd_no}</span>
                    </span>
                  )}
                  <span className="text-zinc-500 text-xs">
                    Arrest Date: <span className="text-zinc-300 font-medium">{a.arrest_date} ({a.arrest_time})</span>
                  </span>
                </div>

                <div className="text-sm font-semibold text-zinc-200">
                  {a.arrested_name} &mdash;{' '}
                  <span className="text-red-400 font-medium">
                    {a.override_code || a.crime_head_code}
                  </span>
                </div>

                <p className="text-zinc-400 text-xs">
                  Place of Arrest: {a.arrest_place} | Address Status: {a.address_verified}
                </p>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-4 border-t border-zinc-850 pt-3 md:border-none md:pt-0">
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${a.submission_status === 'submitted' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                    {a.submission_status}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    Status: {a.status}
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

// ── SUB-COMPONENT: ARREST DETAILS & OVERRIDE ────────────────────────────────────
const ArrestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  // Override Modal States
  const [overrideModal, setOverrideModal] = useState(false);
  const [crimeHeadsList, setCrimeHeadsList] = useState([]);
  const [selectedHead, setSelectedHead] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/records/arrests/${id}`);
      setDetails(response.data.data);
    } catch (err) {
      toast.error('Failed to load arrest details.');
      navigate(ROUTES.ARRESTS);
    } finally {
      setLoading(false);
    }
  };

  const loadCrimeHeads = async () => {
    try {
      const response = await axios.get('/api/v1/admin/case-heads');
      const filtered = response.data.data.caseHeads.filter(ch => ch.category === 'Arrests');
      setCrimeHeadsList(filtered);
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
      await axios.patch(`/api/v1/records/arrests/${id}/override`, {
        crimeHeadId: selectedHead,
        reason: overrideReason
      });
      toast.success('Crime Head overridden successfully.');
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

  const a = details?.arrest;
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
            Arrest Record: <span className="text-amber-500 font-mono">S.No {a?.seq_no} ({a?.record_date})</span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 md:p-8 rounded-2xl border border-zinc-800 space-y-6">
            <h2 className="text-md font-bold text-zinc-200 border-b border-zinc-800 pb-3 flex items-center justify-between">
              <span>Arrest Details</span>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${a?.submission_status === 'submitted' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                {a?.submission_status}
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Police Station</span>
                <span className="font-semibold text-zinc-200">{a?.ps_name} ({a?.district_name})</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Arrested Person</span>
                <div className="flex items-start gap-3">
                  {a?.accused_photo && (
                    <img 
                      src={a.accused_photo} 
                      alt="Accused" 
                      className="w-16 h-16 rounded-lg object-cover border border-zinc-800 shadow"
                    />
                  )}
                  <div>
                    <span className="font-bold text-zinc-100 text-base">{a?.arrested_name}</span>
                    <span className="text-zinc-400 text-xs block mt-0.5">{a?.arrested_address}</span>
                  </div>
                </div>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Arrest Time & Place</span>
                <span className="font-semibold text-zinc-200">{a?.arrest_place} (Date: {a?.arrest_date} Time: {a?.arrest_time})</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Linked FIR/DD Reference</span>
                <span className="font-semibold text-zinc-200">{a?.linked_fir_dd_no || 'None'} {a?.linked_fir_dd_date && `(${a?.linked_fir_dd_date})`}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Classification Head</span>
                <span className="font-semibold text-amber-500 uppercase">{a?.crime_head_code}</span>
                <span className="text-zinc-400 text-xs block">{a?.crime_head_desc}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">DCP Overridden Classification</span>
                {a?.override_code ? (
                  <>
                    <span className="font-semibold text-red-400 uppercase">{a?.override_code}</span>
                    <span className="text-zinc-400 text-xs block">{a?.override_desc}</span>
                  </>
                ) : (
                  <span className="text-zinc-500 italic">None applied</span>
                )}
              </div>
            </div>
          </div>

          {/* Verification details */}
          <div className="glass-card p-6 rounded-2xl border border-zinc-800 space-y-6">
            <h2 className="text-md font-bold text-zinc-200 border-b border-zinc-800 pb-3">
              Verification, Schemes & Material
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Address Verification Status</span>
                <span className={`font-semibold text-xs px-2.5 py-1 rounded border inline-block ${a?.address_verified === 'Verified' ? 'bg-green-500/10 border-green-500/20 text-green-400' : a?.address_verified === 'Pending' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                  {a?.address_verified}
                </span>
                {a?.verifying_officer_name && (
                  <span className="text-zinc-400 text-xs block mt-1">Verified By: {a?.verifying_officer_name} ({a?.verifying_officer_rank})</span>
                )}
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Special Patrol Scheme</span>
                <span className="font-semibold text-zinc-200 block">{a?.special_scheme}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Current Custody Status</span>
                <span className="font-semibold text-zinc-200 block capitalize">{a?.status === 'others' ? a?.status_other_text : a?.status}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Recovered Material</span>
                <span className="font-semibold text-zinc-200 block">{a?.recovered_material || 'None reported'}</span>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-6 grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-zinc-500 block mb-1">NAFIS Prepared</span>
                <span className="font-semibold text-zinc-200">{a?.nafis_prepared}</span>
              </div>
              <div>
                <span className="text-zinc-500 block mb-1">Dossier Prepared</span>
                <span className="font-semibold text-zinc-200">{a?.dossier_prepared}</span>
              </div>
              <div>
                <span className="text-zinc-500 block mb-1">Search Slip Prepared</span>
                <span className="font-semibold text-zinc-200">{a?.search_slip_prepared}</span>
              </div>
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

        {/* Overrides and audits */}
        <div className="space-y-6">
          {user?.role === 'dcp' && (
            <div className="glass-card p-6 rounded-2xl border border-red-500/20 bg-red-950/5 space-y-4">
              <h3 className="font-bold text-zinc-200 flex items-center gap-2">
                <ShieldAlert className="text-red-400 animate-pulse" />
                <span>DCP Reclassification Review</span>
              </h3>
              <p className="text-zinc-400 text-xs">
                As District DCP, you can modify the Crime Head classification of this submitted record.
              </p>
              <button
                onClick={() => {
                  loadCrimeHeads();
                  setOverrideModal(true);
                }}
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Apply Reclassification
              </button>
            </div>
          )}

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
                <label className="text-xs font-semibold text-zinc-400 uppercase">New Crime Head Code</label>
                <select
                  value={selectedHead}
                  onChange={(e) => setSelectedHead(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="">Select Category...</option>
                  {crimeHeadsList.map(ch => (
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
                  placeholder="State the justification for reclassifying the arrest crime head..."
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
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Apply Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ── SUB-COMPONENT: ARRESTS FORM (NEW/EDIT) ──────────────────────────────────────
const ArrestsForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Reference lists
  const [crimeHeads, setCrimeHeads] = useState([]);
  const [casesList, setCasesList] = useState([]);
  const [customFieldsDef, setCustomFieldsDef] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [recordDate, setRecordDate] = useState(new Date().toISOString().slice(0, 10));
  const [linkedCaseId, setLinkedCaseId] = useState('');
  const [linkedFirDdNo, setLinkedFirDdNo] = useState('');
  const [linkedFirDdDate, setLinkedFirDdDate] = useState('');
  const [linkedFirDdTime, setLinkedFirDdTime] = useState('');
  const [actName, setActName] = useState('');
  const [actSections, setActSections] = useState('');
  const [arrestedName, setArrestedName] = useState('');
  const [arrestedAddress, setArrestedAddress] = useState('');
  const [arrestDate, setArrestDate] = useState(new Date().toISOString().slice(0, 10));
  const [arrestTime, setArrestTime] = useState('');
  const [arrestPlace, setArrestPlace] = useState('');
  const [informantName, setInformantName] = useState('');
  const [informantAddress, setInformantAddress] = useState('');
  const [informantTel, setInformantTel] = useState('');
  const [nafisPrepared, setNafisPrepared] = useState('No');
  const [dossierPrepared, setDossierPrepared] = useState('No');
  const [searchSlipPrepared, setSearchSlipPrepared] = useState('No');
  const [addressVerified, setAddressVerified] = useState('Pending');
  const [verifyingOfficerName, setVerifyingOfficerName] = useState('');
  const [verifyingOfficerRank, setVerifyingOfficerRank] = useState('');
  const [crimeHeadId, setCrimeHeadId] = useState('');
  const [status, setStatus] = useState('bail');
  const [statusOtherText, setStatusOtherText] = useState('');
  const [recoveredMaterial, setRecoveredMaterial] = useState('');
  const [specialScheme, setSpecialScheme] = useState('None');
  const [accusedPhoto, setAccusedPhoto] = useState('');
  const [customFields, setCustomFields] = useState({});

  const loadReferenceData = async () => {
    try {
      const chRes = await axios.get('/api/v1/admin/case-heads');
      setCrimeHeads(chRes.data.data.caseHeads.filter(ch => ch.category === 'Arrests'));

      const casesRes = await axios.get('/api/v1/records/cases');
      setCasesList(casesRes.data.data.cases);

      const cfsRes = await axios.get('/api/v1/admin/custom-fields/ps?module=arrests');
      setCustomFieldsDef(cfsRes.data.data.customFields);
    } catch (e) {
      toast.error('Failed to load lists.');
    }
  };

  const loadDraftDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/records/arrests/${id}`);
      const a = response.data.data.arrest;
      const cfs = response.data.data.customFields;

      if (response.data.data.submission_status === 'submitted') {
        toast.error('Record is submitted and locked.');
        navigate(ROUTES.ARRESTS);
        return;
      }

      setRecordDate(a.record_date);
      setLinkedCaseId(a.linked_case_id || '');
      setLinkedFirDdNo(a.linked_fir_dd_no || '');
      setLinkedFirDdDate(a.linked_fir_dd_date || '');
      setLinkedFirDdTime(a.linked_fir_dd_time || '');
      setActName(a.act_name);
      setActSections(a.act_sections);
      setArrestedName(a.arrested_name);
      setArrestedAddress(a.arrested_address);
      setArrestDate(a.arrest_date);
      setArrestTime(a.arrest_time);
      setArrestPlace(a.arrest_place);
      setInformantName(a.informant_name);
      setInformantAddress(a.informant_address);
      setInformantTel(a.informant_tel);
      setNafisPrepared(a.nafis_prepared);
      setDossierPrepared(a.dossier_prepared);
      setSearchSlipPrepared(a.search_slip_prepared);
      setAddressVerified(a.address_verified);
      setVerifyingOfficerName(a.verifying_officer_name || '');
      setVerifyingOfficerRank(a.verifying_officer_rank || '');
      setCrimeHeadId(a.crime_head_id);
      setStatus(a.status);
      setStatusOtherText(a.status_other_text || '');
      setRecoveredMaterial(a.recovered_material || '');
      setSpecialScheme(a.special_scheme);
      setAccusedPhoto(a.accused_photo || '');

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

  const handleCaseLinkChange = (caseId) => {
    setLinkedCaseId(caseId);
    if (caseId) {
      const match = casesList.find(c => String(c.id) === String(caseId));
      if (match) {
        setLinkedFirDdNo(match.fir_no || match.gd_no);
        setLinkedFirDdDate(match.fir_date || match.gd_date);
        setLinkedFirDdTime(match.gd_time || '');
        setActName(match.act_name);
        setActSections(match.section_text);
      }
    } else {
      setLinkedFirDdNo('');
      setLinkedFirDdDate('');
      setLinkedFirDdTime('');
      setActName('');
      setActSections('');
    }
  };

  const handleCustomFieldChange = (key, val) => {
    setCustomFields(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async (submitType) => {
    if (!actName || !actSections || !arrestedName || !arrestedAddress || !arrestDate || !arrestTime || !arrestPlace || !informantName || !informantAddress || !informantTel || !crimeHeadId) {
      toast.error('Please fill in all mandatory fields.');
      return;
    }

    if (status === 'others' && !statusOtherText.trim()) {
      toast.error('Please specify the custody details.');
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
      linkedCaseId: linkedCaseId || null,
      linkedFirDdNo,
      linkedFirDdDate: linkedFirDdDate || null,
      linkedFirDdTime,
      actName,
      actSections,
      arrestedName,
      arrestedAddress,
      arrestDate,
      arrestTime,
      arrestPlace,
      informantName,
      informantAddress,
      informantTel,
      nafisPrepared,
      dossierPrepared,
      searchSlipPrepared,
      addressVerified,
      verifyingOfficerName,
      verifyingOfficerRank,
      crimeHeadId,
      status,
      statusOtherText,
      recoveredMaterial,
      specialScheme,
      accusedPhoto,
      submissionStatus: submitType,
      customFields
    };

    try {
      if (isEdit) {
        await axios.put(`/api/v1/records/arrests/${id}`, payload);
        toast.success(submitType === 'submitted' ? 'Arrest submitted & locked.' : 'Draft updated.');
      } else {
        await axios.post('/api/v1/records/arrests', payload);
        toast.success(submitType === 'submitted' ? 'Arrest registered & locked.' : 'Draft saved.');
      }
      navigate(ROUTES.ARRESTS);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transaction submission failed.');
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAccusedPhoto(reader.result);
      };
      reader.readAsDataURL(file);
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
            {isEdit ? 'Update Arrest Record' : 'Register New Arrest Entry'}
          </h1>
        </div>
      </div>

      <div className="space-y-6 bg-zinc-950 p-1">
        {/* Section 1: Case & Record Info */}
        <div className="glass-card p-6 rounded-2xl border border-zinc-850 bg-zinc-900/10 space-y-4">
          <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-zinc-850 pb-2">
            1. Case & Record Reference
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <label className="text-xs font-semibold text-zinc-400 uppercase">Link Existing Case (Optional)</label>
              <select
                value={linkedCaseId}
                onChange={(e) => handleCaseLinkChange(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              >
                <option value="">Unlinked Arrest...</option>
                {casesList.map(c => (
                  <option key={c.id} value={c.id}>{c.uid} - {c.complainant_name} ({c.gd_no})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Linked FIR/DD Details (No, Date, Time) */}
        <div className="glass-card p-6 rounded-2xl border border-zinc-850 bg-zinc-900/10 space-y-4">
          <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-zinc-850 pb-2">
            2. Linked FIR / DD Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">FIR / DD No</label>
              <input
                type="text"
                value={linkedFirDdNo}
                onChange={(e) => setLinkedFirDdNo(e.target.value)}
                placeholder="Enter FIR or DD No"
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Date of FIR / DD</label>
              <input
                type="date"
                value={linkedFirDdDate}
                onChange={(e) => setLinkedFirDdDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Time of FIR / DD</label>
              <input
                type="time"
                value={linkedFirDdTime}
                onChange={(e) => setLinkedFirDdTime(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Act & Sections */}
        <div className="glass-card p-6 rounded-2xl border border-zinc-850 bg-zinc-900/10 space-y-4">
          <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-zinc-850 pb-2">
            3. Acts, Sections & Major Crime Head
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Act Name / Code</label>
              <input
                type="text"
                placeholder="e.g. IPC / NDPS"
                value={actName}
                onChange={(e) => setActName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Applicable Sections</label>
              <input
                type="text"
                placeholder="e.g. 379 / 411 IPC"
                value={actSections}
                onChange={(e) => setActSections(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Major Crime Head Category</label>
              <select
                value={crimeHeadId}
                onChange={(e) => setCrimeHeadId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              >
                <option value="">Choose head category...</option>
                {crimeHeads.map(ch => (
                  <option key={ch.id} value={ch.id}>{ch.code} - {ch.description}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Arrested/Detained Person Details & Photo */}
        <div className="glass-card p-6 rounded-2xl border border-zinc-850 bg-zinc-900/10 space-y-4">
          <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-zinc-850 pb-2">
            4. Arrested / Detained Person details & Photo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 md:col-span-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase">Full Name of Arrested/Detained Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={arrestedName}
                    onChange={(e) => setArrestedName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase">Address of Arrested/Detained Person</label>
                  <textarea
                    placeholder="Residential address"
                    value={arrestedAddress}
                    onChange={(e) => setArrestedAddress(e.target.value)}
                    rows="2"
                    className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 flex flex-col justify-center items-center bg-zinc-900/20 border border-zinc-850 p-4 rounded-xl">
              <label className="text-xs font-semibold text-zinc-400 uppercase mb-2">Accused Photo</label>
              {accusedPhoto ? (
                <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-zinc-800 shadow-md">
                  <img src={accusedPhoto} alt="Accused Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setAccusedPhoto('')}
                    className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-600 text-white rounded-full p-1 text-[10px] leading-none transition-colors shadow-sm"
                    title="Remove Photo"
                  >
                    &times;
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-lg p-4 w-28 h-28 hover:border-amber-500/50 transition-colors relative bg-zinc-950/40">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <span className="text-[10px] text-zinc-500 text-center select-none">Click to upload photo</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 5: Date, Time & Place of Arrest */}
        <div className="glass-card p-6 rounded-2xl border border-zinc-850 bg-zinc-900/10 space-y-4">
          <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-zinc-850 pb-2">
            5. Date, Time & Place of Arrest
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Date of Arrest</label>
              <input
                type="date"
                value={arrestDate}
                onChange={(e) => setArrestDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Time of Arrest</label>
              <input
                type="time"
                value={arrestTime}
                onChange={(e) => setArrestTime(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Place of Arrest</label>
              <input
                type="text"
                placeholder="e.g. Platform 2, Adarsh Nagar Metro"
                value={arrestPlace}
                onChange={(e) => setArrestPlace(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Section 6: Whom Information Given (Informant) */}
        <div className="glass-card p-6 rounded-2xl border border-zinc-850 bg-zinc-900/10 space-y-4">
          <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-zinc-850 pb-2">
            6. Name, Address & Tel No. to Whom Information Given
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Informant Full Name</label>
              <input
                type="text"
                placeholder="Next of kin / Informant"
                value={informantName}
                onChange={(e) => setInformantName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Informant Address</label>
              <input
                type="text"
                placeholder="Residential address"
                value={informantAddress}
                onChange={(e) => setInformantAddress(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Informant Telephone / Contact No</label>
              <input
                type="text"
                placeholder="Contact number"
                value={informantTel}
                onChange={(e) => setInformantTel(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Section 7: Verification & Status */}
        <div className="glass-card p-6 rounded-2xl border border-zinc-850 bg-zinc-900/10 space-y-4">
          <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-zinc-850 pb-2">
            7. Address Verification & Custody Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Whether Given Address is Found Correct or Not</label>
              <select
                value={addressVerified}
                onChange={(e) => setAddressVerified(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              >
                <option value="Pending">Pending</option>
                <option value="Verified">Verified</option>
                <option value="Not Verified">Not Verified</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className={`text-xs font-semibold uppercase ${addressVerified !== 'Verified' ? 'text-zinc-600' : 'text-zinc-400'}`}>Name of Address Verifying Officer</label>
              <input
                type="text"
                placeholder="Officer Name"
                value={verifyingOfficerName}
                onChange={(e) => setVerifyingOfficerName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500 disabled:opacity-50 disabled:bg-zinc-900/30 disabled:border-zinc-900/50"
                disabled={addressVerified !== 'Verified'}
              />
            </div>

            <div className="space-y-2">
              <label className={`text-xs font-semibold uppercase ${addressVerified !== 'Verified' ? 'text-zinc-600' : 'text-zinc-400'}`}>Rank of Verifying Officer</label>
              <input
                type="text"
                placeholder="Officer Rank"
                value={verifyingOfficerRank}
                onChange={(e) => setVerifyingOfficerRank(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500 disabled:opacity-50 disabled:bg-zinc-900/30 disabled:border-zinc-900/50"
                disabled={addressVerified !== 'Verified'}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Custody Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              >
                <option value="bail">Bail</option>
                <option value="judicial custody">Judicial Custody</option>
                <option value="police custody">Police Custody</option>
                <option value="others">Others (Specify)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Special Patrol Scheme</label>
              <select
                value={specialScheme}
                onChange={(e) => setSpecialScheme(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              >
                <option value="None">None</option>
                <option value="integrated patrolling">Integrated Patrolling</option>
                <option value="group patrolling">Group Patrolling</option>
                <option value="cycle patrolling">Cycle Patrolling</option>
                <option value="anti snatching">Anti Snatching Scheme</option>
                <option value="PRAHARI">PRAHARI Scheme</option>
                <option value="Eye and ear scheme">Eye and Ear Scheme</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Recovered Material (if any)</label>
              <input
                type="text"
                placeholder="e.g. Snatched mobile / cash"
                value={recoveredMaterial}
                onChange={(e) => setRecoveredMaterial(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Conditional field for others text */}
          {status === 'others' && (
            <div className="space-y-2 pt-4">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Specify Custody details</label>
              <input
                type="text"
                placeholder="Specify custody status details..."
                value={statusOtherText}
                onChange={(e) => setStatusOtherText(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}
        </div>

        {/* Section 8: NAFIS, Dossier, Search Slip Prepared */}
        <div className="glass-card p-6 rounded-2xl border border-zinc-850 bg-zinc-900/10 space-y-4">
          <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-zinc-850 pb-2">
            8. Reference Registers Prepared (NAFIS, Dossier, Search Slip)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Whether NAFIS prepared</label>
              <select
                value={nafisPrepared}
                onChange={(e) => setNafisPrepared(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="Not Applicable">Not Applicable</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Whether Dossier prepared</label>
              <select
                value={dossierPrepared}
                onChange={(e) => setDossierPrepared(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="Not Applicable">Not Applicable</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Whether Search Slip prepared</label>
              <select
                value={searchSlipPrepared}
                onChange={(e) => setSearchSlipPrepared(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="Not Applicable">Not Applicable</option>
              </select>
            </div>
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
            onClick={() => navigate(ROUTES.ARRESTS)}
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

export const ArrestsPage = () => {
  return (
    <Routes>
      <Route path="" element={<ArrestsList />} />
      <Route path="new" element={<ArrestsForm />} />
      <Route path=":id" element={<ArrestDetails />} />
      <Route path=":id/edit" element={<ArrestsForm />} />
    </Routes>
  );
};
