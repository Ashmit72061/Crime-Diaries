import React from 'react';
import { Input } from 'antd';

export default function TextAreaField({ id, disabled, value, onChange, status, placeholder, rows = 3 }) {
  return (
    <Input.TextArea
      id={id}
      disabled={disabled}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      status={status}
      placeholder={placeholder}
      rows={rows}
    />
  );
}
