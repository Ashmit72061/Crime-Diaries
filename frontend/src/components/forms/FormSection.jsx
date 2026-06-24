import React from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import FieldRenderer from './FieldRenderer.jsx';

function parseRules(rawRules) {
  if (!rawRules) return {};
  if (typeof rawRules === 'object') return rawRules;
  try { return JSON.parse(rawRules); } catch { return {}; }
}

function isFullWidth(field) {
  const fw = ['TEXTAREA', 'FILE'];
  return fw.includes((field.field_type || '').toUpperCase()) || field.full_width === true;
}

export default function FormSection({
  section,
  currentStep,
  values,
  errors,
  touched,
  handleChange,
  readOnly,
  targetFields = [],
  lang = 'en',
}) {
  if (!section) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between bg-slate-50 border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-[var(--accent-glow)] text-[var(--accent-color)] text-xs font-bold border border-[var(--accent-color)]/20">
            {currentStep + 1}
          </span>
          <h2 className="text-base font-bold text-slate-800 tracking-wide">
            {lang === 'hi'
              ? (section.title_hi || section.title_en)
              : section.title_en}
          </h2>
        </div>
        {readOnly && (
          <span className="text-[10px] font-bold text-slate-500 bg-slate-200 border border-slate-300 px-2 py-0.5 rounded uppercase tracking-wider">
            {lang === 'hi' ? 'केवल पठन' : 'Read Only'}
          </span>
        )}
      </div>

      {/* Fields grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          {section.fields.map((field) => {
            const key          = field.field_key;

            // Conditional field rendering (schema-driven)
            if (field.show_when) {
              const { field: targetField, value: targetValue } = field.show_when;
              const currentValue = String(values[targetField] || '').toLowerCase();
              const allowed = Array.isArray(targetValue)
                ? targetValue.map(v => String(v).toLowerCase())
                : [String(targetValue || '').toLowerCase()];
              if (!allowed.includes(currentValue)) return null;
            }

            const label        = lang === 'hi' ? (field.label_hi || field.label_en) : field.label_en;
            const rules        = parseRules(field.validation_rules);
            const isRequired   = !!rules.required;
            const isHighlighted = targetFields.includes(key);
            const error        = touched[key] ? errors[key] : null;
            const fw           = isFullWidth(field);

            return (
              <div
                key={key}
                className={`flex flex-col gap-1.5 ${fw ? 'md:col-span-2' : ''}
                  ${isHighlighted
                    ? 'p-3 rounded-lg bg-amber-50 border border-amber-200 -mx-3'
                    : ''
                  }`}
              >
                {/* Label row */}
                <label
                  htmlFor={`field-${key}`}
                  className="flex items-center justify-between gap-2 form-label-custom"
                >
                  <span className="flex items-center gap-1">
                    {label}
                    {isRequired && (
                      <span className="text-red-500 font-bold" aria-hidden="true">*</span>
                    )}
                  </span>
                  {isHighlighted && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded shadow-sm">
                      <AlertTriangle size={10} />
                      {lang === 'hi' ? 'सुधार आवश्यक' : 'Correction Requested'}
                    </span>
                  )}
                </label>

                {/* Field input */}
                <FieldRenderer
                  field={field}
                  value={values[key]}
                  onChange={handleChange}
                  readOnly={readOnly || field.readonly === true || field.readonly === 'true'}
                  hasError={!!error}
                  lang={lang}
                />

                {/* Validation error */}
                {error && (
                  <span className="flex items-center gap-1 text-xs text-red-500 font-medium mt-1">
                    <AlertCircle size={12} className="flex-shrink-0" />
                    {error}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
