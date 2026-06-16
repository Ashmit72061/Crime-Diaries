import React from 'react';
import { Radio } from 'antd';

export default function RadioField({ id, disabled, value, onChange, options = [], lang = 'en' }) {
  const getLabel = (opt) => lang === 'hi' ? (opt.label_hi || opt.label_en) : opt.label_en;

  return (
    <Radio.Group
      id={id}
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex flex-wrap gap-2 pt-1"
    >
      {options.map((opt) => (
        <Radio key={opt.value} value={opt.value}>
          {getLabel(opt)}
        </Radio>
      ))}
    </Radio.Group>
  );
}
