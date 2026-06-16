import React from 'react';
import { Select } from 'antd';

export default function SelectField({ id, disabled, value, onChange, status, placeholder, options = [], lang = 'en' }) {
  const getLabel = (opt) => lang === 'hi' ? (opt.label_hi || opt.label_en) : opt.label_en;

  return (
    <Select
      id={id}
      disabled={disabled}
      value={value || undefined}
      onChange={onChange}
      status={status}
      className="w-full"
      placeholder={placeholder || (lang === 'hi' ? 'विकल्प चुनें' : 'Select Option')}
    >
      {options.map((opt) => (
        <Select.Option key={opt.value} value={opt.value}>
          {getLabel(opt)}
        </Select.Option>
      ))}
    </Select>
  );
}
