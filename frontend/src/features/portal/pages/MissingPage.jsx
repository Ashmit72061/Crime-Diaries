import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore.js';
import { ROUTES } from '../../../utils/constants.js';
import axios from 'axios';
import { 
  Plus, Search, Calendar, UserMinus, ChevronRight, Save, Send, 
  ArrowLeft, Edit3, Clock, AlertTriangle, FileSpreadsheet, ListFilter
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── SUB-COMPONENT: MISSING LIST ───────────────────────────────────────────────
const MissingList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [missings, setMissings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [subtypeFilter, setSubtypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchMissings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (subtypeFilter) params.recordSubtype = subtypeFilter;
      if (statusFilter) params.submissionStatus = statusFilter;

      const response = await axios.get('/api/v1/records/missing', { params });
      setMissings(response.data.data.missings);
    } catch (err) {
      toast.error('Failed to load missing/recovered records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissings();
  }, [dateFrom, dateTo, subtypeFilter, statusFilter]);

  const triggerExport = () => {
    const query = new URLSearchParams({
      recordType: 'missing',
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
            <UserMinus className="text-amber-500" />
            <span>Missing & Recovered Registry</span>
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Browse and review Missing Persons, Found Persons, and Unidentified Recovered Bodies.
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
              <span>Record new entry</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card p-4 rounded-xl border border-zinc-800 flex flex-wrap items-center gap-4 bg-zinc-900/20">
        <div className="flex-1 min-w-[200px] relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Search DD, Description, IO, Complainant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 focus:border-amber-500 focus:outline-none rounded-lg text-xs text-zinc-200 placeholder-zinc-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Subtype</span>
          <select
            value={subtypeFilter}
            onChange={(e) => setSubtypeFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg text-xs text-zinc-300 focus:outline-none"
          >
            <option value="">All sub-types</option>
            <option value="Missing Person">Missing Person</option>
            <option value="Unidentified Recovered">Unidentified Recovered</option>
            <option value="Found Person">Found Person</option>
          </select>
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
          onClick={fetchMissings}
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
      ) : missings.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-2xl border border-zinc-850">
          <AlertTriangle className="mx-auto text-amber-500/60 mb-3" size={32} />
          <h3 className="font-bold text-zinc-300">No records found</h3>
          <p className="text-zinc-500 text-xs mt-1">Adjust filters or register a new missing person entry.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {missings.map((m) => (
            <div
              key={m.id}
              onClick={() => navigate(String(m.id))}
              className="glass-card p-5 rounded-xl border border-zinc-800 bg-zinc-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:border-amber-500/30 transition-all"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className={`font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${m.record_subtype === 'Missing Person' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : m.record_subtype === 'Found Person' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {m.record_subtype}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider bg-zinc-800/80 px-2 py-1 rounded border border-zinc-700/50">
                    {m.ps_name}
                  </span>
                  <span className="text-zinc-500 text-xs">
                    DD/FIR No: <span className="text-zinc-300 font-medium">{m.dd_fir_no}</span>
                  </span>
                  <span className="text-zinc-500 text-xs">
                    Date: {m.date_missing_recovered}
                  </span>
                </div>

                <div className="text-sm font-semibold text-zinc-200">
                  {m.record_subtype === 'Unidentified Recovered' ? 'Unidentified Body' : 'Person details'} &mdash;{' '}
                  <span className="text-zinc-400 text-xs">
                    Age: {m.age} | Gender: {m.gender}
                  </span>
                </div>

                <p className="text-zinc-400 text-xs line-clamp-1">
                  Description: {m.physical_description}
                </p>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-4 border-t border-zinc-850 pt-3 md:border-none md:pt-0">
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${m.submission_status === 'submitted' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                    {m.submission_status}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    Status: {m.status}
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

// ── SUB-COMPONENT: MISSING DETAILS ──────────────────────────────────────────────
const MissingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/records/missing/${id}`);
      setDetails(response.data.data);
    } catch (err) {
      toast.error('Failed to load details.');
      navigate(ROUTES.MISSING);
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

  const m = details?.missing;
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
            Missing File: <span className="text-amber-500 font-mono">{m?.record_subtype} ({m?.record_date})</span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 md:p-8 rounded-2xl border border-zinc-800 space-y-6">
            <h2 className="text-md font-bold text-zinc-200 border-b border-zinc-800 pb-3 flex items-center justify-between">
              <span>Primary Details</span>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${m?.submission_status === 'submitted' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                {m?.submission_status}
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Police Station</span>
                <span className="font-semibold text-zinc-200">{m?.ps_name} ({m?.district_name})</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Reference Diary/FIR No</span>
                <span className="font-semibold text-zinc-200">{m?.dd_fir_no} (Date: {m?.dd_fir_date} Time: {m?.dd_fir_time || 'N/A'})</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Duty Officer</span>
                <span className="font-semibold text-zinc-200">{m?.duty_officer || 'N/A'}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Person Demographics</span>
                <span className="font-semibold text-zinc-200">
                  Age: {m?.age} | Gender: {m?.gender}
                  {m?.record_subtype === 'Missing Person' && ` | Classification: ${m?.major_minor || 'Unknown'}`}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Date & Time of Event</span>
                <span className="font-semibold text-zinc-200">{m?.date_missing_recovered} at {m?.time_missing_recovered}</span>
              </div>
              {m?.last_seen_location && (
                <div>
                  <span className="text-zinc-500 text-xs block mb-1">Last Seen Location</span>
                  <span className="font-semibold text-zinc-200">{m?.last_seen_location}</span>
                </div>
              )}
              {m?.found_location && (
                <div>
                  <span className="text-zinc-500 text-xs block mb-1">Recovery / Found Location</span>
                  <span className="font-semibold text-zinc-200">{m?.found_location}</span>
                </div>
              )}
              {m?.record_subtype === 'Missing Person' && (
                <>
                  <div>
                    <span className="text-zinc-500 text-xs block mb-1">Track Child Ref No.</span>
                    <span className="font-semibold text-zinc-200">{m?.track_child_no || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-xs block mb-1">Track Child Registration Date</span>
                    <span className="font-semibold text-zinc-200">{m?.track_child_date || 'N/A'}</span>
                  </div>
                </>
              )}
              <div>
                <span className="text-zinc-500 text-xs block mb-1">ZIPNET Registration No.</span>
                <span className="font-semibold text-zinc-200">{m?.zipnet_no || 'N/A'}</span>
              </div>
              {m?.record_subtype === 'Unidentified Recovered' && (
                <div>
                  <span className="text-zinc-500 text-xs block mb-1">Is Identified?</span>
                  <span className="font-semibold text-zinc-200">{m?.is_identified || 'No'}</span>
                </div>
              )}
              {(m?.record_subtype === 'Missing Person' || m?.record_subtype === 'Found Person') && (
                <>
                  <div>
                    <span className="text-zinc-500 text-xs block mb-1">Traced DD Ref No.</span>
                    <span className="font-semibold text-zinc-200">{m?.traced_dd_no || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-xs block mb-1">Linked Case FIR No. & Year</span>
                    <span className="font-semibold text-zinc-200">{m?.fir_no_year || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-xs block mb-1">Linked Case FIR Date</span>
                    <span className="font-semibold text-zinc-200">{m?.fir_date || 'N/A'}</span>
                  </div>
                </>
              )}
              <div>
                <span className="text-zinc-500 text-xs block mb-1">File Status</span>
                <span className="font-semibold text-amber-500">{m?.status}</span>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-6">
              <span className="text-zinc-500 text-xs block mb-2">Physical Description</span>
              <p className="text-zinc-300 text-xs bg-zinc-900/50 p-4 rounded-xl border border-zinc-850 leading-relaxed font-mono">
                {m?.physical_description}
              </p>
            </div>
          </div>

          {/* Informant and Officers */}
          <div className="glass-card p-6 rounded-2xl border border-zinc-800 space-y-6">
            <h2 className="text-md font-bold text-zinc-200 border-b border-zinc-800 pb-3">
              Informant and Investigating Officer
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Complainant / Informant</span>
                <span className="font-semibold text-zinc-200 block">{m?.informant_name}</span>
                <span className="text-zinc-400 text-xs">Contact: {m?.informant_contact}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block mb-1">Assigned IO Officer</span>
                <span className="font-semibold text-zinc-200 block">{m?.io_name}</span>
              </div>
            </div>

            {m?.remarks && (
              <div className="border-t border-zinc-800 pt-6">
                <span className="text-zinc-500 text-xs block mb-1">Remarks</span>
                <p className="text-zinc-300 text-xs leading-relaxed">{m?.remarks}</p>
              </div>
            )}
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

        {/* Audit Log */}
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

// ── SUB-COMPONENT: MISSING FORM (NEW/EDIT) ──────────────────────────────────────
const MissingForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [customFieldsDef, setCustomFieldsDef] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [recordDate, setRecordDate] = useState(new Date().toISOString().slice(0, 10));
  const [recordSubtype, setRecordSubtype] = useState('Missing Person');
  const [ddFirNo, setDdFirNo] = useState('');
  const [ddFirDate, setDdFirDate] = useState(new Date().toISOString().slice(0, 10));
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [physicalDescription, setPhysicalDescription] = useState('');
  const [lastSeenLocation, setLastSeenLocation] = useState('');
  const [foundLocation, setFoundLocation] = useState('');
  const [dateMissingRecovered, setDateMissingRecovered] = useState(new Date().toISOString().slice(0, 10));
  const [timeMissingRecovered, setTimeMissingRecovered] = useState('');
  const [informantName, setInformantName] = useState('');
  const [informantContact, setInformantContact] = useState('');
  const [ioName, setIoName] = useState('');
  const [status, setStatus] = useState('Active');
  const [remarks, setRemarks] = useState('');
  const [customFields, setCustomFields] = useState({});

  // New fields from master sheet & field guide
  const [ddFirTime, setDdFirTime] = useState('');
  const [dutyOfficer, setDutyOfficer] = useState('');
  const [trackChildNo, setTrackChildNo] = useState('');
  const [trackChildDate, setTrackChildDate] = useState('');
  const [majorMinor, setMajorMinor] = useState('Unknown');
  const [zipnetNo, setZipnetNo] = useState('');
  const [tracedDdNo, setTracedDdNo] = useState('');
  const [firNoYear, setFirNoYear] = useState('');
  const [firDate, setFirDate] = useState('');
  const [isIdentified, setIsIdentified] = useState('No');

  const loadReferenceData = async () => {
    try {
      const cfsRes = await axios.get('/api/v1/admin/custom-fields/ps?module=missing');
      setCustomFieldsDef(cfsRes.data.data.customFields);
    } catch (e) {
      toast.error('Failed to load custom fields.');
    }
  };

  const loadDraftDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/records/missing/${id}`);
      const m = response.data.data.missing;
      const cfs = response.data.data.customFields;

      if (response.data.data.submission_status === 'submitted') {
        toast.error('Record is submitted and locked.');
        navigate(ROUTES.MISSING);
        return;
      }

      setRecordDate(m.record_date);
      setRecordSubtype(m.record_subtype);
      setDdFirNo(m.dd_fir_no);
      setDdFirDate(m.dd_fir_date);
      setAge(m.age);
      setGender(m.gender);
      setPhysicalDescription(m.physical_description);
      setLastSeenLocation(m.last_seen_location || '');
      setFoundLocation(m.found_location || '');
      setDateMissingRecovered(m.date_missing_recovered);
      setTimeMissingRecovered(m.time_missing_recovered);
      setInformantName(m.informant_name);
      setInformantContact(m.informant_contact);
      setIoName(m.io_name);
      setStatus(m.status);
      setRemarks(m.remarks || '');

      setDdFirTime(m.dd_fir_time || '');
      setDutyOfficer(m.duty_officer || '');
      setTrackChildNo(m.track_child_no || '');
      setTrackChildDate(m.track_child_date || '');
      setMajorMinor(m.major_minor || 'Unknown');
      setZipnetNo(m.zipnet_no || '');
      setTracedDdNo(m.traced_dd_no || '');
      setFirNoYear(m.fir_no_year || '');
      setFirDate(m.fir_date || '');
      setIsIdentified(m.is_identified || 'No');

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
    if (!ddFirNo || !ddFirDate || !age || !gender || !physicalDescription || !dateMissingRecovered || !timeMissingRecovered || !informantName || !informantContact || !ioName) {
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
      recordSubtype,
      ddFirNo,
      ddFirDate,
      age: parseInt(age, 10),
      gender,
      physicalDescription,
      lastSeenLocation,
      foundLocation,
      dateMissingRecovered,
      timeMissingRecovered,
      informantName,
      informantContact,
      ioName,
      status,
      remarks,
      submissionStatus: submitType,
      customFields,
      ddFirTime,
      dutyOfficer,
      trackChildNo,
      trackChildDate,
      majorMinor,
      zipnetNo,
      tracedDdNo,
      firNoYear,
      firDate,
      isIdentified
    };

    try {
      if (isEdit) {
        await axios.put(`/api/v1/records/missing/${id}`, payload);
        toast.success(submitType === 'submitted' ? 'Record submitted & locked.' : 'Draft updated.');
      } else {
        await axios.post('/api/v1/records/missing', payload);
        toast.success(submitType === 'submitted' ? 'Record registered & locked.' : 'Draft saved.');
      }
      navigate(ROUTES.MISSING);
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
            {isEdit ? 'Update Missing/Recovered Entry' : 'Record New Missing/Recovered Case'}
          </h1>
        </div>
      </div>
      <div className="glass-card p-6 md:p-8 rounded-2xl border border-zinc-800 space-y-8 bg-zinc-900/10">
        {/* Row 1: Identification & Registration Details */}
        <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest border-b border-zinc-800 pb-2">
          1. Identification & Registration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase">Entry Sub-Type</label>
            <select
              value={recordSubtype}
              onChange={(e) => setRecordSubtype(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
            >
              <option value="Missing Person">Missing Person</option>
              <option value="Unidentified Recovered">Unidentified Recovered Body (UIDB)</option>
              <option value="Found Person">Found Person</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase">Daily Diary Record Date</label>
            <input
              type="date"
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
              disabled={isEdit}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Diary/Ref DD No</label>
              <input
                type="text"
                placeholder="No."
                value={ddFirNo}
                onChange={(e) => setDdFirNo(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Ref DD Date</label>
              <input
                type="date"
                value={ddFirDate}
                onChange={(e) => setDdFirDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase">Ref DD Time</label>
            <input
              type="time"
              value={ddFirTime}
              onChange={(e) => setDdFirTime(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase">Duty Officer</label>
            <input
              type="text"
              placeholder="Duty Officer Name"
              value={dutyOfficer}
              onChange={(e) => setDutyOfficer(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase">Assigned IO Officer Name</label>
            <input
              type="text"
              placeholder="Investigating Officer"
              value={ioName}
              onChange={(e) => setIoName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
            />
          </div>
        </div>

        {/* ── CONDITIONAL SUBTYPE DETAILS ── */}
        {recordSubtype === 'Missing Person' && (
          <div className="space-y-8 pt-4 border-t border-zinc-850">
            <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest border-b border-zinc-800 pb-2">
              2. Missing Person Details & Demographics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Age / Approx Age</label>
                <input
                  type="number"
                  placeholder="e.g. 24"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Transgender">Transgender</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Major / Minor</label>
                <select
                  value={majorMinor}
                  onChange={(e) => setMajorMinor(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                >
                  <option value="Unknown">Unknown</option>
                  <option value="Minor">Minor</option>
                  <option value="Major">Major</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Missing Place (Last Seen Location)</label>
                <input
                  type="text"
                  placeholder="Address or area"
                  value={lastSeenLocation}
                  onChange={(e) => setLastSeenLocation(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Date Missing</label>
                <input
                  type="date"
                  value={dateMissingRecovered}
                  onChange={(e) => setDateMissingRecovered(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Time Missing</label>
                <input
                  type="time"
                  value={timeMissingRecovered}
                  onChange={(e) => setTimeMissingRecovered(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                />
              </div>
            </div>

            <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest border-b border-zinc-800 pb-2 pt-4">
              3. Complainant & Informant Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Informed By (Informant Name)</label>
                <input
                  type="text"
                  placeholder="Informant Name"
                  value={informantName}
                  onChange={(e) => setInformantName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Informant Contact Details</label>
                <input
                  type="text"
                  placeholder="Telephone / Contact number"
                  value={informantContact}
                  onChange={(e) => setInformantContact(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                />
              </div>
            </div>

            <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest border-b border-zinc-800 pb-2 pt-4">
              4. Track The Missing Child Details (If Applicable)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Track Child Portal Reference No</label>
                <input
                  type="text"
                  placeholder="Track the child ref no"
                  value={trackChildNo}
                  onChange={(e) => setTrackChildNo(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Track Child Registration Date</label>
                <input
                  type="date"
                  value={trackChildDate}
                  onChange={(e) => setTrackChildDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                />
              </div>
            </div>

            <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest border-b border-zinc-800 pb-2 pt-4">
              5. Outcome & Legal Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Traced">Traced</option>
                  <option value="Closed">Closed</option>
                  <option value="Referred">Referred</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">ZIPNET Registration No.</label>
                <input
                  type="text"
                  placeholder="ZIPNET No."
                  value={zipnetNo}
                  onChange={(e) => setZipnetNo(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">If Traced DD Reference No.</label>
                <input
                  type="text"
                  placeholder="Traced DD No."
                  value={tracedDdNo}
                  onChange={(e) => setTracedDdNo(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Linked Case FIR No. & Year</label>
                <input
                  type="text"
                  placeholder="FIR No. / Year"
                  value={firNoYear}
                  onChange={(e) => setFirNoYear(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Linked Case FIR Date</label>
                <input
                  type="date"
                  value={firDate}
                  onChange={(e) => setFirDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {recordSubtype === 'Unidentified Recovered' && (
          <div className="space-y-8 pt-4 border-t border-zinc-850">
            <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest border-b border-zinc-800 pb-2">
              2. Unidentified Dead Body (UIDB) Demographics & Found Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Approximate Age</label>
                <input
                  type="number"
                  placeholder="Approx. Age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Transgender">Transgender</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Found Location</label>
                <input
                  type="text"
                  placeholder="Location address"
                  value={foundLocation}
                  onChange={(e) => setFoundLocation(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Date Found</label>
                <input
                  type="date"
                  value={dateMissingRecovered}
                  onChange={(e) => setDateMissingRecovered(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Time Found</label>
                <input
                  type="time"
                  value={timeMissingRecovered}
                  onChange={(e) => setTimeMissingRecovered(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                />
              </div>
            </div>

            <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest border-b border-zinc-800 pb-2 pt-4">
              3. Finder / Informant Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Informant Name</label>
                <input
                  type="text"
                  placeholder="Finder / Informant"
                  value={informantName}
                  onChange={(e) => setInformantName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Informant Contact Details</label>
                <input
                  type="text"
                  placeholder="Contact details"
                  value={informantContact}
                  onChange={(e) => setInformantContact(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                />
              </div>
            </div>

            <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest border-b border-zinc-800 pb-2 pt-4">
              4. Identification Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">File Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Traced">Traced</option>
                  <option value="Closed">Closed</option>
                  <option value="Referred">Referred</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">ZIPNET Registration No.</label>
                <input
                  type="text"
                  placeholder="ZIPNET No."
                  value={zipnetNo}
                  onChange={(e) => setZipnetNo(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Is Identified?</label>
                <select
                  value={isIdentified}
                  onChange={(e) => setIsIdentified(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {recordSubtype === 'Found Person' && (
          <div className="space-y-8 pt-4 border-t border-zinc-850">
            <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest border-b border-zinc-800 pb-2">
              2. Found Person Demographics & Recovery details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Age / Approximate Age</label>
                <input
                  type="number"
                  placeholder="e.g. 24"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Transgender">Transgender</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Found Location</label>
                <input
                  type="text"
                  placeholder="Location address"
                  value={foundLocation}
                  onChange={(e) => setFoundLocation(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Date Found</label>
                <input
                  type="date"
                  value={dateMissingRecovered}
                  onChange={(e) => setDateMissingRecovered(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Time Found</label>
                <input
                  type="time"
                  value={timeMissingRecovered}
                  onChange={(e) => setTimeMissingRecovered(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                />
              </div>
            </div>

            <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest border-b border-zinc-800 pb-2 pt-4">
              3. Informant / Finder Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Informant Name</label>
                <input
                  type="text"
                  placeholder="Informant Name"
                  value={informantName}
                  onChange={(e) => setInformantName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Informant Contact Details</label>
                <input
                  type="text"
                  placeholder="Contact details"
                  value={informantContact}
                  onChange={(e) => setInformantContact(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                />
              </div>
            </div>

            <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest border-b border-zinc-800 pb-2 pt-4">
              4. File Status & Outcomes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">File Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Traced">Traced</option>
                  <option value="Closed">Closed</option>
                  <option value="Referred">Referred</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">ZIPNET Registration No.</label>
                <input
                  type="text"
                  placeholder="ZIPNET No."
                  value={zipnetNo}
                  onChange={(e) => setZipnetNo(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">If Traced DD Reference No.</label>
                <input
                  type="text"
                  placeholder="Traced DD No."
                  value={tracedDdNo}
                  onChange={(e) => setTracedDdNo(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Linked Case FIR No. & Year</label>
                <input
                  type="text"
                  placeholder="FIR No. / Year"
                  value={firNoYear}
                  onChange={(e) => setFirNoYear(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Linked Case FIR Date</label>
                <input
                  type="date"
                  value={firDate}
                  onChange={(e) => setFirDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Physical Description Section */}
        <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest border-b border-zinc-800 pb-2 pt-4">
          Physical Description details
        </h3>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase">Description (distinguishing marks, clothes worn, build...)</label>
          <textarea
            value={physicalDescription}
            onChange={(e) => setPhysicalDescription(e.target.value)}
            rows="3"
            className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-lg text-xs text-zinc-300 focus:outline-none"
            placeholder="Describe height, build, complexion, clothing, marks, tattoos..."
          />
        </div>

        <div className="grid grid-cols-1 gap-6 pt-4 border-t border-zinc-850">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase">Remarks (Optional)</label>
            <input
              type="text"
              placeholder="Additional comments"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
            />
          </div>
        </div>

        {/* Dynamic Custom Fields EAV */}
        {customFieldsDef.length > 0 && (
          <div className="pt-4 border-t border-zinc-850 space-y-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">District Custom Fields</h3>
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
                      className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                    >
                      <option value="">Choose item...</option>
                      {def.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input
                      type={def.fieldType === 'number' ? 'number' : def.fieldType === 'date' ? 'date' : 'text'}
                      value={customFields[def.fieldKey] || ''}
                      onChange={(e) => handleCustomFieldChange(def.fieldKey, e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
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
            onClick={() => navigate(ROUTES.MISSING)}
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

export const MissingPage = () => {
  return (
    <Routes>
      <Route path="" element={<MissingList />} />
      <Route path="new" element={<MissingForm />} />
      <Route path=":id" element={<MissingDetails />} />
      <Route path=":id/edit" element={<MissingForm />} />
    </Routes>
  );
};
