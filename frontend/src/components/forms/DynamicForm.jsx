import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, AlertTriangle, AlertCircle, Search, Calendar, User, Check, Database } from 'lucide-react';
import toast from 'react-hot-toast';

import { useFormSchema } from '../../hooks/useFormSchema.js';
import { useAutosave } from '../../hooks/useAutosave.js';
import useAuthStore from '../../store/authStore.js';
import { findNodeById } from '../../utils/hierarchyData.js';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api.js';

import FormSection from './FormSection.jsx';
import FormToolbar from './FormToolbar.jsx';
import FormAutosave from './FormAutosave.jsx';

// Mock registry for Acts & Sections to be loaded dynamically from the backend in the future
const ACTS_SECTIONS_REGISTRY = [
  {
    act: "Indian Penal Code (IPC)",
    sections: ["379", "302", "323", "406", "506", "354", "411"]
  },
  {
    act: "Arms Act",
    sections: ["25", "27", "30"]
  },
  {
    act: "NDPS Act",
    sections: ["15", "18", "20", "21", "22"]
  },
  {
    act: "Motor Vehicles Act",
    sections: ["181", "184", "185"]
  },
  {
    act: "Information Technology Act (IT Act)",
    sections: ["66", "66C", "66D", "67"]
  }
];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function parseRules(rawRules) {
  if (!rawRules) return {};
  if (typeof rawRules === 'object') return rawRules;
  try { return JSON.parse(rawRules); } catch { return {}; }
}

/* ─── StepDot ─────────────────────────────────────────────────────────────── */
function StepDot({ index, active, completed, hasError, title, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-1 cursor-pointer outline-none"
      title={title}
    >
      <span className={`
        flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs font-bold transition-all duration-300
        ${active
          ? 'bg-[var(--accent-color)] border-[var(--accent-color)] text-white shadow-md shadow-[var(--accent-glow)] scale-110'
          : hasError
            ? 'bg-red-50 border-red-500 text-red-600'
            : completed
              ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
              : 'bg-white border-slate-300 text-slate-400 group-hover:border-slate-400 group-hover:text-slate-600'
        }
      `}>
        {completed && !active ? <CheckCircle2 size={14} /> : index + 1}
      </span>
      <span className={`text-[11px] font-semibold max-w-[90px] text-center leading-tight hidden sm:block transition-colors ${
        active ? 'text-[var(--accent-color)]' : hasError ? 'text-red-600' : 'text-slate-400'
      }`}>
        {title}
      </span>
    </button>
  );
}

const MOCK_FIR_LIST = [
  { fir_no: '104/2026', fir_date: '2026-06-20', complainant_name: 'Ramesh Singh', police_station: 'Parliament Street', crime_head: 'House Theft', sections: 'Sec 379 IPC' },
  { fir_no: '112/2026', fir_date: '2026-06-19', complainant_name: 'Sunita Devi', police_station: 'Chanakyapuri', crime_head: 'Murder', sections: 'Sec 302 IPC' },
  { fir_no: '125/2026', fir_date: '2026-06-18', complainant_name: 'Amit Kumar', police_station: 'Mandir Marg', crime_head: 'Simple Hurt', sections: 'Sec 323 IPC' },
  { fir_no: '150/2026', fir_date: '2026-06-21', complainant_name: 'Gurpreet Singh', police_station: 'Tughlak Road', crime_head: 'Cheating', sections: 'Sec 406 IPC' },
  { fir_no: '201/2026', fir_date: '2026-06-21', complainant_name: 'Vikram Singh', police_station: 'Parliament Street', crime_head: 'Robbery', sections: 'Sec 392 IPC' },
  { fir_no: '88/2026', fir_date: '2026-06-20', complainant_name: 'Manish Sharma', police_station: 'Chanakyapuri', crime_head: 'Delhi Excise Act', sections: 'Sec 33/38 Excise Act' },
  { fir_no: '92/2026', fir_date: '2026-06-20', complainant_name: 'Priyanka Sen', police_station: 'Mandir Marg', crime_head: 'Snatching', sections: 'Sec 356/379 IPC' },
];

/**
 * DynamicForm
 *
 * @param {string}   recordType     - 'CASE' | 'ARREST' | 'PCR_CALL' | 'MISSING' | 'UIDB'
 * @param {object}   initialValues  - Pre-populated data (from existing record.data)
 * @param {function} onSubmit       - Final submit callback(formValues, activeRecordId)
 * @param {boolean}  readOnly       - Lock all inputs for review
 * @param {string[]} targetFields   - Field keys flagged for correction (send-back)
 */
export default function DynamicForm({
  recordType,
  initialValues = {},
  onSubmit,
  readOnly = false,
  targetFields = [],
  caseType = null,
  onBack = null,
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const navigate = useNavigate();

  const { user } = useAuthStore();
  const { schema, isLoading, isError, schemaError } = useFormSchema(recordType);
  const activeRecordIdRef = useRef(initialValues?.id || null);

  // FIR Search State
  const [searchDate, setSearchDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Fetch existing cases to populate FIR dropdown dynamically
  const { data: casesData = [] } = useQuery({
    queryKey: ['records', 'cases-list'],
    queryFn: async () => {
      try {
        const res = await api.get('/records');
        const payload = res.data?.data;
        let cases = [];
        if (payload?.cases) cases = payload.cases;
        else if (payload?.queue) cases = payload.queue;
        else if (Array.isArray(payload)) cases = payload;
        else if (Array.isArray(res.data)) cases = res.data;
        return cases.filter(c => c.record_type === 'CASE');
      } catch (err) {
        console.error('Failed to load cases', err);
        return [];
      }
    },
    enabled: recordType === 'ARREST' && caseType === 'against_fir',
  });

  const handleFirSearch = () => {
    if (!searchDate) {
      setSearchError(lang === 'hi' ? 'एफआईआर दिनांक चुनना अनिवार्य है।' : 'FIR Date is required.');
      return;
    }
    setSearchError('');
    
    // Combine frontend mock cases & backend casesData
    const unifiedCases = [
      ...MOCK_FIR_LIST,
      ...(casesData || []).map(c => ({
        fir_no: c.data?.fir_no || c.fir_no || `FIR No. ${c.id}`,
        fir_date: c.data?.fir_date || c.fir_date || c.record_date,
        complainant_name: c.data?.complainant_name || c.complainant_name || 'N/A',
        police_station: c.data?.police_station || c.police_station || 'Unknown',
        crime_head: c.data?.local_head || c.data?.crime_head || c.local_head || c.crime_head || 'N/A',
        sections: c.data?.sections || c.sections || 'N/A',
        isBackend: true
      }))
    ];

    // Filter unified list
    const filtered = unifiedCases.filter(c => {
      // Date exact match
      const cDate = c.fir_date ? c.fir_date.substring(0, 10) : '';
      const sDate = searchDate.substring(0, 10);
      if (cDate !== sDate) return false;

      // Query (complainant name or FIR no) match
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const matchesComplainant = c.complainant_name ? c.complainant_name.toLowerCase().includes(q) : false;
        const matchesFirNo = c.fir_no ? c.fir_no.toLowerCase().includes(q) : false;
        if (!matchesComplainant && !matchesFirNo) return false;
      }
      return true;
    });

    setSearchResults(filtered);
    setHasSearched(true);
  };

  const renderFirSearchStep = () => {
    const title = lang === 'hi' ? 'प्राथमिकी (FIR) खोजें और लिंक करें' : 'Search & Link First Information Report (FIR)';
    const dateLabel = lang === 'hi' ? 'प्राथमिकी दिनांक (FIR Date) *' : 'FIR Date *';
    const queryLabel = lang === 'hi' ? 'शिकायतकर्ता का नाम / प्राथमिकी संख्या (वैकल्पिक)' : 'Complainant Name / FIR No. (Optional)';
    const queryPlaceholder = lang === 'hi' ? 'खोजने के लिए लिखें...' : 'Type to search...';
    const btnText = lang === 'hi' ? 'प्राथमिकी खोजें' : 'Search FIR';
    
    return (
      <div className="space-y-6">
        {/* Search Panel Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mandatory Date Field */}
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 tracking-wide">
                  <Calendar size={14} className="text-slate-400" />
                  <span>{dateLabel}</span>
                </label>
                <input
                  type="date"
                  disabled={readOnly}
                  value={searchDate}
                  onChange={(e) => {
                    setSearchDate(e.target.value);
                    if (searchError) setSearchError('');
                  }}
                  className={`w-full bg-white border-2 border-slate-200 text-slate-800 text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-[var(--accent-color)] transition-all ${
                    searchError ? 'border-red-400 focus:border-red-500 bg-red-50' : ''
                  }`}
                />
                {searchError && (
                  <span className="flex items-center gap-1 text-xs text-red-500 font-medium mt-1">
                    <AlertCircle size={12} className="flex-shrink-0" />
                    {searchError}
                  </span>
                )}
              </div>

              {/* Optional Name / FIR No Field */}
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 tracking-wide">
                  <Search size={14} className="text-slate-400" />
                  <span>{queryLabel}</span>
                </label>
                <input
                  type="text"
                  disabled={readOnly}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={queryPlaceholder}
                  className="w-full bg-white border-2 border-slate-200 text-slate-800 text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-[var(--accent-color)] transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Action button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleFirSearch}
                className="flex items-center gap-2 px-6 py-2.5 bg-[var(--accent-color)] hover:bg-[var(--accent-color)]/90 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-[var(--accent-glow)] active:scale-95 cursor-pointer"
              >
                <Search size={16} />
                <span>{btnText}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results Card */}
        {hasSearched && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all duration-300">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 tracking-wide flex items-center gap-2 font-display">
                <Database size={16} className="text-[var(--accent-color)]" />
                <span>
                  {lang === 'hi' ? 'खोज परिणाम' : 'Search Results'} ({searchResults.length})
                </span>
              </h3>
            </div>

            {searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-2">
                <AlertCircle size={28} className="text-slate-300" />
                <p className="text-sm font-bold">
                  {lang === 'hi' ? 'कोई परिणाम नहीं मिला' : 'No FIR records found'}
                </p>
                <p className="text-xs text-slate-400">
                  {lang === 'hi' ? 'कृपया अलग तिथि या शिकायतकर्ता नाम आज़माएं।' : 'Try using a different date or checking the complainant details.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-400 text-[11px] font-extrabold uppercase tracking-wider">
                      <th className="px-6 py-3.5">{lang === 'hi' ? 'प्राथमिकी संख्या' : 'FIR Number'}</th>
                      <th className="px-6 py-3.5">{lang === 'hi' ? 'दिनांक' : 'Date'}</th>
                      <th className="px-6 py-3.5">{lang === 'hi' ? 'शिकायतकर्ता' : 'Complainant'}</th>
                      <th className="px-6 py-3.5">{lang === 'hi' ? 'थाना' : 'Police Station'}</th>
                      <th className="px-6 py-3.5">{lang === 'hi' ? 'अपराध शीर्ष' : 'Crime Head'}</th>
                      <th className="px-6 py-3.5">{lang === 'hi' ? 'धाराएं' : 'Sections'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {searchResults.map((row) => {
                      const isSelected = values.selected_fir === row.fir_no;
                      return (
                        <tr
                          key={row.fir_no}
                          onClick={() => {
                            if (readOnly) return;
                            handleChange('selected_fir', row.fir_no);
                          }}
                          className={`group cursor-pointer hover:bg-slate-50/80 transition-all ${
                            isSelected
                              ? 'bg-[var(--accent-glow)] hover:bg-[var(--accent-glow)]'
                              : ''
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'border-[var(--accent-color)] bg-[var(--accent-color)] text-white scale-110'
                                  : 'border-slate-300 bg-white group-hover:border-slate-400'
                              }`}>
                                {isSelected && <Check size={10} className="stroke-[3]" />}
                              </span>
                              <span className={`text-sm font-bold ${
                                isSelected ? 'text-[var(--accent-color)] font-extrabold' : 'text-slate-800'
                              }`}>
                                {row.fir_no}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                            {row.fir_date}
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                            {row.complainant_name}
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                            {row.police_station}
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                            {row.crime_head}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                            {row.sections}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}


      </div>
    );
  };

  const renderActsAndSectionsStep = () => {
    const isWritten = values.type_of_information !== 'Oral';
    const acts = values.act_name ? values.act_name.split(',').map(s => s.trim()).filter(Boolean) : [];
    const secs = values.sections ? values.sections.split(',').map(s => s.trim()).filter(Boolean) : [];
    const maxLen = Math.max(acts.length, secs.length);

    const chosenActObj = actsSectionsRegistry.find(item => item.act === newAct);
    const availableSections = chosenActObj ? chosenActObj.sections : [];
    
    return (
      <div className="space-y-3">
        {/* Main Table for GD and Complaint details */}
        <div className="bg-[#f0f4f8] border border-[#7a9cc5] rounded overflow-hidden shadow-sm">
          <table className="w-full border-collapse">
            <tbody>
              {/* Row 1: GD/SD/DD Number / Date / Time */}
              <tr className="border-b border-[#7a9cc5]">
                <td className="w-1/3 bg-[#d0e0f8] text-[#0d2a4a] text-[11px] font-bold px-2.5 py-1 border-r border-[#7a9cc5] align-middle">
                  GD/SD/DD Number / Date / Time <span className="text-red-500">*</span>
                </td>
                <td className="w-2/3 bg-white px-2.5 py-1 flex items-center gap-2">
                  <input
                    type="text"
                    disabled={readOnly}
                    value={values.gd_no || ''}
                    onChange={(e) => handleChange('gd_no', e.target.value)}
                    className="w-20 h-6 px-1.5 border border-[#7a9cc5] rounded bg-white text-[11px] outline-none focus:border-blue-500"
                    placeholder="Number"
                  />
                  <input
                    type="text"
                    disabled={readOnly}
                    value={values.gd_date_time || '24/06/2026 15:52:50'}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleChange('gd_date_time', val);
                      const parts = val.split(' ');
                      if (parts[0]) handleChange('gd_date', parts[0]);
                      if (parts[1]) handleChange('gd_time', parts[1]);
                    }}
                    className="w-40 h-6 px-1.5 border border-[#7a9cc5] rounded bg-white text-[11px] outline-none focus:border-blue-500"
                  />
                  <button 
                    type="button" 
                    className="p-1 text-[#0f52ba] hover:text-blue-700 bg-transparent border-none cursor-pointer flex items-center justify-center"
                    title="Search GD Reference"
                  >
                    <Search size={14} className="stroke-[2.5]" />
                  </button>
                </td>
              </tr>

              {/* Row 2: Type of Information */}
              <tr className="border-b border-[#7a9cc5]">
                <td className="w-1/3 bg-[#d0e0f8] text-[#0d2a4a] text-[11px] font-bold px-2.5 py-1 border-r border-[#7a9cc5] align-middle">
                  Type of Information
                </td>
                <td className="w-2/3 bg-white px-2.5 py-1 flex items-center gap-4 text-[11px]">
                  <label className="flex items-center gap-1 cursor-pointer select-none">
                    <input
                      type="radio"
                      disabled={readOnly}
                      name="type_of_information"
                      checked={isWritten}
                      onChange={() => {
                        handleChange('type_of_information', 'Written');
                        handleChange('case_type', 'cctns(manual FIR)');
                      }}
                      className="accent-[#0f52ba] cursor-pointer"
                    />
                    <span>Written</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer select-none">
                    <input
                      type="radio"
                      disabled={readOnly}
                      name="type_of_information"
                      checked={!isWritten}
                      onChange={() => {
                        handleChange('type_of_information', 'Oral');
                        handleChange('case_type', 'Oral');
                      }}
                      className="accent-[#0f52ba] cursor-pointer"
                    />
                    <span>Oral</span>
                  </label>
                </td>
              </tr>

              {/* Row 3: Complaint No. */}
              <tr className="border-b border-[#7a9cc5]">
                <td className="w-1/3 bg-[#d0e0f8] text-[#0d2a4a] text-[11px] font-bold px-2.5 py-1 border-r border-[#7a9cc5] align-middle">
                  Complaint No.
                </td>
                <td className="w-2/3 bg-white px-2.5 py-1">
                  <input
                    type="text"
                    disabled={readOnly}
                    value={values.complaint_no || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleChange('complaint_no', val);
                      handleChange('fir_no', val);
                    }}
                    className="w-64 h-6 px-1.5 border border-[#7a9cc5] rounded bg-white text-[11px] outline-none focus:border-blue-500"
                  />
                </td>
              </tr>

              {/* Row 4: Source / Reference of Complaint */}
              <tr>
                <td className="w-1/3 bg-[#d0e0f8] text-[#0d2a4a] text-[11px] font-bold px-2.5 py-1 border-r border-[#7a9cc5] align-middle">
                  Source / Reference of Complaint <span className="text-red-500">*</span>
                </td>
                <td className="w-2/3 bg-white px-2.5 py-1">
                  <select
                    disabled={readOnly}
                    value={values.source_reference || ''}
                    onChange={(e) => handleChange('source_reference', e.target.value)}
                    className="w-64 h-6 px-1 border border-[#7a9cc5] rounded bg-white text-[11px] outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">-----Select-----</option>
                    <option value="PCR Call">PCR Call</option>
                    <option value="Written Complaint">Written Complaint</option>
                    <option value="Public Informant">Public Informant</option>
                    <option value="Police Beat Officer">Police Beat Officer</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Two Containers Below */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Left container: Acts & Sections (50% width) */}
          <fieldset className="flex-1 border border-[#7a9cc5] rounded px-3 py-2 bg-[#f0f4f8]/20 min-h-[140px]">
            <legend className="text-[#0d2a4a] text-[11px] font-bold px-1.5 uppercase tracking-wide">
              Acts & Sections
            </legend>

            <div className="flex items-center justify-between mb-2">
              <span className="text-[#0d2a4a] text-[10px] font-bold opacity-60">Registered List</span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => setShowAddRow(true)}
                  className="bg-[#ea580c] hover:bg-[#c2410c] text-white text-[10px] font-bold px-2 py-0.5 rounded transition shadow-sm flex items-center gap-1 cursor-pointer"
                >
                  + Add Acts & Section
                </button>
              )}
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="bg-[#d0e0f8] text-[#0d2a4a] border-b border-[#7a9cc5]">
                    <th className="px-2 py-1 text-left font-bold w-12 border-r border-[#7a9cc5]">S.No.</th>
                    <th className="px-2 py-1 text-left font-bold border-r border-[#7a9cc5]">Acts</th>
                    <th className="px-2 py-1 text-left font-bold border-r border-[#7a9cc5]">Sections</th>
                    {!readOnly && <th className="px-2 py-1 text-center font-bold w-16">Delete</th>}
                  </tr>
                </thead>
                <tbody>
                  {maxLen === 0 ? (
                    <tr>
                      <td colSpan={readOnly ? 3 : 4} className="px-2 py-3 text-center text-gray-500 italic">
                        No Acts & Sections added yet. Click "+ Add Acts & Section" to add.
                      </td>
                    </tr>
                  ) : (
                    Array.from({ length: maxLen }).map((_, i) => (
                      <tr key={i} className="border-b border-[#7a9cc5] bg-white">
                        <td className="px-2 py-1 border-r border-[#7a9cc5] text-[#0d2a4a] font-mono text-center">
                          {i + 1}
                        </td>
                        <td className="px-2 py-1 border-r border-[#7a9cc5] text-[#0d2a4a]">
                          {acts[i] || ''}
                        </td>
                        <td className="px-2 py-1 border-r border-[#7a9cc5] text-[#0d2a4a]">
                          {secs[i] || ''}
                        </td>
                        {!readOnly && (
                          <td className="px-2 py-1 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const newActs = acts.filter((_, idx) => idx !== i);
                                const newSecs = secs.filter((_, idx) => idx !== i);
                                handleChange('act_name', newActs.join(', '));
                                handleChange('sections', newSecs.join(', '));
                              }}
                              className="text-red-600 hover:text-red-800 text-[10px] font-bold underline cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </fieldset>

          {/* Right container: Major / Minor (50% width) */}
          <fieldset className="flex-1 border border-[#7a9cc5] rounded px-3 py-2 bg-[#f0f4f8]/20">
            <legend className="text-[#0d2a4a] text-[11px] font-bold px-1.5 uppercase tracking-wide">
              Major / Minor
            </legend>
            <div className="flex flex-col gap-1 text-[11px]">
              <label className="text-[#0d2a4a] font-bold">Classification</label>
              <select
                disabled={readOnly}
                value={values.major_minor || ''}
                onChange={(e) => handleChange('major_minor', e.target.value)}
                className="w-full h-6 px-1 border border-[#7a9cc5] rounded bg-white text-[11px] outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">------Select------</option>
                <option value="Major">Major</option>
                <option value="Minor">Minor</option>
              </select>
            </div>
          </fieldset>
        </div>

        {/* Dialogue Box / Modal for adding Act & Section */}
        {showAddRow && (
          <>
            {/* Click-away backdrop overlay (slightly dimmed bg, z-40) */}
            <div 
              className="fixed inset-0 z-40 bg-black/40" 
              onClick={() => {
                setNewAct('');
                setNewSection('');
                setShowAddRow(false);
              }}
            />
            {/* Centered Horizontal Modal dialogue box (z-50) */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] bg-white border border-[#7a9cc5] rounded shadow-2xl z-50 p-4 flex flex-col justify-between text-slate-800">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold text-[#0d2a4a] uppercase tracking-wider">
                    Add Acts & Section
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setNewAct('');
                      setNewSection('');
                      setShowAddRow(false);
                    }}
                    className="text-slate-400 hover:text-slate-600 text-sm font-bold bg-transparent border-none cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Vertical up-and-down selects layout */}
                <div className="space-y-3">
                  <div className="flex flex-col gap-1 text-[11px] text-left">
                    <label className="text-[#0d2a4a] font-bold">Act / Law Name</label>
                    <select
                      value={newAct}
                      onChange={(e) => {
                        setNewAct(e.target.value);
                        setNewSection('');
                      }}
                      className="w-full h-8 px-2 border border-[#7a9cc5] rounded bg-white text-[11px] outline-none focus:border-[#ea580c] cursor-pointer"
                      autoFocus
                    >
                      <option value="">----select----</option>
                      {actsSectionsRegistry.map((item) => (
                        <option key={item.act} value={item.act}>
                          {item.act}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 text-[11px] text-left">
                    <label className="text-[#0d2a4a] font-bold">Section(s)</label>
                    <select
                      value={newSection}
                      onChange={(e) => setNewSection(e.target.value)}
                      disabled={!newAct}
                      className="w-full h-8 px-2 border border-[#7a9cc5] rounded bg-white text-[11px] outline-none focus:border-[#ea580c] cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
                    >
                      <option value="">----select----</option>
                      {availableSections.map((sec) => (
                        <option key={sec} value={sec}>
                          {sec}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 mt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setNewAct('');
                    setNewSection('');
                    setShowAddRow(false);
                  }}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-[#0d2a4a] text-[11px] font-bold rounded cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (newAct.trim() || newSection.trim()) {
                      const updatedActs = [...acts, newAct.trim()].join(', ');
                      const updatedSections = [...secs, newSection.trim()].join(', ');
                      handleChange('act_name', updatedActs);
                      handleChange('sections', updatedSections);
                    }
                    setNewAct('');
                    setNewSection('');
                    setShowAddRow(false);
                  }}
                  className="px-3 py-1 bg-[#ea580c] hover:bg-[#c2410c] text-white text-[11px] font-bold rounded cursor-pointer transition-colors shadow-sm"
                >
                  Save
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const firOptions = React.useMemo(() => {
    return (casesData || []).map(c => {
      const firNo = c.data?.fir_no || c.fir_no || `FIR No. ${c.id}`;
      const ps = c.data?.police_station || 'Unknown';
      const date = c.data?.fir_date || 'N/A';
      return {
        value: firNo,
        label_en: `${firNo} (PS: ${ps}, Date: ${date})`,
        label_hi: `${firNo} (थाना: ${ps}, दिनांक: ${date})`
      };
    });
  }, [casesData]);

  const mockOptions = React.useMemo(() => [
    { value: 'FIR No. 104/2026', label_en: 'FIR No. 104/2026 (PS: Parliament Street, Sec 379 IPC)', label_hi: 'एफआईआर संख्या 104/2026 (थाना: पार्लियामेंट स्ट्रीट, धारा 379 आईपीसी)' },
    { value: 'FIR No. 112/2026', label_en: 'FIR No. 112/2026 (PS: Chanakyapuri, Sec 302 IPC)', label_hi: 'एफआईआर संख्या 112/2026 (थाना: चाणक्यपुरी, धारा 302 आईपीसी)' },
    { value: 'FIR No. 125/2026', label_en: 'FIR No. 125/2026 (PS: Mandir Marg, Sec 323 IPC)', label_hi: 'एफआईआर संख्या 125/2026 (थाना: मंदिर मार्ग, धारा 323 आईपीसी)' },
    { value: 'FIR No. 150/2026', label_en: 'FIR No. 150/2026 (PS: Tughlak Road, Sec 406 IPC)', label_hi: 'एफआईआर संख्या 150/2026 (थाना: तुगलक रोड, धारा 406 आईपीसी)' },
  ], []);

  const finalFirOptions = firOptions.length > 0 ? firOptions : mockOptions;

  const finalSchema = React.useMemo(() => {
    if (!schema || schema.length === 0) return [];

    if (recordType === 'CASE') {
      const allFields = schema.reduce((acc, sec) => [...acc, ...(sec.fields || [])], []);
      const tabSpecs = [
        { title_en: 'Acts & Sections', title_hi: 'अधिनियम और धाराएं', keys: ['uid', 'district', 'police_station', 'submission_status', 'case_type', 'fir_no', 'fir_date', 'gd_no', 'gd_date', 'gd_time', 'beat_no', 'act_name', 'sections'] },
        { title_en: 'Occurrence',      title_hi: 'घटना', keys: ['occurrence_date', 'time_of_occurrence', 'occurrence_place', 'local_head'] },
        { title_en: 'Complainant',     title_hi: 'शिकायतकर्ता', keys: ['complainant_name', 'complainant_address'] },
        { title_en: 'FIR Contents',    title_hi: 'प्राथमिकी विवरण', keys: ['brief_facts'] },
        { title_en: 'Victim Information', title_hi: 'पीड़ित का विवरण', keys: [] },
        { title_en: 'Accused',          title_hi: 'आरोपी', keys: [] },
        { title_en: 'Property of Interest', title_hi: 'संबद्ध संपत्ति', keys: ['property_description', 'property_status'] },
        { title_en: 'Hurt Case Detail', title_hi: 'चोट का विवरण', keys: [] },
        { title_en: 'Action Taken',    title_hi: 'की गई कार्रवाई', keys: ['io_name', 'io_pis', 'io_mobile', 'status', 'remarks', 'cctns_flag', 'zero_fir_flag'] },
      ];

      return tabSpecs.map(spec => {
        const fields = spec.keys
          .map(k => allFields.find(f => f.field_key === k))
          .filter(Boolean);
        return {
          title_en: spec.title_en,
          title_hi: spec.title_hi,
          fields: fields
        };
      });
    }

    if (recordType === 'ARREST' && caseType === 'against_fir') {
      const hasVirtualStep = schema[0]?.fields?.[0]?.field_key === 'selected_fir';
      if (!hasVirtualStep) {
        const virtualSelectFirStep = {
          title_en: 'Select FIR',
          title_hi: 'प्राथमिकी (FIR) चुनें',
          fields: [
            {
              field_key: 'selected_fir',
              field_type: 'SELECT',
              label_en: 'Select FIR Number',
              label_hi: 'प्राथमिकी (FIR) संख्या चुनें',
              validation_rules: JSON.stringify({ required: true }),
              options: finalFirOptions
            }
          ]
        };
        return [virtualSelectFirStep, ...schema];
      }
    }
    return schema;
  }, [schema, recordType, caseType, finalFirOptions]);

  const { triggerAutosave, saveImmediately, saveStatus, savedRecord } = useAutosave(
    recordType,
    initialValues?.id
  );

  const [values,       setValues      ] = useState({});
  const [errors,       setErrors      ] = useState({});
  const [touched,      setTouched     ] = useState({});
  const [currentStep,  setCurrentStep ] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [showAddRow,   setShowAddRow  ] = useState(false);
  const [newAct,       setNewAct      ] = useState('');
  const [newSection,   setNewSection  ] = useState('');
  const [actsSectionsRegistry, setActsSectionsRegistry] = useState(ACTS_SECTIONS_REGISTRY);

  useEffect(() => {
    let active = true;
    api.get('/acts-sections')
      .then(res => {
        if (active && res.data?.data && Array.isArray(res.data.data)) {
          setActsSectionsRegistry(res.data.data);
        }
      })
      .catch((err) => {
        console.log('Acts & Sections API not available yet, using dynamic local registry:', err.message);
      });
    return () => {
      active = false;
    };
  }, []);

  const formRef = useRef(null);

  const prevRecordTypeRef = useRef(recordType);
  const prevCaseTypeRef = useRef(caseType);
  const prevInitialIdRef = useRef(initialValues?.id);

  /* ── Sync saved record ID ─────────────────────────────────────────────── */
  useEffect(() => {
    if (savedRecord?.id) {
      activeRecordIdRef.current = savedRecord.id;
    }
  }, [savedRecord]);

  const initialValuesStr = JSON.stringify(initialValues || {});
  const userStr = user ? JSON.stringify({
    id: user.id,
    role: user.role,
    psId: user.psId,
    districtId: user.districtId,
    stationName: user.stationName,
    districtKey: user.districtKey
  }) : '';

  /* ── Reset wizard progress and errors when navigating to a different record/form ── */
  useEffect(() => {
    const typeChanged = prevRecordTypeRef.current !== recordType;
    const caseTypeChanged = prevCaseTypeRef.current !== caseType;
    const recordIdChanged = prevInitialIdRef.current !== initialValues?.id;

    // Avoid resetting state if we are just receiving the ID of the new draft we saved ourselves
    const isAutosaveInit = !prevInitialIdRef.current && initialValues?.id && (initialValues.id === activeRecordIdRef.current);

    if (typeChanged || caseTypeChanged || (recordIdChanged && !isAutosaveInit)) {
      setCurrentStep(0);
      setCompletedSteps(new Set());
      setErrors({});
      setTouched({});
    }

    prevRecordTypeRef.current = recordType;
    prevCaseTypeRef.current = caseType;
    prevInitialIdRef.current = initialValues?.id;
  }, [recordType, caseType, initialValues?.id]);

  /* ── Seed initial values & System Fields ──────────────────────────────── */
  useEffect(() => {
    const seed = initialValues?.data || initialValues || {};
    
    // Resolve station and district dynamically based on record metadata or active user node
    const recordPsId = initialValues?.ps_id || initialValues?.psId;
    const recordDistId = initialValues?.district_id || initialValues?.districtId;

    let resolvedStation = seed.police_station;
    let resolvedDistrict = seed.district;

    if (!resolvedStation) {
      if (recordPsId) {
        const node = findNodeById(recordPsId);
        if (node && node.type === 'PS') {
          resolvedStation = node.stationName || node.name;
        }
      } else if (user?.stationName) {
        resolvedStation = user.stationName;
      } else if (user?.psId) {
        const node = findNodeById(user.psId);
        if (node && node.type === 'PS') {
          resolvedStation = node.stationName || node.name;
        }
      } else {
        // Fallback only for Police Station level roles
        const isPsLevel = user?.role === 'PS' || user?.role === 'HC' || user?.role === 'SHO';
        resolvedStation = isPsLevel ? 'Parliament Street' : '';
      }
    }

    if (!resolvedDistrict) {
      if (recordDistId) {
        const node = findNodeById(recordDistId);
        if (node) {
          resolvedDistrict = node.districtKey || node.name;
        }
      } else if (user?.districtKey) {
        resolvedDistrict = user.districtKey;
      } else if (user?.districtId) {
        const node = findNodeById(user.districtId);
        if (node) {
          resolvedDistrict = node.districtKey || node.name;
        }
      } else {
        const isHqLevel = user?.role === 'HQ' || user?.role === 'HQ_ANALYST' || user?.role === 'HQ_ADMIN';
        resolvedDistrict = isHqLevel ? '' : 'New Delhi District (NDD)';
      }
    }

    // Auto-populate readonly system fields from session/metadata
    const updatedSeed = {
      ...seed,
      uid: initialValues?.id || seed.uid || 'NEW_DRAFT_PENDING',
      district: resolvedDistrict,
      police_station: resolvedStation,
      submission_status: initialValues?.current_status || seed.submission_status || 'DRAFT'
    };
    
    setValues(updatedSeed);
    if (initialValues?.id) {
      activeRecordIdRef.current = initialValues.id;
    } else {
      activeRecordIdRef.current = null;
    }
  }, [initialValuesStr, userStr, recordType, caseType]);

  /* ── Validate a single section (step) ─────────────────────────────────── */
  const validateSection = useCallback((stepIdx, currentValues = values) => {
    const section = finalSchema[stepIdx];
    if (!section) return {};

    const errs = {};
    section.fields.forEach((field) => {
      // Skip validating if field is hidden by condition
      if (field.show_when) {
        const { field: targetField, value: targetValue } = field.show_when;
        const currentValue = currentValues[targetField];
        const isMatch = Array.isArray(targetValue)
          ? targetValue.map(v => String(v || '').toLowerCase()).includes(String(currentValue || '').toLowerCase())
          : String(currentValue || '').toLowerCase() === String(targetValue || '').toLowerCase();
        if (!isMatch) {
          return;
        }
      }

      const rules = parseRules(field.validation_rules);
      if (!rules.required) return;

      const val = currentValues[field.field_key];
      const isEmpty = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);

      if (isEmpty) {
        const label = lang === 'hi' ? (field.label_hi || field.label_en) : field.label_en;
        errs[field.field_key] = lang === 'hi'
          ? `${label} आवश्यक है`
          : `${label} is required`;
      }
    });
    return errs;
  }, [finalSchema, values, lang]);

  /* ── Validate ALL sections ─────────────────────────────────────────────── */
  const validateAll = useCallback((currentValues = values) => {
    const allErrs = {};
    finalSchema.forEach((section) => {
      const errs = validateSection(finalSchema.indexOf(section), currentValues);
      Object.assign(allErrs, errs);
    });
    return allErrs;
  }, [finalSchema, values, validateSection]);

  /* ── Handle field change ──────────────────────────────────────────────── */
  const handleChange = useCallback((key, val) => {
    if (readOnly) return;

    setValues((prev) => {
      const next = { ...prev, [key]: val };
      if (next.time_of_occurrence !== undefined) {
        next.occurrence_time = next.time_of_occurrence;
      }

      // Clear error on change
      if (errors[key]) {
        setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
      }

      // Auto-save using custom hook (2 seconds debounce)
      triggerAutosave(next, activeRecordIdRef.current);

      return next;
    });

    setTouched((prev) => ({ ...prev, [key]: true }));
  }, [readOnly, errors, triggerAutosave]);

  /* ── Navigate forward (with step validation) ──────────────────────────── */
  const handleNext = () => {
    const stepErrs = validateSection(currentStep);
    if (Object.keys(stepErrs).length > 0) {
      setErrors((prev) => ({ ...prev, ...stepErrs }));
      // Mark all fields in this step as touched
      const section = finalSchema[currentStep];
      const newTouched = {};
      section?.fields?.forEach((f) => { newTouched[f.field_key] = true; });
      setTouched((prev) => ({ ...prev, ...newTouched }));
    }

    // Auto-populate linked_fir_dd_no when moving from Step 1 (Select FIR) to Step 2 (General Information)
    if (recordType === 'ARREST' && caseType === 'against_fir' && currentStep === 0) {
      const selectedFir = values.selected_fir;
      if (selectedFir) {
        setValues(prev => ({
          ...prev,
          linked_fir_dd_no: selectedFir
        }));
      }
    }

    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    setCurrentStep((s) => Math.min(s + 1, finalSchema.length - 1));
    // Scroll to top of form
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  /* ── Navigate backward ────────────────────────────────────────────────── */
  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 0));
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  /* ── Jump to a specific step (click step dot / tab) ───────────────────── */
  const handleStepClick = (targetIdx) => {
    if (targetIdx === currentStep) return;

    // Validate the section they are leaving so that invalid fields get warning indicators
    const stepErrs = validateSection(currentStep);
    if (Object.keys(stepErrs).length > 0) {
      setErrors((prev) => ({ ...prev, ...stepErrs }));
      const section = finalSchema[currentStep];
      const newTouched = {};
      section?.fields?.forEach((f) => { newTouched[f.field_key] = true; });
      setTouched((prev) => ({ ...prev, ...newTouched }));
    }

    // Auto-populate linked_fir_dd_no if we leave step 0 (Select FIR)
    if (recordType === 'ARREST' && caseType === 'against_fir' && currentStep === 0) {
      const selectedFir = values.selected_fir;
      if (selectedFir) {
        setValues(prev => ({
          ...prev,
          linked_fir_dd_no: selectedFir
        }));
      }
    }

    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    setCurrentStep(targetIdx);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  /* ── Final form submission ─────────────────────────────────────────────── */
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (readOnly) return;

    const allErrs = validateAll();
    if (Object.keys(allErrs).length > 0) {
      setErrors(allErrs);
      const allTouched = {};
      finalSchema.forEach((sec) => sec.fields.forEach((f) => { allTouched[f.field_key] = true; }));
      setTouched(allTouched);

      let firstErrStep = 0;
      finalSchema.forEach((sec, idx) => {
        const hasErr = sec.fields.some((f) => allErrs[f.field_key]);
        if (hasErr && idx < firstErrStep + 1) firstErrStep = idx;
      });
      setCurrentStep(firstErrStep);

      toast.error(lang === 'hi'
        ? 'कृपया सभी आवश्यक फ़ील्ड भरें।'
        : 'Please complete all required fields.');

      setTimeout(() => {
        const firstErrKey = Object.keys(allErrs)[0];
        document.getElementById(`field-${firstErrKey}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
      return;
    }

    const finalValues = { ...values };
    if (finalValues.time_of_occurrence !== undefined) {
      finalValues.occurrence_time = finalValues.time_of_occurrence;
    }
    onSubmit?.(finalValues, activeRecordIdRef.current);
  };

  /* ── Manual save draft (button click) ────────────────────────────────────*/
  const handleManualSave = () => {
    const finalValues = { ...values };
    if (finalValues.time_of_occurrence !== undefined) {
      finalValues.occurrence_time = finalValues.time_of_occurrence;
    }
    saveImmediately(finalValues, activeRecordIdRef.current);
    toast.success(lang === 'hi' ? 'ड्राफ्ट सहेज लिया गया है।' : 'Draft saved successfully.');
  };

  /* ── Render states ─────────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-500 gap-3">
        <Loader2 size={32} className="animate-spin text-[var(--accent-color)]" />
        <p className="text-sm font-semibold">{t('common.loading', 'Loading form schema...')}</p>
      </div>
    );
  }

  if (isError || finalSchema.length === 0) {
    const status = schemaError?.response?.status;
    const hint = status === 401
      ? 'Session expired — please log out and log back in with your badge credentials.'
      : status
        ? `Server returned ${status}. Check that the backend is running.`
        : 'No fields are configured for this record type. Re-run the database seed or switch to Mock Mode.';
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-500 gap-4 bg-white border border-dashed border-slate-300 rounded-xl shadow-sm">
        <AlertTriangle size={32} className="text-amber-500" />
        <p className="text-sm font-semibold text-slate-700">Form schema not found</p>
        <p className="text-xs text-slate-400 text-center max-w-xs leading-relaxed">{hint}</p>
        <p className="text-xs text-slate-500">
          Record type: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{recordType}</code>
        </p>
      </div>
    );
  }

  const activeSection = finalSchema[currentStep];
  const isLastStep    = currentStep === finalSchema.length - 1;

  const stepHasError = (idx) => {
    const sec = finalSchema[idx];
    return sec?.fields?.some((f) => errors[f.field_key] && touched[f.field_key]);
  };

  return (
    <div className="space-y-3" ref={formRef}>

      {/* Horizontal Tabs Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-[#0d2a4a] mb-2 gap-2 pb-0.5 bg-[#f8fafc]">
        {finalSchema.length > 1 ? (
          <div className="overflow-x-auto flex scrollbar-none py-1">
            <div className="flex flex-nowrap border border-[#0d2a4a] rounded-lg overflow-hidden shadow-sm">
              {finalSchema.map((sec, idx) => {
                const isSelected = idx === currentStep;
                const title = lang === 'hi' ? (sec.title_hi || sec.title_en) : sec.title_en;
                const hasError = stepHasError(idx);
                
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleStepClick(idx)}
                    className={`px-2 py-1 text-[10px] font-bold transition-all border-r border-[#0d2a4a]/20 last:border-r-0 cursor-pointer uppercase tracking-tight whitespace-nowrap flex items-center gap-1 select-none ${
                      isSelected
                        ? 'bg-[#ea580c] text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.2)]'
                        : 'bg-[#0d2a4a] text-white hover:bg-[#16406d]'
                    }`}
                  >
                    {hasError && <AlertCircle size={10} className="text-red-300 animate-pulse" />}
                    <span>{title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-3 px-2 py-1 self-end md:self-center">
          <FormAutosave status={saveStatus} lang={lang} />
          {readOnly && (
            <span className="text-[10px] font-bold text-slate-500 bg-slate-200 border border-slate-300 px-2 py-0.5 rounded uppercase tracking-wider">
              {lang === 'hi' ? 'केवल पठन' : 'Read Only'}
            </span>
          )}
        </div>
      </div>

      {/* ── Validation summary (top — shown after first submit attempt) ── */}
      {Object.keys(errors).length > 0 && Object.values(touched).some(Boolean) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 shadow-sm space-y-2">
          <div className="flex items-center gap-2 font-bold text-red-700 mb-1">
            <AlertCircle size={16} />
            <span>
              {lang === 'hi'
                ? `${Object.keys(errors).filter(k => touched[k]).length} फ़ील्ड अपूर्ण हैं`
                : `${Object.keys(errors).filter(k => touched[k]).length} field(s) need your attention`}
            </span>
          </div>
          {Object.entries(errors)
            .filter(([k]) => touched[k])
            .slice(0, 5)
            .map(([, msg]) => (
              <div key={msg} className="flex items-center gap-2 text-red-600">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                {msg}
              </div>
            ))}
        </div>
      )}

      {/* ── Active Section Form ─────────────────────────────────────────── */}
      {activeSection && (
        <div className="space-y-3">
          {/* Wrap ONLY the fields in a form so Enter key doesn't auto-submit
              when navigating between steps. The submit action is wired via
              an explicit onClick on the Submit button in FormToolbar. */}
          <form onSubmit={(e) => e.preventDefault()} noValidate>
            {recordType === 'ARREST' && caseType === 'against_fir' && currentStep === 0 ? (
              renderFirSearchStep()
            ) : recordType === 'CASE' && currentStep === 0 ? (
              renderActsAndSectionsStep()
            ) : (
              <FormSection
                section={activeSection}
                currentStep={currentStep}
                totalSteps={finalSchema.length}
                values={values}
                errors={errors}
                touched={touched}
                handleChange={handleChange}
                readOnly={readOnly}
                targetFields={targetFields}
                lang={lang}
                saveStatus={saveStatus}
                hideHeader={true}
              />
            )}
          </form>

          {/* ── Footer Action Bar (FormToolbar) ─────────────────────────── */}
          <FormToolbar
            currentStep={currentStep}
            totalSteps={finalSchema.length}
            readOnly={readOnly}
            onBack={onBack || (() => navigate('/records'))}
            onPrevious={handleBack}
            onSaveDraft={!readOnly ? handleManualSave : null}
            onNext={handleNext}
            onSubmit={handleFormSubmit}
            isLastStep={isLastStep}
            lang={lang}
          />
        </div>
      )}
    </div>
  );
}
