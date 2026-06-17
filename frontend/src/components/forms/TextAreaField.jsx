import React from 'react';

const base = "w-full bg-white border-2 border-slate-200 text-slate-800 text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-[#0f52ba] transition-colors placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed resize-y";
const err  = "border-red-400 focus:border-red-500 bg-red-50";

export default function TextAreaField({ id, disabled, value, onChange, status, placeholder, rows = 3 }) {
  return (
    <textarea
      id={id}
      disabled={disabled}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || ''}
      rows={rows}
      className={`${base} ${status === 'error' ? err : ''}`}
    />
  );
}
