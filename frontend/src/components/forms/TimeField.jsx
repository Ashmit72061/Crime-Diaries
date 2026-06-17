import React from 'react';
import { TimePicker } from 'antd';
import dayjs from 'dayjs';

export default function TimeField({ id, disabled, value, onChange, status, placeholder }) {
  return (
    <TimePicker
      id={id}
      disabled={disabled}
      value={value ? dayjs(value, 'HH:mm:ss') : null}
      onChange={(time, timeString) => onChange(timeString)}
      status={status}
      placeholder={placeholder}
      className="w-full"
    />
  );
}
