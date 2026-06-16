import React from 'react';
import { InputNumber } from 'antd';

export default function NumberField({ id, disabled, value, onChange, status, placeholder }) {
  return (
    <InputNumber
      id={id}
      disabled={disabled}
      value={value}
      onChange={onChange}
      status={status}
      placeholder={placeholder}
      className="w-full"
    />
  );
}
