import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, ToggleLeft, ToggleRight, Plus, X, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api.js';

const RECORD_TYPES = ['CASE', 'ARREST', 'PCR_CALL', 'MISSING', 'UIDB'];

const TYPE_COLORS = {
  CASE: 'text-blue-400 border-blue-800/40 bg-blue-950/30',
  ARREST: 'text-red-400 border-red-800/40 bg-red-950/30',
  PCR_CALL: 'text-amber-400 border-amber-800/40 bg-amber-950/30',
  MISSING: 'text-violet-400 border-violet-800/40 bg-violet-950/30',
  UIDB: 'text-zinc-400 border-zinc-600/40 bg-zinc-800/30',
};

export default function FieldManager() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('built-in'); // 'built-in' | 'custom'
  const [filterType, setFilterType] = useState('ALL');
  const [expandedSections, setExpandedSections] = useState({});
  const [customModal, setCustomModal] = useState(false);
  const [customForm, setCustomForm] = useState({
    module: 'CASE',
    field_key: '',
    field_label: '',
    field_type: 'TEXT',
    is_required: false,
  });

  // ── Fetch built-in field registry (aggregate across all record types) ──
  const { data: allFields = [], isLoading: fieldsLoading } = useQuery({
    queryKey: ['admin', 'fields', 'registry'],
    queryFn: async () => {
      const queries = RECORD_TYPES.map((type) =>
        api.get(`/fields/form/${type}`).then((r) => {
          const sections = r.data?.data || [];
          return sections.flatMap((sec) =>
            sec.fields.map((f) => ({ ...f, record_type: type, section_title: sec.title_en }))
          );
        }).catch(() => [])
      );
      const results = await Promise.all(queries);
      // Flatten and deduplicate by field_key, collecting applicable_record_types
      const map = new Map();
      results.flat().forEach((f) => {
        if (map.has(f.field_key)) {
          const existing = map.get(f.field_key);
          if (!existing.applicable_record_types.includes(f.record_type)) {
            existing.applicable_record_types.push(f.record_type);
          }
        } else {
          map.set(f.field_key, {
            ...f,
            applicable_record_types: [f.record_type],
            is_active: true,
          });
        }
      });
      return [...map.values()];
    },
    staleTime: 5 * 60 * 1000,
  });

  // ── Fetch custom fields ────────────────────────────────────────────────
  const { data: customFieldsRaw = [], isLoading: customLoading } = useQuery({
    queryKey: ['admin', 'custom-fields'],
    queryFn: async () => {
      const res = await api.get('/admin/custom-fields');
      return res.data?.data?.customFields || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // ── Create Custom Field ────────────────────────────────────────────────
  const createCustomFieldMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/admin/custom-fields', payload);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Custom field created and published to forms');
      setCustomModal(false);
      setCustomForm({ module: 'CASE', field_key: '', field_label: '', field_type: 'TEXT', is_required: false });
      queryClient.invalidateQueries({ queryKey: ['admin', 'custom-fields'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create custom field');
    },
  });

  const handleCreateCustomField = (e) => {
    e.preventDefault();
    if (!customForm.field_key || !customForm.field_label) {
      toast.error('Field Key and Label are required');
      return;
    }
    createCustomFieldMutation.mutate(customForm);
  };

  // ── Filter built-in fields ─────────────────────────────────────────────
  const filteredFields = filterType === 'ALL'
    ? allFields
    : allFields.filter((f) => f.applicable_record_types?.includes(filterType));

  // ── Group by section ───────────────────────────────────────────────────
  const groupedBySectionTitle = filteredFields.reduce((acc, f) => {
    const key = f.section_title || f.section || 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(f);
    return acc;
  }, {});

  const toggleSection = (key) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isSectionExpanded = (key) => expandedSections[key] !== false; // default expanded

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-zinc-100 flex items-center gap-2">
            <Settings className="text-[#cca43b]" />
            <span>Field Registry Manager</span>
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Inspect built-in form schemas and manage custom field extensions without code changes or migrations.
          </p>
        </div>

        {activeTab === 'custom' && (
          <button
            onClick={() => setCustomModal(true)}
            className="bg-[#cca43b] hover:bg-amber-600 text-zinc-950 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
          >
            <Plus size={14} />
            Add Custom Field
          </button>
        )}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-zinc-800 flex gap-1">
        {[{ key: 'built-in', label: 'Built-in Field Registry' }, { key: 'custom', label: 'Custom Fields' }].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-xs font-bold tracking-wide border-b-2 transition-all -mb-[2px] cursor-pointer ${
              activeTab === tab.key
                ? 'border-[#cca43b] text-[#cca43b]'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Built-in Fields Tab ───────────────────────────────────────────── */}
      {activeTab === 'built-in' && (
        <>
          {/* Record type filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-zinc-500 text-xs font-semibold">Filter:</span>
            {['ALL', ...RECORD_TYPES].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  filterType === type
                    ? 'bg-[#cca43b] text-zinc-950 shadow-md'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {fieldsLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#cca43b] mb-4" />
              <p className="text-sm">Syncing field registry from all form schemas...</p>
            </div>
          ) : Object.keys(groupedBySectionTitle).length === 0 ? (
            <div className="text-center text-zinc-500 py-12 border border-dashed border-zinc-800 rounded-xl">
              <Settings size={40} className="mx-auto mb-3 text-zinc-700" />
              <p className="text-sm">No fields found for selected filter</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(groupedBySectionTitle).map(([sectionTitle, fields]) => (
                <div key={sectionTitle} className="border border-zinc-800/80 bg-zinc-900/40 rounded-xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => toggleSection(sectionTitle)}
                    className="w-full flex items-center justify-between px-5 py-3 bg-zinc-950/60 hover:bg-zinc-900/60 transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-bold text-zinc-200 tracking-wide uppercase">{sectionTitle}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-zinc-500 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded font-mono">
                        {fields.length} fields
                      </span>
                      {isSectionExpanded(sectionTitle) ? (
                        <ChevronDown size={14} className="text-zinc-500" />
                      ) : (
                        <ChevronRight size={14} className="text-zinc-500" />
                      )}
                    </div>
                  </button>

                  {isSectionExpanded(sectionTitle) && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-zinc-500 uppercase font-semibold border-b border-zinc-800 tracking-wider">
                            <th className="p-3 pl-5">Field Key</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">English Label</th>
                            <th className="p-3">Hindi Label</th>
                            <th className="p-3">Applies To</th>
                            <th className="p-3">Required</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/40">
                          {fields.map((f) => (
                            <tr key={`${f.field_key}-${f.section}`} className="hover:bg-zinc-800/20 transition-colors">
                              <td className="p-3 pl-5 font-mono font-bold text-zinc-300 text-[11px]">{f.field_key}</td>
                              <td className="p-3">
                                <span className="bg-zinc-800 border border-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono">
                                  {f.field_type}
                                </span>
                              </td>
                              <td className="p-3 text-zinc-200">{f.label_en}</td>
                              <td className="p-3 text-zinc-400 font-sans">{f.label_hi || '—'}</td>
                              <td className="p-3">
                                <div className="flex flex-wrap gap-1">
                                  {(f.applicable_record_types || []).map((rt) => (
                                    <span key={rt} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${TYPE_COLORS[rt] || 'text-zinc-400 border-zinc-700'}`}>
                                      {rt}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="p-3">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                  f.validation_rules?.required
                                    ? 'text-red-400 bg-red-950/30 border-red-800/40'
                                    : 'text-zinc-500 bg-zinc-900 border-zinc-800'
                                }`}>
                                  {f.validation_rules?.required ? 'REQ' : 'OPT'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Custom Fields Tab ─────────────────────────────────────────────── */}
      {activeTab === 'custom' && (
        <>
          {customLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#cca43b] mb-4" />
              <p className="text-sm">Loading custom field definitions...</p>
            </div>
          ) : customFieldsRaw.length === 0 ? (
            <div className="border border-dashed border-zinc-800 rounded-xl p-16 text-center text-zinc-500">
              <Settings size={48} className="mx-auto text-zinc-700 mb-3" />
              <p className="text-sm font-semibold">No custom fields defined</p>
              <p className="text-xs text-zinc-600 mt-1">Click "Add Custom Field" above to extend any form without code changes.</p>
            </div>
          ) : (
            <div className="border border-zinc-800/80 bg-zinc-900/40 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-950/60 text-zinc-400 uppercase font-semibold border-b border-zinc-800 tracking-wider">
                      <th className="p-3.5 pl-5">Field Key</th>
                      <th className="p-3.5">Label</th>
                      <th className="p-3.5">Type</th>
                      <th className="p-3.5">Module</th>
                      <th className="p-3.5">Required</th>
                      <th className="p-3.5">Scope</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {customFieldsRaw.map((f) => (
                      <tr key={f.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="p-3.5 pl-5 font-mono font-bold text-zinc-200">{f.field_key}</td>
                        <td className="p-3.5">{f.field_label}</td>
                        <td className="p-3.5">
                          <span className="bg-zinc-800 border border-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">{f.field_type}</span>
                        </td>
                        <td className="p-3.5">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${TYPE_COLORS[f.module?.toUpperCase()] || 'text-zinc-400 border-zinc-700'}`}>
                            {f.module?.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${f.is_required ? 'text-red-400 border-red-800/40 bg-red-950/30' : 'text-zinc-500 border-zinc-700'}`}>
                            {f.is_required ? 'REQ' : 'OPT'}
                          </span>
                        </td>
                        <td className="p-3.5 text-zinc-400 text-[11px] font-mono">{f.scope_level || 'hq'}</td>
                        <td className="p-3.5">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${f.is_active ? 'text-emerald-400 border-emerald-800/40 bg-emerald-950/30' : 'text-zinc-500 border-zinc-700 bg-zinc-800'}`}>
                            {f.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── ADD CUSTOM FIELD MODAL ────────────────────────────────────────── */}
      {customModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center bg-zinc-950/80 border-b border-zinc-800 px-5 py-3.5">
              <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <Plus size={14} className="text-[#cca43b]" />
                Add Custom Field
              </h3>
              <button onClick={() => setCustomModal(false)} className="text-zinc-500 hover:text-zinc-200 transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomField} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-semibold">Module (Record Type) *</label>
                  <select
                    value={customForm.module}
                    onChange={(e) => setCustomForm({ ...customForm, module: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 outline-none focus:border-[#cca43b] transition-all cursor-pointer"
                  >
                    {RECORD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-semibold">Field Type *</label>
                  <select
                    value={customForm.field_type}
                    onChange={(e) => setCustomForm({ ...customForm, field_type: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 outline-none focus:border-[#cca43b] transition-all cursor-pointer"
                  >
                    {['TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'SELECT', 'BOOLEAN'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-semibold">Field Key (snake_case, unique) *</label>
                <input
                  type="text"
                  value={customForm.field_key}
                  onChange={(e) => setCustomForm({ ...customForm, field_key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="e.g. court_date"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 outline-none focus:border-[#cca43b] transition-all font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-semibold">Display Label *</label>
                <input
                  type="text"
                  value={customForm.field_label}
                  onChange={(e) => setCustomForm({ ...customForm, field_label: e.target.value })}
                  placeholder="e.g. Court Hearing Date"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 outline-none focus:border-[#cca43b] transition-all"
                  required
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={customForm.is_required}
                  onChange={(e) => setCustomForm({ ...customForm, is_required: e.target.checked })}
                  className="accent-[#cca43b]"
                />
                <span className="text-zinc-400 font-semibold">Mark as required field</span>
              </label>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setCustomModal(false)}
                  className="bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCustomFieldMutation.isPending}
                  className="bg-[#cca43b] hover:bg-amber-600 text-zinc-950 px-5 py-2 rounded-lg font-bold shadow-md cursor-pointer disabled:opacity-60"
                >
                  {createCustomFieldMutation.isPending ? 'Publishing…' : 'Publish Field'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
