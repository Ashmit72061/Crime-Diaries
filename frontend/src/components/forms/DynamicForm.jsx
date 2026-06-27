import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, AlertTriangle, AlertCircle, Search, Calendar, User, Check, Database, Plus, X, Bookmark } from 'lucide-react';
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
 * @param {string}   recordType        - 'CASE' | 'ARREST' | 'PCR_CALL' | 'MISSING' | 'UIDB'
 * @param {object}   initialValues     - Pre-populated data (from existing record.data or record object)
 * @param {Array}    initialPersons    - Pre-populated person entries [{person_type, data}]
 * @param {Array}    initialProperties - Pre-populated property entries [{major_category, ...}]
 * @param {function} onSubmit          - Final submit callback(formValues, persons, properties, activeRecordId)
 * @param {boolean}  readOnly          - Lock all inputs for review
 * @param {string[]} targetFields      - Field keys flagged for correction (send-back)
 */
export default function DynamicForm({
  recordType,
  initialValues = {},
  initialPersons = [],
  initialProperties = [],
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

    const selectedFir = values.selected_fir;
    const currentAct = values.act_name || 'IPC';
    const currentSections = values.sections || '';
    
    // Parse sections list
    const sectionsList = currentSections
      ? currentSections.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const handleAddSection = () => {
      const cleanSec = newSectionVal.trim();
      if (!cleanSec) return;
      if (sectionsList.includes(cleanSec)) {
        setNewSectionVal('');
        return;
      }
      const updatedList = [...sectionsList, cleanSec];
      handleChange('sections', updatedList.join(', '));
      setNewSectionVal('');
    };

    const handleRemoveSection = (secToRemove) => {
      const updatedList = sectionsList.filter(s => s !== secToRemove);
      handleChange('sections', updatedList.join(', '));
    };
    
    return (
      <div className="space-y-6">
        {/* Search Panel Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between bg-slate-50 border-b border-slate-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-md bg-[var(--accent-glow)] text-[var(--accent-color)] text-xs font-bold border border-[var(--accent-color)]/20">
                {currentStep + 1}
              </span>
              <h2 className="text-base font-bold text-slate-800 tracking-wide font-display">
                {title}
              </h2>
            </div>
            {readOnly && (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-200 border border-slate-300 px-2 py-0.5 rounded uppercase tracking-wider">
                {lang === 'hi' ? 'केवल पठन' : 'Read Only'}
              </span>
            )}
          </div>
          
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
                            
                            // Find the full details from row or casesData
                            let actName = 'IPC';
                            let sections = row.sections && row.sections !== 'N/A' ? row.sections : '';
                            let ioName = '';
                            let ioRank = '';
                            let ioPis = '';
                            let ioMobile = '';

                            if (row.isBackend) {
                              const matched = (casesData || []).find(c => {
                                const firNo = c.data?.fir_no || c.fir_no || `FIR No. ${c.id}`;
                                return firNo === row.fir_no;
                              });
                              if (matched) {
                                const cData = matched.data || {};
                                actName = cData.act_name || 'IPC';
                                sections = cData.sections || '';
                                ioName = cData.io_name || '';
                                ioRank = cData.io_rank || '';
                                ioPis = cData.io_pis || '';
                                ioMobile = cData.io_mobile || '';
                              }
                            } else {
                              // It's a mock case
                              actName = 'IPC';
                              sections = row.sections && row.sections !== 'N/A' ? row.sections : '';
                              ioName = 'Inspector Satish Kumar';
                              ioRank = 'Inspector';
                              ioPis = '28081234';
                              ioMobile = '9876543210';
                            }

                            // Directly update values
                            setValues(prev => ({
                              ...prev,
                              selected_fir: row.fir_no,
                              linked_fir_dd_no: row.fir_no,
                              act_name: actName,
                              sections: sections,
                              io_name: ioName,
                              io_rank: ioRank,
                              io_pis: ioPis,
                              io_mobile: ioMobile
                            }));
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

        {/* Linked FIR Offence Details Card */}
        {selectedFir && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
              <h3 className="text-sm font-bold text-slate-800 tracking-wide flex items-center gap-2 font-display">
                <Bookmark size={16} className="text-[var(--accent-color)]" />
                <span>
                  {lang === 'hi' ? 'संबद्ध प्राथमिकी अपराध विवरण (संपादित करें)' : 'Linked FIR Offence Details (Edit)'}
                </span>
              </h3>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Act Name Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 tracking-wide">
                    {lang === 'hi' ? 'अधिनियम का नाम *' : 'Act Name *'}
                  </label>
                  <select
                    disabled={readOnly}
                    value={currentAct}
                    onChange={(e) => handleChange('act_name', e.target.value)}
                    className="w-full bg-white border-2 border-slate-200 text-slate-800 text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-[var(--accent-color)] transition-all cursor-pointer"
                  >
                    <option value="IPC">IPC</option>
                    <option value="Delhi Excise Act">Delhi Excise Act</option>
                    <option value="Arms Act">Arms Act</option>
                    <option value="Gambling Act">Gambling Act</option>
                    <option value="DP Act">DP Act</option>
                    <option value="Other Act">Other Act</option>
                  </select>
                </div>

                {/* Act Name Sub-input if Other Act is selected */}
                {currentAct === 'Other Act' && (
                  <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
                    <label className="text-xs font-bold text-slate-700 tracking-wide">
                      {lang === 'hi' ? 'अधिनियम का नाम दर्ज करें' : 'Specify Act Name'}
                    </label>
                    <input
                      type="text"
                      disabled={readOnly}
                      value={values.other_act_name || ''}
                      onChange={(e) => handleChange('other_act_name', e.target.value)}
                      placeholder={lang === 'hi' ? 'अधिनियम का नाम लिखें...' : 'Enter custom act...'}
                      className="w-full bg-white border-2 border-slate-200 text-slate-800 text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-[var(--accent-color)] transition-all"
                    />
                  </div>
                )}
              </div>

              {/* Sections Editor */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-slate-700 tracking-wide">
                  {lang === 'hi' ? 'धारा संख्या(एँ) *' : 'Sections Code *'}
                </label>

                {/* Section Chips Container */}
                <div className="flex flex-wrap gap-2 min-h-[44px] p-2 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl items-center">
                  {sectionsList.length === 0 ? (
                    <span className="text-xs text-slate-400 font-medium px-2 py-1">
                      {lang === 'hi' ? 'कोई धारा जोड़ी नहीं गई है' : 'No sections added yet.'}
                    </span>
                  ) : (
                    sectionsList.map((sec, idx) => (
                      <span
                        key={`${sec}-${idx}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-sm animate-in zoom-in-75 duration-200"
                      >
                        <span>{sec}</span>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSection(sec)}
                            className="p-0.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-md transition-colors cursor-pointer"
                          >
                            <X size={12} className="stroke-[2.5]" />
                          </button>
                        )}
                      </span>
                    ))
                  )}
                </div>

                {/* Add Section Input Bar */}
                {!readOnly && (
                  <div className="flex items-center gap-2 max-w-sm mt-1">
                    <input
                      type="text"
                      disabled={readOnly}
                      value={newSectionVal}
                      onChange={(e) => setNewSectionVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSection();
                        }
                      }}
                      placeholder={lang === 'hi' ? 'उदा. 379 या 34' : 'e.g. 379 or 34'}
                      className="flex-1 bg-white border-2 border-slate-200 text-slate-800 text-sm px-3.5 py-2 rounded-xl outline-none focus:border-[var(--accent-color)] transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleAddSection}
                      className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>{lang === 'hi' ? 'जोड़ें' : 'Add'}</span>
                    </button>
                  </div>
                )}
                <span className="text-[10px] text-slate-400 font-medium leading-normal">
                  {lang === 'hi'
                    ? 'धारा दर्ज करें और Enter दबाएं या "जोड़ें" पर क्लिक करें।'
                    : 'Type a section code and press Enter or click "Add" to update.'}
                </span>
              </div>
            </div>
          </div>
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

  const { triggerAutosave, saveImmediately, saveStatus, savedRecord } = useAutosave(
    recordType,
    initialValues?.id
  );

  const [values,        setValues       ] = useState({});
  const [errors,        setErrors       ] = useState({});
  const [touched,       setTouched      ] = useState({});
  const [currentStep,   setCurrentStep  ] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [repeaterState, setRepeaterState] = useState({});
  const [newSectionVal, setNewSectionVal] = useState('');

  const formRef = useRef(null);

  const finalSchema = React.useMemo(() => {
    if (!schema || schema.length === 0) return [];
    
    let filteredSchema = schema;

    if (recordType === 'CASE') {
      filteredSchema = schema.filter(section => {
        if (section.section === 'investigation_officer') {
          const status = values.status;
          return status === 'CHARGE SHEET' || status === 'TRANSFER';
        }
        return true;
      });
    }

    if (recordType === 'ARREST' && caseType === 'against_fir') {
      const hasVirtualStep = filteredSchema[0]?.fields?.[0]?.field_key === 'selected_fir';
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
        return [virtualSelectFirStep, ...filteredSchema];
      }
    }
    return filteredSchema;
  }, [schema, recordType, caseType, finalFirOptions, values.status]);

  /* ── Sync saved record ID ─────────────────────────────────────────────── */
  useEffect(() => {
    if (savedRecord?.id) {
      activeRecordIdRef.current = savedRecord.id;
    }
  }, [savedRecord]);

  /* ── Adjust step bounds if schema changes ───────────────────────────────── */
  useEffect(() => {
    if (finalSchema.length > 0 && currentStep >= finalSchema.length) {
      setCurrentStep(finalSchema.length - 1);
    }
  }, [finalSchema.length, currentStep]);

  const initialValuesStr = JSON.stringify(initialValues || {});
  const userStr = user ? JSON.stringify({
    id: user.id,
    role: user.role,
    psId: user.psId,
    districtId: user.districtId,
    stationName: user.stationName,
    districtKey: user.districtKey
  }) : '';

  /* ── Seed repeater entries from initialPersons / initialProperties ─────── */
  useEffect(() => {
    if (!finalSchema.length) return;
    const initial = {};
    // Build section-key → entries map for person sections
    for (const section of finalSchema) {
      if (!section.is_repeater) continue;
      if (section.entity_type === 'person' && section.person_type) {
        const matching = initialPersons.filter(
          p => p.person_type === section.person_type
        );
        if (matching.length > 0) {
          initial[section.section] = matching.map(p => ({ ...(p.data || {}) }));
        }
      } else if (section.entity_type === 'property') {
        if (initialProperties.length > 0) {
          initial[section.section] = initialProperties.map(prop => ({
            property_major_category: prop.major_category || '',
            property_minor_category: prop.minor_category || '',
            property_stolen_recovered: prop.status || 'Stolen',
            property_details: prop.details || '',
          }));
        }
      }
    }
    if (Object.keys(initial).length > 0) {
      setRepeaterState(prev => ({ ...prev, ...initial }));
    }
  }, [initialPersons, initialProperties, finalSchema.length]);

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
    }
  }, [initialValuesStr, userStr]);

  /* ── Validate a single section (step) ─────────────────────────────────── */
  const validateSection = useCallback((stepIdx, currentValues = values) => {
    const section = finalSchema[stepIdx];
    if (!section) return {};
    if (section.is_repeater) return {}; // repeater sections have no flat-field validation

    const errs = {};
    section.fields.forEach((field) => {
      // Skip validating if field is hidden by condition
      if (field.show_when) {
        const { field: targetField, value: targetValue, operator } = field.show_when;
        const currentValue = currentValues[targetField];
        let isVisible = false;
        if (operator === 'filled') {
          isVisible = currentValue !== undefined && currentValue !== null && String(currentValue).trim() !== '';
        } else {
          isVisible = Array.isArray(targetValue)
            ? targetValue.map(v => String(v || '').toLowerCase()).includes(String(currentValue || '').toLowerCase())
            : String(currentValue || '').toLowerCase() === String(targetValue || '').toLowerCase();
        }
        if (!isVisible) {
          return;
        }
      }

      const rules = parseRules(field.validation_rules);

      if (field.field_key === 'gd_no') {
        const num = currentValues.gd_no;
        const dt = currentValues.gd_date;
        const tm = currentValues.gd_time;
        const isAnyFilled = !!(num || dt || tm);
        const isAllFilled = !!(num && dt && tm);

        if (rules.required && !isAllFilled) {
          errs.gd_no = lang === 'hi'
            ? 'जीडी नंबर, दिनांक और समय तीनों भरना आवश्यक है।'
            : 'GD Number, Date and Time are all required.';
        } else if (isAnyFilled && !isAllFilled) {
          errs.gd_no = lang === 'hi'
            ? 'जीडी नंबर, दिनांक और समय तीनों भरें।'
            : 'Please fill all three: GD Number, Date and Time.';
        }
        return;
      }

      if (field.field_key === 'fir_no') {
        const num = currentValues.fir_no;
        const dt = currentValues.fir_date;
        const isAnyFilled = !!(num || dt);
        const isAllFilled = !!(num && dt);

        if (rules.required && !isAllFilled) {
          errs.fir_no = lang === 'hi'
            ? 'प्राथमिकी संख्या और दिनांक दोनों भरना आवश्यक है।'
            : 'FIR Number and Date are both required.';
        } else if (isAnyFilled && !isAllFilled) {
          errs.fir_no = lang === 'hi'
            ? 'प्राथमिकी संख्या और दिनांक दोनों भरें।'
            : 'Please fill both: FIR Number and Date.';
        }
        return;
      }

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
    finalSchema.forEach((section, idx) => {
      const errs = validateSection(idx, currentValues);
      Object.assign(allErrs, errs);
    });
    return allErrs;
  }, [finalSchema, values, validateSection]);

  /* ── Handle field change ──────────────────────────────────────────────── */
  const handleChange = useCallback((key, val) => {
    if (readOnly) return;

    setValues((prev) => {
      const next = { ...prev, [key]: val };

      // DOB, Age (Years) and Year of Birth interlinking
      if (key.endsWith('_dob')) {
        const prefix = key.substring(0, key.lastIndexOf('_dob'));
        if (val) {
          const dobDate = new Date(val);
          if (!isNaN(dobDate.getTime())) {
            const birthYear = dobDate.getFullYear();
            const currentYear = new Date().getFullYear();
            next[`${prefix}_birth_year`] = birthYear;
            next[`${prefix}_age_year`] = Math.max(0, currentYear - birthYear);
          }
        } else {
          next[`${prefix}_birth_year`] = '';
          next[`${prefix}_age_year`] = '';
        }
      } else if (key.endsWith('_birth_year')) {
        const prefix = key.substring(0, key.lastIndexOf('_birth_year'));
        if (val) {
          const birthYear = parseInt(val, 10);
          if (!isNaN(birthYear)) {
            const currentYear = new Date().getFullYear();
            next[`${prefix}_age_year`] = Math.max(0, currentYear - birthYear);
          }
        } else {
          next[`${prefix}_age_year`] = '';
        }
      } else if (key.endsWith('_age_year')) {
        const prefix = key.substring(0, key.lastIndexOf('_age_year'));
        if (val) {
          const ageYear = parseInt(val, 10);
          if (!isNaN(ageYear)) {
            const currentYear = new Date().getFullYear();
            next[`${prefix}_birth_year`] = currentYear - ageYear;
          }
        } else {
          next[`${prefix}_birth_year`] = '';
        }
      }

      if (next.time_of_occurrence !== undefined) {
        next.occurrence_time = next.time_of_occurrence;
      }

      if (key === 'arrested_perm_same' && val === true) {
        next.arrested_perm_house_no = next.arrested_house_no || '';
        next.arrested_perm_street = next.arrested_street || '';
        next.arrested_perm_colony = next.arrested_colony || '';
        next.arrested_perm_city_town_village = next.arrested_city_town_village || '';
        next.arrested_perm_tehsil_block_mandal = next.arrested_tehsil_block_mandal || '';
        next.arrested_perm_country = next.arrested_country || 'Indian';
        next.arrested_perm_state = next.arrested_state || '';
        next.arrested_perm_district = next.arrested_district || '';
        next.arrested_perm_police_station = next.arrested_police_station || '';
        next.arrested_perm_pincode = next.arrested_pincode || '';
        next.arrested_perm_address = next.arrested_present_address || '';
      }

      if (next.arrested_perm_same === true) {
        if (key === 'arrested_house_no') next.arrested_perm_house_no = val;
        if (key === 'arrested_street') next.arrested_perm_street = val;
        if (key === 'arrested_colony') next.arrested_perm_colony = val;
        if (key === 'arrested_city_town_village') next.arrested_perm_city_town_village = val;
        if (key === 'arrested_tehsil_block_mandal') next.arrested_perm_tehsil_block_mandal = val;
        if (key === 'arrested_country') next.arrested_perm_country = val;
        if (key === 'arrested_state') next.arrested_perm_state = val;
        if (key === 'arrested_district') next.arrested_perm_district = val;
        if (key === 'arrested_police_station') next.arrested_perm_police_station = val;
        if (key === 'arrested_pincode') next.arrested_perm_pincode = val;
        if (key === 'arrested_present_address') next.arrested_perm_address = val;
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
      
      toast.error(lang === 'hi'
        ? 'कृपया सभी आवश्यक फ़ील्ड भरें।'
        : 'Please fill all required fields before continuing.');
      return;
    }

    // Auto-populate linked_fir_dd_no and case details when moving from Step 1 (Select FIR)
    if (recordType === 'ARREST' && caseType === 'against_fir' && currentStep === 0) {
      const selectedFir = values.selected_fir;
      if (selectedFir) {
        const matchedBackendCase = (casesData || []).find(c => {
          const firNo = c.data?.fir_no || c.fir_no || `FIR No. ${c.id}`;
          return firNo === selectedFir;
        });
        const matchedMockCase = MOCK_FIR_LIST.find(c => c.fir_no === selectedFir);
        let autofilled = {};
        if (matchedBackendCase) {
          const cData = matchedBackendCase.data || {};
          autofilled = {
            act_name: cData.act_name || '',
            sections: cData.sections || '',
            io_name: cData.io_name || '',
            io_rank: cData.io_rank || '',
            io_pis: cData.io_pis || '',
            io_mobile: cData.io_mobile || '',
          };
        } else if (matchedMockCase) {
          autofilled = {
            act_name: 'IPC',
            sections: matchedMockCase.sections || '',
            io_name: 'Inspector Satish Kumar',
            io_rank: 'Inspector',
            io_pis: '28081234',
            io_mobile: '9876543210',
          };
        }
        setValues(prev => ({
          ...prev,
          linked_fir_dd_no: selectedFir,
          act_name: prev.act_name || autofilled.act_name || '',
          sections: prev.sections !== undefined ? prev.sections : (autofilled.sections || ''),
          io_name: prev.io_name || autofilled.io_name || '',
          io_rank: prev.io_rank || autofilled.io_rank || '',
          io_pis: prev.io_pis || autofilled.io_pis || '',
          io_mobile: prev.io_mobile || autofilled.io_mobile || '',
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

  /* ── Jump to a specific step ──────────────────────────────────────────── */
  const handleStepClick = (targetIdx) => {
    if (targetIdx < currentStep) { setCurrentStep(targetIdx); return; }
    if (targetIdx === currentStep) return;
    let canJump = true;
    for (let i = currentStep; i < targetIdx; i++) {
      const errs = validateSection(i);
      if (Object.keys(errs).length > 0) { setErrors((prev) => ({ ...prev, ...errs })); canJump = false; break; }
      if (recordType === 'ARREST' && caseType === 'against_fir' && i === 0) {
        const selectedFir = values.selected_fir;
        if (selectedFir) {
          const matchedBackendCase = (casesData || []).find(c => {
            const firNo = c.data?.fir_no || c.fir_no || `FIR No. ${c.id}`;
            return firNo === selectedFir;
          });
          const matchedMockCase = MOCK_FIR_LIST.find(c => c.fir_no === selectedFir);
          let autofilled = {};
          if (matchedBackendCase) {
            const cData = matchedBackendCase.data || {};
            autofilled = {
              act_name: cData.act_name || '',
              sections: cData.sections || '',
              io_name: cData.io_name || '',
              io_rank: cData.io_rank || '',
              io_pis: cData.io_pis || '',
              io_mobile: cData.io_mobile || '',
            };
          } else if (matchedMockCase) {
            autofilled = {
              act_name: 'IPC',
              sections: matchedMockCase.sections || '',
              io_name: 'Inspector Satish Kumar',
              io_rank: 'Inspector',
              io_pis: '28081234',
              io_mobile: '9876543210',
            };
          }
          setValues(prev => ({
            ...prev,
            linked_fir_dd_no: selectedFir,
            act_name: prev.act_name || autofilled.act_name || '',
            sections: prev.sections !== undefined ? prev.sections : (autofilled.sections || ''),
            io_name: prev.io_name || autofilled.io_name || '',
            io_rank: prev.io_rank || autofilled.io_rank || '',
            io_pis: prev.io_pis || autofilled.io_pis || '',
            io_mobile: prev.io_mobile || autofilled.io_mobile || '',
          }));
        }
      }
      setCompletedSteps((prev) => new Set([...prev, i]));
    }
    if (canJump) setCurrentStep(targetIdx);
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
        if (sec.is_repeater) return;
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

    // Build persons and properties from repeater sections
    const persons = [];
    const properties = [];
    for (const section of finalSchema) {
      if (!section.is_repeater) continue;
      const entries = repeaterState[section.section] || [];
      if (section.entity_type === 'person' && section.person_type) {
        for (const entry of entries) {
          persons.push({ person_type: section.person_type, data: entry });
        }
      } else if (section.entity_type === 'property') {
        for (const entry of entries) {
          properties.push(entry);
        }
      }
    }

    onSubmit?.(finalValues, persons, properties, activeRecordIdRef.current);
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

  const activeSection = finalSchema[currentStep] || finalSchema[0];
  const isLastStep    = currentStep === finalSchema.length - 1;

  const stepHasError = (idx) => {
    const sec = finalSchema[idx];
    return sec?.fields?.some((f) => errors[f.field_key] && touched[f.field_key]);
  };

  return (
    <div className="space-y-6" ref={formRef}>

      {/* ── Step Navigator ── */}
      {finalSchema.length > 1 && (
        <div className="bg-white border border-slate-200 rounded-xl px-6 py-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent-color)] text-white text-xs font-bold shadow-md shadow-[var(--accent-glow)] scale-110 flex-shrink-0">
                {currentStep + 1}
              </span>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">
                  {lang === 'hi' ? 'सक्रिय चरण' : 'Active Step'}
                </span>
                <span className="text-sm font-extrabold text-slate-800 font-display">
                  {lang === 'hi'
                    ? (activeSection.title_hi || activeSection.title_en)
                    : activeSection.title_en}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end sm:pl-5 sm:border-l border-slate-100">
              <span className="text-xs font-extrabold text-[var(--accent-color)] bg-[var(--accent-glow)] border border-[var(--accent-color)]/10 px-3 py-1.5 rounded-lg whitespace-nowrap">
                {lang === 'hi' ? `चरण ${currentStep + 1} / ${finalSchema.length}` : `Step ${currentStep + 1} / ${finalSchema.length}`}
              </span>
              <FormAutosave status={saveStatus} lang={lang} />
            </div>
          </div>
        </div>
      )}

      {finalSchema.length === 1 && (
        <div className="flex justify-end">
          <FormAutosave status={saveStatus} lang={lang} />
        </div>
      )}

      {/* ── Validation summary ── */}
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

      {/* ── Active Section (flat field form OR repeater panel) ── */}
      {activeSection && (
        <div className="space-y-6">
          <form onSubmit={(e) => e.preventDefault()} noValidate>
            {recordType === 'ARREST' && caseType === 'against_fir' && currentStep === 0 ? (
              renderFirSearchStep()
            ) : (
              <FormSection
                section={activeSection}
                currentStep={currentStep}
                values={values}
                errors={errors}
                touched={touched}
                handleChange={handleChange}
                readOnly={readOnly}
                targetFields={targetFields}
                lang={lang}
                entries={repeaterState[activeSection?.section] || []}
                onEntriesChange={(entries) =>
                  setRepeaterState(prev => ({ ...prev, [activeSection.section]: entries }))
                }
              />
            )}
          </form>

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
