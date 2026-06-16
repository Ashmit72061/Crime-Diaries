import React from 'react';
import { Checkbox } from 'antd';

export default function CheckboxField({ id, disabled, value, onChange, label }) {
  const isChecked = value === true || value === 'true' || value === 1;
  return (
    <div className="pt-1.5">
      <Checkbox
        id={id}
        disabled={disabled}
        checked={isChecked}
        onChange={(e) => onChange(e.target.checked)}
      >
        <span className="text-slate-700 ml-1 font-medium">
          {label}
        </span>
      </Checkbox>
    </div>
  );
}
