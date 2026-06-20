import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileSpreadsheet, 
  Calendar, 
  Download, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  Search, 
  Plus, 
  Trash, 
  Save, 
  Play, 
  Loader2, 
  ArrowUpDown, 
  ShieldAlert, 
  Info, 
  Check, 
  X,
  FileDown,
  Layers,
  Sparkles,
  UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api.js';
import useAuthStore from '../../store/authStore.js';

export default function ReportBuilder() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // ───────────────────────────────────────────────────────────────────────────
  // Component State
  // ───────────────────────────────────────────────────────────────────────────
  const [selectedTable, setSelectedTable] = useState('CASE');
  const [selectedJoin, setSelectedJoin] = useState('');
  const [fieldSearch, setFieldSearch] = useState('');
  const [selectedFields, setSelectedFields] = useState([]); // Array of { field, table }
  const [filters, setFilters] = useState({ logic: 'AND', conditions: [] });
  const [sortField, setSortField] = useState({ field: '', table: '', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Template Save modal/input state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [templateShared, setTemplateShared] = useState(false);

  // Preview Data State
  const [runQueryTriggered, setRunQueryTriggered] = useState(false);
  const [previewRows, setPreviewRows] = useState([]);
  const [previewTotal, setPreviewTotal] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Export Progress State
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportJobId, setExportJobId] = useState(null);

  // ───────────────────────────────────────────────────────────────────────────
  // Queries & Fetching Metadata / Lookups / Saved templates
  // ───────────────────────────────────────────────────────────────────────────
  const { data: metadataRes, isLoading: loadingMetadata, error: metadataError } = useQuery({
    queryKey: ['report-builder', 'metadata'],
    queryFn: () => api.get('/reports/builder/metadata').then(res => res.data.data)
  });

  const { data: savedTemplatesRes, isLoading: loadingSaved } = useQuery({
    queryKey: ['report-builder', 'saved'],
    queryFn: () => api.get('/reports/builder/saved').then(res => res.data.data)
  });

  // Fetch Lookup lists (districts, police stations)
  const { data: districtsList } = useQuery({
    queryKey: ['report-builder', 'lookups', 'districts'],
    queryFn: () => api.get('/reports/builder/lookups/districts').then(res => res.data.data),
    staleTime: 600000
  });

  const { data: stationsList } = useQuery({
    queryKey: ['report-builder', 'lookups', 'police-stations'],
    queryFn: () => api.get('/reports/builder/lookups/police-stations').then(res => res.data.data),
    staleTime: 600000
  });

  // Extract variables from metadata API response
  const metadataTables = metadataRes?.tables || {};
  const metadataJoins = metadataRes?.joins || [];
  const activeTableFields = useMemo(() => {
    if (!metadataTables[selectedTable]) return [];
    const fields = metadataTables[selectedTable].fields || [];
    const system = metadataTables[selectedTable].system_fields || [];
    return [...system.map(f => ({ ...f, isSystem: true })), ...fields];
  }, [metadataTables, selectedTable]);

  const activeJoinFields = useMemo(() => {
    if (!selectedJoin || !metadataTables[selectedJoin]) return [];
    const fields = metadataTables[selectedJoin].fields || [];
    return fields;
  }, [metadataTables, selectedJoin]);

  // Combine all selectable fields for the current table + join choice
  const allSelectableFields = useMemo(() => {
    const list = [];
    activeTableFields.forEach(f => {
      list.push({ ...f, originTable: selectedTable });
    });
    activeJoinFields.forEach(f => {
      list.push({ ...f, originTable: selectedJoin });
    });
    return list;
  }, [activeTableFields, activeJoinFields, selectedTable, selectedJoin]);

  // Check if joins are available for selected primary table
  const allowedJoins = useMemo(() => {
    return metadataJoins.filter(j => j.tables.includes(selectedTable));
  }, [metadataJoins, selectedTable]);

  // Setup default fields when primary table changes
  useEffect(() => {
    if (allSelectableFields.length > 0) {
      // Pick top 4 fields by default as a starter preview
      const defaultFields = allSelectableFields
        .filter(f => !f.isSystem)
        .slice(0, 5)
        .map(f => ({ field: f.key, table: f.originTable }));
      
      // Include gd_no / record_date if present
      const systemRecordDate = allSelectableFields.find(f => f.key === '_record_date');
      if (systemRecordDate) {
        defaultFields.unshift({ field: '_record_date', table: selectedTable });
      }

      setSelectedFields(defaultFields);
      setFilters({ logic: 'AND', conditions: [] });
      setSelectedJoin('');
      setSortField({ field: '', table: '', dir: 'desc' });
      setRunQueryTriggered(false);
      setPreviewRows([]);
      setPreviewTotal(0);
    }
  }, [selectedTable, allSelectableFields.length]);

  // Handle selected join change: update default joined fields
  const handleJoinChange = (joinVal) => {
    setSelectedJoin(joinVal);
    setRunQueryTriggered(false);
    if (!joinVal) {
      // Remove all joined fields
      setSelectedFields(prev => prev.filter(f => f.table === selectedTable));
      // Remove joined filters
      setFilters(prev => ({
        ...prev,
        conditions: prev.conditions.filter(c => !c.table || c.table === selectedTable)
      }));
    } else {
      // Automatically add first 2 fields of joined table
      const joinTableFields = metadataTables[joinVal]?.fields || [];
      const newFields = joinTableFields.slice(0, 2).map(f => ({ field: f.key, table: joinVal }));
      setSelectedFields(prev => [...prev, ...newFields]);
    }
  };

  // Checkbox select/deselect column toggling
  const handleFieldToggle = (fieldKey, tableKey) => {
    const exists = selectedFields.some(f => f.field === fieldKey && f.table === tableKey);
    if (exists) {
      setSelectedFields(prev => prev.filter(f => !(f.field === fieldKey && f.table === tableKey)));
    } else {
      setSelectedFields(prev => [...prev, { field: fieldKey, table: tableKey }]);
    }
    setRunQueryTriggered(false);
  };

  // Helper: Select all filtered fields
  const selectAllFilteredFields = (filteredList) => {
    const toAdd = filteredList.map(f => ({ field: f.key, table: f.originTable }));
    setSelectedFields(prev => {
      const filteredPrev = prev.filter(p => !filteredList.some(f => f.key === p.field && f.originTable === p.table));
      return [...filteredPrev, ...toAdd];
    });
    setRunQueryTriggered(false);
  };

  // Helper: Clear selected fields in this list
  const clearFilteredFields = (filteredList) => {
    setSelectedFields(prev => prev.filter(p => !filteredList.some(f => f.key === p.field && f.originTable === p.table)));
    setRunQueryTriggered(false);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Filter Management
  // ───────────────────────────────────────────────────────────────────────────
  const addFilterCondition = () => {
    if (allSelectableFields.length === 0) return;
    const defaultField = allSelectableFields[0];
    const newCondition = {
      table: defaultField.originTable,
      field: defaultField.key,
      operator: defaultField.operators[0] || 'EQ',
      value: ''
    };
    setFilters(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }));
    setRunQueryTriggered(false);
  };

  const removeFilterCondition = (idx) => {
    setFilters(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== idx)
    }));
    setRunQueryTriggered(false);
  };

  const updateCondition = (idx, updates) => {
    setFilters(prev => {
      const nextConds = [...prev.conditions];
      nextConds[idx] = { ...nextConds[idx], ...updates };
      
      // If field changes, reset operator and value
      if (updates.field) {
        const targetField = allSelectableFields.find(f => f.key === updates.field && f.originTable === nextConds[idx].table);
        if (targetField) {
          nextConds[idx].operator = targetField.operators[0] || 'EQ';
          nextConds[idx].value = '';
        }
      }
      return { ...prev, conditions: nextConds };
    });
    setRunQueryTriggered(false);
  };

  // Check if an operator needs a value field (e.g. CONTAINS vs IS_EMPTY)
  const operatorNeedsValue = (op) => {
    if (!op) return false;
    return !['IS_EMPTY', 'IS_NOT_EMPTY', 'THIS_WEEK', 'THIS_MONTH', 'THIS_YEAR', 'IS_TRUE', 'IS_FALSE'].includes(op.toUpperCase());
  };

  const operatorIsBetween = (op) => {
    return op && op.toUpperCase() === 'BETWEEN';
  };

  // Resolve filter options dropdown contents
  const getFieldFilterOptions = (fieldKey, tableKey) => {
    const def = allSelectableFields.find(f => f.key === fieldKey && f.originTable === tableKey);
    if (!def) return [];

    // Special hierarchy lookups
    if (fieldKey === '_district_id') {
      return districtsList?.map(d => ({ value: d.id, label: d.name_en })) || [];
    }
    if (fieldKey === '_ps_id') {
      return stationsList?.map(p => ({ value: p.id, label: `${p.name_en} (${p.code})` })) || [];
    }

    // Default metadata inline options
    if (def.options && Array.isArray(def.options)) {
      return def.options.map(o => ({ value: o, label: o }));
    }
    return [];
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Preview Query Execution
  // ───────────────────────────────────────────────────────────────────────────
  const fetchPreviewData = async () => {
    if (selectedFields.length === 0) {
      toast.error('Select at least one field to query');
      return;
    }
    setPreviewLoading(true);
    setRunQueryTriggered(true);
    try {
      const payload = {
        table: selectedTable,
        fields: selectedFields,
        filters: filters.conditions.length > 0 ? filters : null,
        page,
        pageSize
      };
      if (selectedJoin) {
        payload.join = selectedJoin;
      }
      if (sortField.field) {
        payload.sort = {
          field: sortField.field,
          table: sortField.table || selectedTable,
          dir: sortField.dir
        };
      }

      const res = await api.post('/reports/builder/query', payload);
      if (res.data.success) {
        setPreviewRows(res.data.data || []);
        setPreviewTotal(res.data.meta?.total || 0);
      } else {
        toast.error(res.data.message || 'Failed to load preview');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error executing preview query');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Auto trigger query if state updates and already run once
  useEffect(() => {
    if (runQueryTriggered) {
      fetchPreviewData();
    }
  }, [page, pageSize, sortField.field, sortField.dir]);

  const handleSortToggle = (fieldKey, tableKey) => {
    if (sortField.field === fieldKey && sortField.table === tableKey) {
      setSortField(prev => ({
        ...prev,
        dir: prev.dir === 'asc' ? 'desc' : 'asc'
      }));
    } else {
      setSortField({
        field: fieldKey,
        table: tableKey,
        dir: 'desc'
      });
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Export Async Poller
  // ───────────────────────────────────────────────────────────────────────────
  const triggerExport = async (format) => {
    if (selectedFields.length === 0) {
      toast.error('Select at least one field to export');
      return;
    }

    setExporting(true);
    setExportProgress(10);
    setExportJobId(null);
    const toastId = toast.loading(`Initiating ${format.toUpperCase()} export compilation...`);

    try {
      const payload = {
        table: selectedTable,
        fields: selectedFields,
        filters: filters.conditions.length > 0 ? filters : null,
        format: format.toLowerCase()
      };
      if (selectedJoin) {
        payload.join = selectedJoin;
      }
      if (sortField.field) {
        payload.sort = {
          field: sortField.field,
          table: sortField.table || selectedTable,
          dir: sortField.dir
        };
      }

      const initRes = await api.post('/reports/builder/export', payload);
      const jobId = initRes.data.data?.job_id;
      if (!jobId) throw new Error('Job ID missing from server response');

      setExportJobId(jobId);
      setExportProgress(30);

      // Start polling status
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts += 1;
        setExportProgress(prev => Math.min(prev + 10, 95));

        if (attempts > 40) { // 60s timeout
          clearInterval(interval);
          setExporting(false);
          toast.error('Report compilation timed out. Check history later.', { id: toastId });
          return;
        }

        try {
          const checkRes = await api.get(`/reports/builder/export/${jobId}`, {
            responseType: 'blob'
          });
          const blob = checkRes.data;

          if (blob.type === 'application/json') {
            // It's a JSON status response
            const text = await blob.text();
            const json = JSON.parse(text);
            const status = json.data?.status || json.status;
            if (status === 'FAILED') {
              clearInterval(interval);
              setExporting(false);
              toast.error(json.message || 'Report generation failed on server', { id: toastId });
            }
          } else {
            // Success! We received the file blob!
            clearInterval(interval);
            setExportProgress(100);
            setExporting(false);

            // Stream download in browser
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `PHAROS_Report_${selectedTable.toLowerCase()}_${jobId.slice(0,8)}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success(`${format.toUpperCase()} downloaded successfully!`, { id: toastId });
            queryClient.invalidateQueries(['report-builder', 'saved']); // Refresh history
          }
        } catch (pollErr) {
          clearInterval(interval);
          setExporting(false);
          toast.error('Network error during report check', { id: toastId });
        }
      }, 1500);

    } catch (err) {
      setExporting(false);
      toast.error(err.response?.data?.message || 'Failed to trigger report compile', { id: toastId });
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Saved Templates Management
  // ───────────────────────────────────────────────────────────────────────────
  const saveTemplateMutation = useMutation({
    mutationFn: async (payload) => api.post('/reports/builder/saved', payload),
    onSuccess: () => {
      toast.success('Report template configuration saved!');
      setShowSaveModal(false);
      setTemplateName('');
      setTemplateDesc('');
      queryClient.invalidateQueries({ queryKey: ['report-builder', 'saved'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save template');
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id) => api.delete(`/reports/builder/saved/${id}`),
    onSuccess: () => {
      toast.success('Saved report template deleted');
      queryClient.invalidateQueries({ queryKey: ['report-builder', 'saved'] });
    },
    onError: (err) => {
      toast.error('Failed to delete template');
    }
  });

  const handleSaveTemplateSubmit = (e) => {
    e.preventDefault();
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    const querySpec = {
      table: selectedTable,
      fields: selectedFields,
      filters: filters.conditions.length > 0 ? filters : null
    };
    if (selectedJoin) querySpec.join = selectedJoin;
    if (sortField.field) {
      querySpec.sort = { field: sortField.field, table: sortField.table || selectedTable, dir: sortField.dir };
    }

    saveTemplateMutation.mutate({
      name: templateName,
      description: templateDesc,
      query_spec: querySpec,
      is_shared: templateShared
    });
  };

  const handleLoadTemplate = (tpl) => {
    const spec = tpl.query_spec || {};
    if (!spec.table) return;

    setSelectedTable(spec.table);
    setSelectedJoin(spec.join || '');
    setSelectedFields(spec.fields || []);
    setFilters(spec.filters || { logic: 'AND', conditions: [] });
    if (spec.sort) {
      setSortField({
        field: spec.sort.field || '',
        table: spec.sort.table || spec.table,
        dir: spec.sort.dir || 'desc'
      });
    }
    setRunQueryTriggered(false);
    toast.success(`Loaded template: "${tpl.name}"`);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Text Search Filter for Fields list
  // ───────────────────────────────────────────────────────────────────────────
  const filteredSelectableFields = useMemo(() => {
    if (!fieldSearch.trim()) return allSelectableFields;
    const s = fieldSearch.toLowerCase();
    return allSelectableFields.filter(
      f => f.key.toLowerCase().includes(s) || 
           f.label_en.toLowerCase().includes(s) || 
           (f.label_hi && f.label_hi.includes(s))
    );
  }, [allSelectableFields, fieldSearch]);

  const piiFieldsCount = useMemo(() => {
    return allSelectableFields.filter(f => f.is_pii).length;
  }, [allSelectableFields]);

  if (loadingMetadata) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="animate-spin text-[#cca43b]" size={40} />
        <p className="text-zinc-400 text-sm">Synchronizing schema dictionary from Reporting Data Warehouse...</p>
      </div>
    );
  }

  if (metadataError) {
    return (
      <div className="border border-red-800/40 bg-red-950/20 text-red-400 p-6 rounded-xl flex items-start gap-4">
        <ShieldAlert size={24} className="flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-sm">Failed to connect to Report Builder</h3>
          <p className="text-xs mt-1 text-red-500/80">{metadataError.message || 'Ensure your backend instance is running.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in-up">
      {/* Header and User Privilege Notice */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-zinc-100 flex items-center gap-2.5">
            <FileSpreadsheet className="text-[#cca43b]" size={26} />
            <span>Reporting Warehouse & Custom Report Builder</span>
          </h1>
          <p className="text-zinc-400 text-xs mt-1 max-w-2xl">
            Construct dynamic reports on Delhi Police master registers utilizing normalized data warehouse schemas. Custom export layouts dynamically strip out sensitive information based on role permissions.
          </p>
        </div>

        {/* User Role Card */}
        <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800/80 px-4 py-2.5 rounded-xl self-start md:self-auto text-xs shadow-inner">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
            <UserCheck size={16} />
          </div>
          <div>
            <div className="font-semibold text-zinc-300">Active Role: {user?.role || 'Guest'}</div>
            <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${piiFieldsCount > 0 ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              <span>{piiFieldsCount > 0 ? 'PII Unlocked (District/HQ scope)' : 'PII Gated (Operational Masking applied)'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ========================================== */}
        {/* LEFT COLUMN: PARAMETERS & FIELD CHECKBOXES */}
        {/* ========================================== */}
        <div className="space-y-6">
          {/* Card: Proforma Selection & Joins */}
          <div className="border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Layers size={14} className="text-[#cca43b]" />
                <span>1. Select Master Tables</span>
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              {/* Primary Table Selection */}
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-semibold">Primary Register:</label>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 outline-none focus:border-[#cca43b] transition-all cursor-pointer"
                >
                  <option value="CASE">FIR Master (CASE fact)</option>
                  <option value="ARREST">Arrest / Person Master (ARREST fact)</option>
                  <option value="PCR_CALL">PCR / Kalandra Calls (PCR fact)</option>
                  <option value="MISSING">Missing Persons Register (MISSING fact)</option>
                  <option value="UIDB">Unidentified Body Ledger (UIDB fact)</option>
                </select>
              </div>

              {/* Join Selection */}
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-semibold flex items-center justify-between">
                  <span>Cross-Reference Join:</span>
                  <span className="text-[10px] text-[#cca43b] font-normal italic">Relational bridge mapping</span>
                </label>
                <select
                  value={selectedJoin}
                  onChange={(e) => handleJoinChange(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 outline-none focus:border-[#cca43b] transition-all cursor-pointer"
                >
                  <option value="">No Join (Query Single Table)</option>
                  {allowedJoins.map(j => {
                    const joinTable = j.tables.find(t => t !== selectedTable);
                    return (
                      <option key={j.key} value={joinTable}>
                        Join: {j.label_en} ({joinTable})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* Card: Field/Column checkboxes selection */}
          <div className="border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-[#cca43b]" />
                <span>2. Select Column Fields ({selectedFields.length} active)</span>
              </h3>
            </div>

            {/* Field Search */}
            <div className="relative text-xs">
              <input
                type="text"
                placeholder="Search columns by label or name..."
                value={fieldSearch}
                onChange={(e) => setFieldSearch(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-zinc-200 outline-none focus:border-[#cca43b]"
              />
              <Search className="absolute left-2.5 top-2.5 text-zinc-500" size={14} />
              {fieldSearch && (
                <button 
                  onClick={() => setFieldSearch('')} 
                  className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 text-[10px]">
              <button
                onClick={() => selectAllFilteredFields(filteredSelectableFields)}
                className="bg-zinc-800 hover:bg-zinc-750 text-zinc-300 px-2 py-1 rounded transition-colors"
              >
                Select All ({filteredSelectableFields.length})
              </button>
              <button
                onClick={() => clearFilteredFields(filteredSelectableFields)}
                className="bg-zinc-800 hover:bg-zinc-750 text-zinc-300 px-2 py-1 rounded transition-colors"
              >
                Clear All
              </button>
            </div>

            {/* Checkbox list */}
            <div className="max-h-[300px] overflow-y-auto pr-1 text-xs space-y-1.5 border border-zinc-800/60 rounded-lg p-2 bg-zinc-950/40">
              {filteredSelectableFields.length === 0 ? (
                <div className="text-center text-zinc-500 py-4 italic">No matching fields found</div>
              ) : (
                filteredSelectableFields.map(f => {
                  const isChecked = selectedFields.some(p => p.field === f.key && p.table === f.originTable);
                  return (
                    <label 
                      key={`${f.originTable}__${f.key}`}
                      className={`flex items-start gap-2.5 p-1.5 rounded-md cursor-pointer transition-colors ${isChecked ? 'bg-[#cca43b]/5 border-l-2 border-[#cca43b] text-zinc-200' : 'hover:bg-zinc-850/50 text-zinc-400'}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleFieldToggle(f.key, f.originTable)}
                        className="mt-0.5 accent-[#cca43b]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[11px] truncate flex items-center justify-between">
                          <span>{f.label_en}</span>
                          {f.is_pii && (
                            <span className="bg-red-500/10 text-red-400 text-[8px] px-1 rounded-sm uppercase tracking-wider font-bold">PII</span>
                          )}
                          {f.isSystem && (
                            <span className="bg-blue-500/10 text-blue-400 text-[8px] px-1 rounded-sm uppercase tracking-wider">SYS</span>
                          )}
                        </div>
                        <div className="text-[9px] text-zinc-500 flex items-center justify-between mt-0.5">
                          <span>{f.label_hi}</span>
                          <span className="font-mono text-zinc-600">{f.originTable}.{f.key}</span>
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* RIGHT COLUMN: FILTERS, PREVIEW GRID, EXPORT */}
        {/* ========================================== */}
        <div className="xl:col-span-2 space-y-6">
          {/* Card: Filter Spec Builder */}
          <div className="border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Calendar size={14} className="text-[#cca43b]" />
                <span>3. Configure Search Filters ({filters.conditions.length} active)</span>
              </h3>
              
              <button
                onClick={addFilterCondition}
                className="bg-zinc-800 hover:bg-zinc-700 text-[#cca43b] px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus size={12} />
                <span>Add Rule</span>
              </button>
            </div>

            {filters.conditions.length === 0 ? (
              <div className="bg-zinc-950/20 border border-zinc-850 rounded-xl p-4 text-center text-xs text-zinc-500 flex flex-col items-center justify-center space-y-1.5">
                <Info size={16} className="text-zinc-600" />
                <span>No filter criteria set. Preview query will scan entire register (jurisdiction scoping still applies).</span>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Logic gate operator */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-zinc-400 font-semibold">Match conditions:</span>
                  <select
                    value={filters.logic}
                    onChange={(e) => setFilters(prev => ({ ...prev, logic: e.target.value }))}
                    className="bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-[#cca43b] outline-none"
                  >
                    <option value="AND">ALL (AND)</option>
                    <option value="OR">ANY (OR)</option>
                  </select>
                </div>

                {/* Filters grid list */}
                <div className="space-y-2">
                  {filters.conditions.map((cond, idx) => {
                    // Filter field metadata
                    const availableFilterFields = allSelectableFields;
                    const activeFieldDef = availableFilterFields.find(f => f.key === cond.field && f.originTable === cond.table);
                    const allowedOps = activeFieldDef?.operators || [];
                    const needsVal = operatorNeedsValue(cond.operator);
                    const isBetween = operatorIsBetween(cond.operator);
                    const lookupOpts = getFieldFilterOptions(cond.field, cond.table);

                    return (
                      <div key={idx} className="flex flex-wrap items-center gap-2 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-850 text-xs">
                        
                        {/* Table selector (only if joined) */}
                        {selectedJoin && (
                          <select
                            value={cond.table}
                            onChange={(e) => {
                              const t = e.target.value;
                              const fallbackField = allSelectableFields.find(f => f.originTable === t);
                              updateCondition(idx, { table: t, field: fallbackField?.key || '', value: '' });
                            }}
                            className="bg-zinc-900 border border-zinc-800 rounded p-1.5 text-zinc-300"
                          >
                            <option value={selectedTable}>{selectedTable}</option>
                            <option value={selectedJoin}>{selectedJoin}</option>
                          </select>
                        )}

                        {/* Field selector */}
                        <select
                          value={cond.field}
                          onChange={(e) => updateCondition(idx, { field: e.target.value })}
                          className="bg-zinc-900 border border-zinc-800 rounded p-1.5 text-zinc-200 font-medium max-w-[160px] md:max-w-none"
                        >
                          {availableFilterFields
                            .filter(f => f.originTable === cond.table)
                            .map(f => (
                              <option key={f.key} value={f.key}>
                                {f.label_en} ({f.key})
                              </option>
                            ))
                          }
                        </select>

                        {/* Operator selector */}
                        <select
                          value={cond.operator}
                          onChange={(e) => updateCondition(idx, { operator: e.target.value, value: '' })}
                          className="bg-zinc-900 border border-zinc-800 rounded p-1.5 text-amber-500 font-semibold"
                        >
                          {allowedOps.map(op => (
                            <option key={op} value={op}>{op}</option>
                          ))}
                        </select>

                        {/* Value inputs */}
                        <div className="flex-1 min-w-[140px] flex items-center gap-2">
                          {needsVal && (
                            <>
                              {isBetween ? (
                                // Between dual input
                                <div className="flex items-center gap-1.5 w-full">
                                  <input
                                    type={activeFieldDef?.data_type === 'number' ? 'number' : 'date'}
                                    placeholder="Start"
                                    value={Array.isArray(cond.value) ? (cond.value[0] || '') : ''}
                                    onChange={(e) => {
                                      const oldVal = Array.isArray(cond.value) ? cond.value : ['', ''];
                                      updateCondition(idx, { value: [e.target.value, oldVal[1]] });
                                    }}
                                    className="bg-zinc-900 border border-zinc-800 rounded p-1.5 text-zinc-300 w-full"
                                  />
                                  <span className="text-zinc-500">to</span>
                                  <input
                                    type={activeFieldDef?.data_type === 'number' ? 'number' : 'date'}
                                    placeholder="End"
                                    value={Array.isArray(cond.value) ? (cond.value[1] || '') : ''}
                                    onChange={(e) => {
                                      const oldVal = Array.isArray(cond.value) ? cond.value : ['', ''];
                                      updateCondition(idx, { value: [oldVal[0], e.target.value] });
                                    }}
                                    className="bg-zinc-900 border border-zinc-800 rounded p-1.5 text-zinc-300 w-full"
                                  />
                                </div>
                              ) : lookupOpts.length > 0 ? (
                                // Dropdown Select (for status / crime heads / hierarchy lookup)
                                <select
                                  value={cond.value || ''}
                                  onChange={(e) => updateCondition(idx, { value: e.target.value })}
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-zinc-300 cursor-pointer"
                                >
                                  <option value="">-- Choose Option --</option>
                                  {lookupOpts.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              ) : activeFieldDef?.data_type === 'date' ? (
                                // Date picker
                                <input
                                  type="date"
                                  value={cond.value || ''}
                                  onChange={(e) => updateCondition(idx, { value: e.target.value })}
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-zinc-300"
                                />
                              ) : activeFieldDef?.data_type === 'number' ? (
                                // Number field
                                <input
                                  type="number"
                                  placeholder="Input integer"
                                  value={cond.value || ''}
                                  onChange={(e) => updateCondition(idx, { value: e.target.value })}
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-zinc-300"
                                />
                              ) : (
                                // Standard text input
                                <input
                                  type="text"
                                  placeholder="Search query string..."
                                  value={cond.value || ''}
                                  onChange={(e) => updateCondition(idx, { value: e.target.value })}
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-zinc-300 outline-none focus:border-[#cca43b]"
                                />
                              )}
                            </>
                          )}
                        </div>

                        {/* Remove button */}
                        <button
                          onClick={() => removeFilterCondition(idx)}
                          className="text-zinc-500 hover:text-red-400 p-1.5 hover:bg-zinc-900 rounded transition-colors"
                        >
                          <Trash size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Run query trigger buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex gap-2">
                <button
                  onClick={fetchPreviewData}
                  disabled={previewLoading || selectedFields.length === 0}
                  className="bg-[#cca43b] hover:bg-amber-600 disabled:opacity-50 text-zinc-950 font-bold px-4 py-2.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {previewLoading ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />}
                  <span>Run Preview Query</span>
                </button>

                <button
                  onClick={() => setShowSaveModal(true)}
                  disabled={selectedFields.length === 0}
                  className="bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold px-4 py-2.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save size={14} />
                  <span>Save Config Template</span>
                </button>
              </div>

              {/* Exports Actions */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-zinc-500">Download Excel/CSV:</span>
                <div className="inline-flex rounded-lg overflow-hidden border border-zinc-800">
                  <button
                    onClick={() => triggerExport('xlsx')}
                    disabled={exporting || selectedFields.length === 0}
                    className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-40 px-3 py-2 text-xs flex items-center gap-1 transition-colors border-r border-zinc-800 cursor-pointer"
                  >
                    <Download size={13} className="text-emerald-500" />
                    <span>XLSX</span>
                  </button>
                  <button
                    onClick={() => triggerExport('csv')}
                    disabled={exporting || selectedFields.length === 0}
                    className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-40 px-3 py-2 text-xs flex items-center gap-1 transition-colors border-r border-zinc-800 cursor-pointer"
                  >
                    <Download size={13} className="text-blue-500" />
                    <span>CSV</span>
                  </button>
                  <button
                    onClick={() => triggerExport('pdf')}
                    disabled={exporting || selectedFields.length === 0}
                    className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-40 px-3 py-2 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Download size={13} className="text-red-500" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Export loader inline */}
            {exporting && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 space-y-2 animate-in fade-in duration-200">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400 flex items-center gap-1.5 font-medium">
                    <Loader2 className="animate-spin text-[#cca43b]" size={12} />
                    <span>Compiling full spreadsheet file asynchronously...</span>
                  </span>
                  <span className="font-mono text-[#cca43b] font-bold">{exportProgress}%</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#cca43b] h-full transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Card: Preview Grid Table */}
          <div className="border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Preview Grid Ledger
                </h3>
                {previewTotal > 0 && (
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    Found {previewTotal} records matches. Showing rows {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, previewTotal)}.
                  </p>
                )}
              </div>

              {previewTotal > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                  <span>Page size:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(parseInt(e.target.value, 10));
                      setPage(1);
                    }}
                    className="bg-zinc-950 border border-zinc-850 rounded px-1.5 py-0.5 text-zinc-300 outline-none"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                </div>
              )}
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto border border-zinc-850 rounded-xl bg-zinc-950/20">
              {previewLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-2">
                  <Loader2 className="animate-spin text-[#cca43b]" size={28} />
                  <span className="text-zinc-500 text-xs">Executing relational warehouse join queries...</span>
                </div>
              ) : !runQueryTriggered ? (
                <div className="text-center text-zinc-500 text-xs py-14 italic flex flex-col items-center justify-center space-y-2">
                  <Sparkles size={20} className="text-zinc-700" />
                  <span>Configure your columns and filters above, then click "Run Preview Query" to view data.</span>
                </div>
              ) : previewRows.length === 0 ? (
                <div className="text-center text-zinc-500 text-xs py-14 italic">
                  No records match your filters. Check status ledger/dates.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-950/80 text-zinc-400 uppercase font-semibold border-b border-zinc-850">
                      {/* Virtual system columns */}
                      <th className="p-3 pl-4">Record Context</th>
                      
                      {/* Dynamic columns headers */}
                      {selectedFields.map(f => {
                        const def = allSelectableFields.find(x => x.key === f.field && x.originTable === f.table);
                        const isSorted = sortField.field === f.field && sortField.table === f.table;
                        return (
                          <th 
                            key={`${f.table}__${f.field}`}
                            className="p-3 font-semibold text-zinc-400 whitespace-nowrap cursor-pointer hover:bg-zinc-900 transition-colors"
                            onClick={() => handleSortToggle(f.field, f.table)}
                          >
                            <div className="flex items-center gap-1">
                              <span>{def ? def.label_en : f.field}</span>
                              <ArrowUpDown size={10} className={isSorted ? 'text-[#cca43b]' : 'text-zinc-600'} />
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850 text-zinc-300">
                    {previewRows.map((row, idx) => {
                      // Resolve contextual columns
                      const recordId = row._id || row._left_id || row._right_id || `row-${idx}`;
                      const statusVal = row._status || row._left_status || row._right_status || 'UNKNOWN';
                      const recordDateVal = row._record_date || row._left_record_date || 'N/A';
                      const psName = row._ps_name || 'N/A';
                      const districtName = row._district_name || 'N/A';

                      return (
                        <tr key={idx} className="hover:bg-zinc-900/30 transition-colors">
                          {/* Context Cell */}
                          <td className="p-3 pl-4">
                            <div className="font-semibold text-zinc-200 text-[11px] truncate">
                              ID: {String(recordId).slice(0, 8)}...
                            </div>
                            <div className="text-[9px] text-zinc-500 mt-0.5">
                              {psName} | {recordDateVal}
                            </div>
                          </td>

                          {/* Dynamic value cells */}
                          {selectedFields.map(f => {
                            // The key alias used by the backend is `Table__FieldKey` if joined, or just `FieldKey` if single table query
                            const colKey = selectedJoin ? `${f.table}__${f.field}` : f.field;
                            const cellValue = row[colKey];
                            
                            // Formatting flags
                            let formatted = cellValue ?? '';
                            if (typeof cellValue === 'boolean') {
                              formatted = cellValue ? 'Yes' : 'No';
                            }

                            return (
                              <td key={`${f.table}__${f.field}`} className="p-3">
                                <span className="font-mono text-[11px] text-zinc-300">{String(formatted)}</span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Controls */}
            {previewTotal > 0 && (
              <div className="flex items-center justify-between text-xs pt-2">
                <span className="text-zinc-500">
                  Total matches: <strong className="text-zinc-400 font-semibold">{previewTotal}</strong>
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="bg-zinc-850 hover:bg-zinc-800 disabled:opacity-40 text-zinc-300 px-2.5 py-1.5 rounded transition-colors cursor-pointer"
                  >
                    Prev
                  </button>
                  <span className="px-2 text-zinc-400">
                    Page <strong>{page}</strong> of <strong>{Math.ceil(previewTotal / pageSize)}</strong>
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(p + 1, Math.ceil(previewTotal / pageSize)))}
                    disabled={page >= Math.ceil(previewTotal / pageSize)}
                    className="bg-zinc-850 hover:bg-zinc-800 disabled:opacity-40 text-zinc-300 px-2.5 py-1.5 rounded transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* SAVED TEMPLATES HISTORY / SELECTOR */}
      {/* ========================================== */}
      <div className="border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md rounded-xl p-5 shadow-lg space-y-4">
        <div className="border-b border-zinc-800 pb-2 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <FileText size={14} className="text-[#cca43b]" />
            <span>Saved Custom Templates Archive</span>
          </h3>
          <span className="text-[10px] text-zinc-500">Fast reloads of custom query filters</span>
        </div>

        {loadingSaved ? (
          <div className="text-center py-6 text-xs text-zinc-500">Loading templates list...</div>
        ) : !savedTemplatesRes || savedTemplatesRes.length === 0 ? (
          <div className="text-center py-8 text-xs text-zinc-500 italic">No saved report configurations yet. Select fields and click "Save Config Template" above.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {savedTemplatesRes.map(item => (
              <div 
                key={item.id}
                className="bg-zinc-950/40 border border-zinc-850 hover:border-zinc-800 p-3 rounded-lg flex justify-between items-start transition-all gap-4 text-xs"
              >
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleLoadTemplate(item)}>
                  <div className="font-semibold text-zinc-200 hover:text-[#cca43b] transition-colors truncate">{item.name}</div>
                  <div className="text-[10px] text-zinc-500 truncate mt-0.5">{item.description || 'No description'}</div>
                  <div className="flex gap-2 text-[8px] mt-2">
                    <span className="bg-zinc-800 text-zinc-400 px-1 py-0.5 rounded font-mono uppercase">{item.query_spec?.table}</span>
                    {item.query_spec?.join && (
                      <span className="bg-[#cca43b]/10 text-[#cca43b] px-1 py-0.5 rounded font-mono uppercase">JOIN: {item.query_spec.join}</span>
                    )}
                    {item.is_shared && (
                      <span className="bg-blue-500/15 text-blue-400 px-1 py-0.5 rounded">SHARED</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (confirm('Delete this template?')) {
                      deleteTemplateMutation.mutate(item.id);
                    }
                  }}
                  className="text-zinc-600 hover:text-red-400 p-1 hover:bg-zinc-900 rounded transition-colors"
                >
                  <Trash size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* DIALOG: SAVE TEMPLATE CONFIRMATION MODAL */}
      {/* ========================================== */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-zinc-850 pb-2">
              <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-1.5">
                <Save size={16} className="text-[#cca43b]" />
                <span>Save Report Proforma Config</span>
              </h3>
              <button 
                onClick={() => setShowSaveModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveTemplateSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-semibold">Template Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., ACP Daily Burglary Audit Sheet"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 outline-none focus:border-[#cca43b]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-semibold">Description:</label>
                <textarea
                  placeholder="Optional brief regarding output fields or scope rules..."
                  value={templateDesc}
                  onChange={(e) => setTemplateDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 outline-none focus:border-[#cca43b] resize-none"
                />
              </div>

              {/* Shared checkbox (HQ roles only) */}
              {['HQ_ANALYST', 'HQ_ADMIN', 'SYSTEM_ADMIN'].includes(user?.role) && (
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300 select-none">
                  <input
                    type="checkbox"
                    checked={templateShared}
                    onChange={(e) => setTemplateShared(e.target.checked)}
                    className="accent-[#cca43b]"
                  />
                  <span>Share template globally (allow other officers to query)</span>
                </label>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="bg-zinc-800 hover:bg-zinc-750 text-zinc-300 px-4 py-2 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveTemplateMutation.isPending}
                  className="bg-[#cca43b] hover:bg-amber-600 disabled:opacity-50 text-zinc-950 font-bold px-4 py-2 rounded-lg flex items-center gap-1"
                >
                  {saveTemplateMutation.isPending && <Loader2 className="animate-spin" size={12} />}
                  <span>Save Template</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
