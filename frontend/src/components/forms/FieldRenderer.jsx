import React from 'react';

import TextField     from './TextField.jsx';
import TextAreaField from './TextAreaField.jsx';
import NumberField   from './NumberField.jsx';
import DateField     from './DateField.jsx';
import TimeField     from './TimeField.jsx';
import SelectField   from './SelectField.jsx';
import CheckboxField from './CheckboxField.jsx';
import RadioField    from './RadioField.jsx';
import { DISTRICTS_AND_STATIONS } from '../../utils/policeData.js';

const inputBase = "w-full bg-white border-2 border-slate-200 text-slate-800 text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-[var(--accent-color)] transition-colors placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed";

export default function FieldRenderer({ field, value, onChange, readOnly, hasError, lang, values }) {
  if (!field) return null;
  const key     = field.field_key;
  const type    = (field.field_type || 'TEXT').toUpperCase();
  const status  = hasError ? 'error' : '';
  const placeholder = lang === 'hi' ? field.placeholder_hi : field.placeholder_en;

  let options = field.options;
  if (typeof options === 'string') {
    try { options = JSON.parse(options); } catch { options = []; }
  }
  options = options || [];

  if (key.endsWith('_police_station') && values) {
    const prefix = key.substring(0, key.lastIndexOf('_police_station'));
    const districtVal = values[`${prefix}_district`] || values.district;
    if (districtVal && DISTRICTS_AND_STATIONS[districtVal]) {
      options = DISTRICTS_AND_STATIONS[districtVal].map(ps => ({
        value: ps,
        label_en: ps,
        label_hi: ps
      }));
    } else {
      options = [];
    }
  }

  const handleChange = (val) => onChange(key, val);

  if (key === 'gd_no') {
    const containerBg = readOnly ? 'bg-slate-50' : 'bg-white';
    const disabledClass = readOnly ? 'cursor-not-allowed text-slate-400' : 'text-slate-800';
    return (
      <div className={`w-full ${containerBg} border-2 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center divide-y sm:divide-y-0 sm:divide-x-2 divide-slate-100 overflow-hidden focus-within:border-[var(--accent-color)] transition-colors ${status === 'error' ? 'border-red-400 bg-red-50 focus-within:border-red-500' : 'border-slate-200'}`}>
        <div className="flex-1 flex items-center min-w-0">
          <input
            type="text"
            disabled={readOnly}
            value={values?.gd_no || ''}
            onChange={(e) => onChange('gd_no', e.target.value)}
            placeholder={lang === 'hi' ? 'जीडी नंबर' : 'GD Number'}
            className={`w-full bg-transparent border-0 text-sm px-3.5 py-2.5 outline-none placeholder:text-slate-400 ${disabledClass}`}
          />
        </div>
        <div className="w-full sm:w-[180px] flex items-center min-w-0">
          <input
            type="date"
            disabled={readOnly}
            value={values?.gd_date || ''}
            onChange={(e) => onChange('gd_date', e.target.value)}
            className={`w-full bg-transparent border-0 text-sm px-3.5 py-2.5 outline-none placeholder:text-slate-400 cursor-pointer ${disabledClass}`}
          />
        </div>
        <div className="w-full sm:w-[140px] flex items-center min-w-0">
          <input
            type="time"
            disabled={readOnly}
            value={values?.gd_time || ''}
            onChange={(e) => onChange('gd_time', e.target.value)}
            className={`w-full bg-transparent border-0 text-sm px-3.5 py-2.5 outline-none placeholder:text-slate-400 cursor-pointer ${disabledClass}`}
          />
        </div>
      </div>
    );
  }

  if (key === 'arrest_date') {
    const containerBg = readOnly ? 'bg-slate-50' : 'bg-white';
    const disabledClass = readOnly ? 'cursor-not-allowed text-slate-400' : 'text-slate-800';
    return (
      <div className={`w-full ${containerBg} border-2 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center divide-y sm:divide-y-0 sm:divide-x-2 divide-slate-100 overflow-hidden focus-within:border-[var(--accent-color)] transition-colors ${status === 'error' ? 'border-red-400 bg-red-50 focus-within:border-red-500' : 'border-slate-200'}`}>
        <div className="flex-1 flex items-center min-w-0">
          <input
            type="date"
            disabled={readOnly}
            value={values?.arrest_date || ''}
            onChange={(e) => onChange('arrest_date', e.target.value)}
            className={`w-full bg-transparent border-0 text-sm px-3.5 py-2.5 outline-none placeholder:text-slate-400 cursor-pointer ${disabledClass}`}
          />
        </div>
        <div className="w-full sm:w-[220px] flex items-center min-w-0">
          <input
            type="time"
            disabled={readOnly}
            value={values?.arrest_time || ''}
            onChange={(e) => onChange('arrest_time', e.target.value)}
            className={`w-full bg-transparent border-0 text-sm px-3.5 py-2.5 outline-none placeholder:text-slate-400 cursor-pointer ${disabledClass}`}
          />
        </div>
      </div>
    );
  }

  if (key === 'fir_no') {
    const containerBg = readOnly ? 'bg-slate-50' : 'bg-white';
    const disabledClass = readOnly ? 'cursor-not-allowed text-slate-400' : 'text-slate-800';
    return (
      <div className={`w-full ${containerBg} border-2 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center divide-y sm:divide-y-0 sm:divide-x-2 divide-slate-100 overflow-hidden focus-within:border-[var(--accent-color)] transition-colors ${status === 'error' ? 'border-red-400 bg-red-50 focus-within:border-red-500' : 'border-slate-200'}`}>
        <div className="flex-1 flex items-center min-w-0">
          <input
            type="text"
            disabled={readOnly}
            value={values?.fir_no || ''}
            onChange={(e) => onChange('fir_no', e.target.value)}
            placeholder={lang === 'hi' ? 'प्राथमिकी (FIR) संख्या' : 'FIR Number'}
            className={`w-full bg-transparent border-0 text-sm px-3.5 py-2.5 outline-none placeholder:text-slate-400 ${disabledClass}`}
          />
        </div>
        <div className="w-full sm:w-[220px] flex items-center min-w-0">
          <input
            type="date"
            disabled={readOnly}
            value={values?.fir_date || ''}
            onChange={(e) => onChange('fir_date', e.target.value)}
            className={`w-full bg-transparent border-0 text-sm px-3.5 py-2.5 outline-none placeholder:text-slate-400 cursor-pointer ${disabledClass}`}
          />
        </div>
        <div className="w-full sm:w-[140px] flex items-center min-w-0">
          <input
            type="time"
            disabled={readOnly}
            value={values?.fir_time || ''}
            onChange={(e) => onChange('fir_time', e.target.value)}
            className={`w-full bg-transparent border-0 text-sm px-3.5 py-2.5 outline-none placeholder:text-slate-400 cursor-pointer ${disabledClass}`}
          />
        </div>
      </div>
    );
  }

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
    return <CheckboxField id={`field-${key}`} disabled={readOnly} value={value} onChange={handleChange} label="" />;
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
