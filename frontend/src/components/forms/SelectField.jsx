import React from 'react';

const base = "w-full bg-white border-2 border-slate-200 text-slate-800 text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-[#0f52ba] transition-colors disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed appearance-none cursor-pointer";
const err  = "border-red-400 focus:border-red-500 bg-red-50";

export default function SelectField({ id, disabled, value, onChange, status, placeholder, options = [], lang = 'en' }) {
  const getLabel = (opt) => lang === 'hi' ? (opt.label_hi || opt.label_en) : opt.label_en;

  return (
    <div className="relative">
      <select
        id={id}
        disabled={disabled}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={`${base} ${status === 'error' ? err : ''} pr-10`}
      >
        <option value="" disabled>
          {placeholder || (lang === 'hi' ? 'विकल्प चुनें' : 'Select an option')}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {getLabel(opt)}
          </option>
        ))}
      </select>
      {/* Custom chevron */}
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}
