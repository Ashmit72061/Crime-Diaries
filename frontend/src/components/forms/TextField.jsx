import React from 'react';
import { Input } from 'antd';

export default function TextField({ id, disabled, value, onChange, status, placeholder }) {
  return (
    <Input
      id={id}
      disabled={disabled}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      status={status}
      placeholder={placeholder}
    />
  );
}
