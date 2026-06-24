import React from 'react';

import TextField     from './TextField.jsx';
import TextAreaField from './TextAreaField.jsx';
import NumberField   from './NumberField.jsx';
import DateField     from './DateField.jsx';
import TimeField     from './TimeField.jsx';
import SelectField   from './SelectField.jsx';
import CheckboxField from './CheckboxField.jsx';
import RadioField    from './RadioField.jsx';

const inputBase = "w-full bg-white border-2 border-slate-200 text-slate-800 text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-[var(--accent-color)] transition-colors placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed";

export default function FieldRenderer({ field, value, onChange, readOnly, hasError, lang }) {
  const key     = field.field_key;
  const type    = (field.field_type || 'TEXT').toUpperCase();
  const status  = hasError ? 'error' : '';
  const placeholder = lang === 'hi' ? field.placeholder_hi : field.placeholder_en;

  let options = field.options;
  if (typeof options === 'string') {
    try { options = JSON.parse(options); } catch { options = []; }
  }
  options = options || [];

  const handleChange = (val) => onChange(key, val);


  if (type === 'TEXT') {
    return <TextField id={`field-${key}`} disabled={readOnly} value={value} onChange={handleChange} status={status} placeholder={placeholder} />;
  }

  if (type === 'NUMBER') {
    return <NumberField id={`field-${key}`} disabled={readOnly} value={value} onChange={handleChange} status={status} placeholder={placeholder} />;
  }

  if (type === 'DATE') {
    return <DateField id={`field-${key}`} disabled={readOnly} value={value} onChange={handleChange} status={status} placeholder={placeholder} showTime={false} />;
  }

  if (type === 'DATETIME') {
    return <DateField id={`field-${key}`} disabled={readOnly} value={value} onChange={handleChange} status={status} placeholder={placeholder} showTime={true} />;
  }

  if (type === 'TIME') {
    return <TimeField id={`field-${key}`} disabled={readOnly} value={value} onChange={handleChange} status={status} placeholder={placeholder} />;
  }

  if (type === 'TEXTAREA') {
    return <TextAreaField id={`field-${key}`} disabled={readOnly} value={value} onChange={handleChange} status={status} placeholder={placeholder} />;
  }

  if (type === 'SELECT' || type === 'DROPDOWN') {
    return <SelectField id={`field-${key}`} disabled={readOnly} value={value} onChange={handleChange} status={status} placeholder={placeholder} options={options} lang={lang} />;
  }

  if (type === 'RADIO') {
    return <RadioField id={`field-${key}`} disabled={readOnly} value={value} onChange={handleChange} options={options} lang={lang} />;
  }

  if (type === 'BOOLEAN' || type === 'CHECKBOX') {
    const yesLabel = lang === 'hi' ? 'हाँ' : 'Yes';
    const noLabel = lang === 'hi' ? 'नहीं' : 'No';
    return (
      <div className="flex items-center gap-6 mt-1">
        <CheckboxField
          id={`field-${key}-yes`}
          disabled={readOnly}
          value={value === true || value === 'true' || value === 1}
          onChange={(checked) => {
            if (checked) {
              handleChange(true);
            } else {
              handleChange(null);
            }
          }}
          label={yesLabel}
        />
        <CheckboxField
          id={`field-${key}-no`}
          disabled={readOnly}
          value={value === false || value === 'false' || value === 0}
          onChange={(checked) => {
            if (checked) {
              handleChange(false);
            } else {
              handleChange(null);
            }
          }}
          label={noLabel}
        />
      </div>
    );
  }

  if (type === 'PHONE' || type === 'EMAIL') {
    return (
      <input
        id={`field-${key}`}
        type={type === 'PHONE' ? 'tel' : 'email'}
        disabled={readOnly}
        value={value ?? ''}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder || ''}
        className={`${inputBase} ${status === 'error' ? 'border-red-400 bg-red-50' : ''}`}
      />
    );
  }

  if (type === 'FILE') {
    return (
      <input
        id={`field-${key}`}
        type="file"
        disabled={readOnly}
        onChange={(e) => handleChange(e.target.files?.[0]?.name || '')}
        className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--accent-glow)] file:text-[var(--accent-color)] hover:file:bg-[var(--accent-color)]/20 file:cursor-pointer cursor-pointer disabled:opacity-50"
      />
    );
  }

  // Fallback — render as plain text input
  return <TextField id={`field-${key}`} disabled={readOnly} value={value} onChange={handleChange} status={status} placeholder={placeholder} />;
}
