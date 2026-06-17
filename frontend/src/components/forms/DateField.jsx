import React from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';

export default function DateField({ id, disabled, value, onChange, status, placeholder, showTime = false, format = 'YYYY-MM-DD' }) {
  return (
    <DatePicker
      id={id}
      disabled={disabled}
      value={value ? dayjs(value) : null}
      onChange={(date, dateString) => onChange(dateString)}
      status={status}
      placeholder={placeholder}
      className="w-full"
      showTime={showTime}
      format={showTime ? 'YYYY-MM-DD HH:mm:ss' : format}
    />
  );
}
