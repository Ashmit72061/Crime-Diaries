import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FileUp, CheckSquare, Square, AlertCircle, Save } from 'lucide-react';
import api from '../../utils/api.js';

/**
 * DynamicForm - Core schema-driven generator component
 *
 * @param {string} recordType - CASE | ARREST | PCR_CALL | MISSING
 * @param {object} initialValues - Initial field values
 * @param {function} onSaveDraft - Callback for debounced draft auto-save
 * @param {function} onSubmit - Callback for final form submission
 * @param {boolean} readOnly - Disable all inputs for review state
 * @param {array} targetFields - Highlighted keys requested for correction
 */
export default function DynamicForm({
  recordType,
  initialValues = {},
  onSaveDraft,
  onSubmit,
  readOnly = false,
  targetFields = []
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';

  // State to hold all form field values
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving'

  // Fetch form schema from API (Mock or Live)
  const { data: schema, isLoading } = useQuery({
    queryKey: ['fields', 'form', recordType],
    queryFn: async () => {
      const res = await api.get(`/fields/form/${recordType}`);
      return res.data.data;
    },
  });

  // Populate initial values when ready
  useEffect(() => {
    if (initialValues) {
      setValues(initialValues.data || initialValues || {});
    }
  }, [initialValues]);

  // Handle field change and trigger auto-save
  const handleChange = (key, val) => {
    if (readOnly) return;
    const newValues = { ...values, [key]: val };
    setValues(newValues);

    // Clear validation error when editing
    if (errors[key]) {
      setErrors({ ...errors, [key]: null });
    }

    // Trigger auto-save callback
    if (onSaveDraft) {
      setSaveStatus('saving');
      const delay = setTimeout(() => {
        onSaveDraft(newValues);
        setSaveStatus('saved');
      }, 1000);
      return () => clearTimeout(delay);
    }
  };

  // Perform validation before submission
  const validateForm = () => {
    const newErrors = {};
    if (!schema) return false;

    schema.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.validation_rules?.required) {
          const val = values[field.field_key];
          if (val === undefined || val === null || val === '' || val === false) {
            newErrors[field.field_key] = lang === 'hi' 
              ? `${lang === 'hi' ? field.label_hi : field.label_en} आवश्यक है`
              : `${field.label_en} is required`;
          }
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (readOnly) return;

    if (validateForm()) {
      onSubmit?.(values);
    } else {
      // Focus on first error or notify user
      const firstError = Object.keys(errors)[0];
      const el = document.getElementById(`field-${firstError}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-zinc-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#cca43b] mb-4"></div>
        <p>{t('common.loading', 'Loading secure form terminal...')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {/* Auto-save status bar */}
      {!readOnly && onSaveDraft && (
        <div className="flex justify-end text-xs text-zinc-500 gap-1.5 items-center">
          <Save size={12} className={saveStatus === 'saving' ? 'animate-pulse text-amber-500' : 'text-emerald-500'} />
          <span>
            {saveStatus === 'saving'
              ? t('actions.saving', 'Saving local draft...')
              : t('actions.saved', 'All changes auto-saved to local draft')}
          </span>
        </div>
      )}

      {/* Render sections dynamically */}
      {schema?.map((section) => (
        <div
          key={section.section}
          className="border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md rounded-xl p-5 shadow-lg space-y-4"
        >
          {/* Section title */}
          <div className="border-b border-zinc-800 pb-2">
            <h2 className="text-sm font-bold tracking-wide text-zinc-100 font-display uppercase border-l-2 border-[#cca43b] pl-2">
              {lang === 'hi' ? section.title_hi : section.title_en}
            </h2>
          </div>

          {/* Form grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.fields.map((field) => {
              const key = field.field_key;
              const label = lang === 'hi' ? field.label_hi : field.label_en;
              const type = field.field_type;
              const isRequired = field.validation_rules?.required;
              const isHighlighted = targetFields.includes(key);
              const error = errors[key];

              return (
                <div
                  key={key}
                  id={`field-${key}`}
                  className={`flex flex-col gap-1.5 p-2 rounded-lg transition-colors ${
                    isHighlighted ? 'bg-amber-950/20 border border-amber-800/40' : ''
                  }`}
                >
                  <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                    <span>
                      {label} {isRequired && <span className="text-[#cca43b]">*</span>}
                    </span>
                    {isHighlighted && (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-700">
                        {t('actions.correctionRequired', 'Correction Requested')}
                      </span>
                    )}
                  </label>

                  {/* Dynamic inputs based on type */}
                  {type === 'TEXT' && (
                    <input
                      type="text"
                      disabled={readOnly}
                      value={values[key] || ''}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className={`w-full bg-zinc-950 border text-sm text-zinc-200 px-3 py-2 rounded-lg outline-none focus:border-[#cca43b] focus:ring-1 focus:ring-[#cca43b] transition-all ${
                        error ? 'border-red-500' : isHighlighted ? 'border-amber-600' : 'border-zinc-800'
                      }`}
                    />
                  )}

                  {type === 'NUMBER' && (
                    <input
                      type="number"
                      disabled={readOnly}
                      value={values[key] || ''}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className={`w-full bg-zinc-950 border text-sm text-zinc-200 px-3 py-2 rounded-lg outline-none focus:border-[#cca43b] focus:ring-1 focus:ring-[#cca43b] transition-all ${
                        error ? 'border-red-500' : isHighlighted ? 'border-amber-600' : 'border-zinc-800'
                      }`}
                    />
                  )}

                  {type === 'DATE' && (
                    <input
                      type="date"
                      disabled={readOnly}
                      value={values[key] || ''}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className={`w-full bg-zinc-950 border text-sm text-zinc-200 px-3 py-2 rounded-lg outline-none focus:border-[#cca43b] focus:ring-1 focus:ring-[#cca43b] transition-all ${
                        error ? 'border-red-500' : isHighlighted ? 'border-amber-600' : 'border-zinc-800'
                      }`}
                    />
                  )}

                  {type === 'TEXTAREA' && (
                    <textarea
                      rows={3}
                      disabled={readOnly}
                      value={values[key] || ''}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className={`w-full bg-zinc-950 border text-sm text-zinc-200 px-3 py-2 rounded-lg outline-none focus:border-[#cca43b] focus:ring-1 focus:ring-[#cca43b] transition-all ${
                        error ? 'border-red-500' : isHighlighted ? 'border-amber-600' : 'border-zinc-800'
                      }`}
                    />
                  )}

                  {type === 'PHONE' && (
                    <input
                      type="tel"
                      disabled={readOnly}
                      value={values[key] || ''}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className={`w-full bg-zinc-950 border text-sm text-zinc-200 px-3 py-2 rounded-lg outline-none focus:border-[#cca43b] focus:ring-1 focus:ring-[#cca43b] transition-all ${
                        error ? 'border-red-500' : isHighlighted ? 'border-amber-600' : 'border-zinc-800'
                      }`}
                    />
                  )}

                  {type === 'SELECT' && (
                    <select
                      disabled={readOnly}
                      value={values[key] || ''}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className={`w-full bg-zinc-950 border text-sm text-zinc-200 px-3 py-2 rounded-lg outline-none focus:border-[#cca43b] focus:ring-1 focus:ring-[#cca43b] transition-all ${
                        error ? 'border-red-500' : isHighlighted ? 'border-amber-600' : 'border-zinc-800'
                      }`}
                    >
                      <option value="">-- Select Option --</option>
                      {field.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {lang === 'hi' ? o.label_hi : o.label_en}
                        </option>
                      ))}
                    </select>
                  )}

                  {type === 'BOOLEAN' && (
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleChange(key, !values[key])}
                      className="flex items-center gap-2 text-sm text-zinc-300 py-2 outline-none cursor-pointer disabled:cursor-not-allowed"
                    >
                      {values[key] ? (
                        <CheckSquare className="text-[#cca43b] w-5 h-5" />
                      ) : (
                        <Square className="text-zinc-600 w-5 h-5" />
                      )}
                      <span>{t('common.yes', 'Yes / True')}</span>
                    </button>
                  )}

                  {type === 'FILE' && (
                    <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-lg p-2">
                      <input
                        type="file"
                        id={`file-input-${key}`}
                        disabled={readOnly}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) handleChange(key, file.name);
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={() => document.getElementById(`file-input-${key}`).click()}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <FileUp size={14} />
                        <span>Upload File</span>
                      </button>
                      <span className="text-xs text-zinc-400 truncate">
                        {values[key] || 'No file selected'}
                      </span>
                    </div>
                  )}

                  {/* Validation feedback */}
                  {error && (
                    <span className="text-[10px] text-red-400 flex items-center gap-1">
                      <AlertCircle size={10} />
                      {error}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Form submit buttons */}
      {!readOnly && (
        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
          <button
            type="submit"
            className="bg-[#cca43b] hover:bg-amber-600 text-zinc-950 font-bold px-6 py-2.5 rounded-lg text-sm shadow-md transition-colors cursor-pointer"
          >
            {t('actions.submit', 'Submit Record')}
          </button>
        </div>
      )}
    </form>
  );
}
