import React from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Upload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

// Import individual field components
import TextField from './TextField.jsx';
import TextAreaField from './TextAreaField.jsx';
import NumberField from './NumberField.jsx';
import DateField from './DateField.jsx';
import TimeField from './TimeField.jsx';
import SelectField from './SelectField.jsx';
import CheckboxField from './CheckboxField.jsx';
import RadioField from './RadioField.jsx';

/**
 * FieldRenderer - Renders a single dynamic form field using Ant Design components.
 *
 * @param {object}   field       - Field definition from schema
 * @param {*}        value       - Current value from form state
 * @param {function} onChange    - (key, value) => void
 * @param {boolean}  readOnly    - Disable all inputs
 * @param {boolean}  hasError    - Show error styling
 * @param {string}   lang        - 'en' or 'hi'
 */
export default function FieldRenderer({ field, value, onChange, readOnly, hasError, lang }) {
  const { t } = useTranslation();
  const key   = field.field_key;
  const type  = (field.field_type || 'TEXT').toUpperCase();

  // Parse options safely (can be JSON string or array)
  let options = field.options;
  if (typeof options === 'string') {
    try { options = JSON.parse(options); } catch { options = []; }
  }
  options = options || [];

  const getLabel = (opt) => lang === 'hi' ? (opt.label_hi || opt.label_en) : opt.label_en;

  const handleChange = (val) => {
    onChange(key, val);
  };

  const status = hasError ? 'error' : '';
  const placeholder = lang === 'hi' ? field.placeholder_hi : field.placeholder_en;

  /* ─── TEXT / DEFAULT ──────────────────────────────────────────────────────── */
  if (type === 'TEXT') {
    return (
      <TextField
        id={`field-${key}`}
        disabled={readOnly}
        value={value}
        onChange={handleChange}
        status={status}
        placeholder={placeholder}
      />
    );
  }

  /* ─── NUMBER ─────────────────────────────────────────────────────────────── */
  if (type === 'NUMBER') {
    return (
      <NumberField
        id={`field-${key}`}
        disabled={readOnly}
        value={value}
        onChange={handleChange}
        status={status}
        placeholder={placeholder}
      />
    );
  }

  /* ─── DATE ───────────────────────────────────────────────────────────────── */
  if (type === 'DATE') {
    return (
      <DateField
        id={`field-${key}`}
        disabled={readOnly}
        value={value}
        onChange={handleChange}
        status={status}
        placeholder={placeholder}
        showTime={false}
      />
    );
  }

  /* ─── TIME ───────────────────────────────────────────────────────────────── */
  if (type === 'TIME') {
    return (
      <TimeField
        id={`field-${key}`}
        disabled={readOnly}
        value={value}
        onChange={handleChange}
        status={status}
        placeholder={placeholder}
      />
    );
  }

  /* ─── DATETIME ───────────────────────────────────────────────────────────── */
  if (type === 'DATETIME') {
    return (
      <DateField
        id={`field-${key}`}
        disabled={readOnly}
        value={value}
        onChange={handleChange}
        status={status}
        placeholder={placeholder}
        showTime={true}
      />
    );
  }

  /* ─── TEXTAREA ────────────────────────────────────────────────────────────── */
  if (type === 'TEXTAREA') {
    return (
      <TextAreaField
        id={`field-${key}`}
        disabled={readOnly}
        value={value}
        onChange={handleChange}
        status={status}
        placeholder={placeholder}
      />
    );
  }

  /* ─── PHONE ──────────────────────────────────────────────────────────────── */
  if (type === 'PHONE') {
    return (
      <Input
        id={`field-${key}`}
        type="tel"
        maxLength={15}
        disabled={readOnly}
        value={value || ''}
        onChange={(e) => handleChange(e.target.value)}
        status={status}
        placeholder={placeholder || "e.g. 98765 43210"}
      />
    );
  }

  /* ─── SELECT / DROPDOWN ──────────────────────────────────────────────────── */
  if (type === 'SELECT' || type === 'DROPDOWN') {
    return (
      <SelectField
        id={`field-${key}`}
        disabled={readOnly}
        value={value}
        onChange={handleChange}
        status={status}
        placeholder={placeholder}
        options={options}
        lang={lang}
      />
    );
  }

  /* ─── RADIO ──────────────────────────────────────────────────────────────── */
  if (type === 'RADIO') {
    return (
      <RadioField
        id={`field-${key}`}
        disabled={readOnly}
        value={value}
        onChange={handleChange}
        options={options}
        lang={lang}
      />
    );
  }

  /* ─── BOOLEAN / CHECKBOX ─────────────────────────────────────────────────── */
  if (type === 'BOOLEAN' || type === 'CHECKBOX') {
    const chkLabel = lang === 'hi' ? 'हाँ / सत्य' : 'Yes / True';
    return (
      <CheckboxField
        id={`field-${key}`}
        disabled={readOnly}
        value={value}
        onChange={handleChange}
        label={chkLabel}
      />
    );
  }

  /* ─── FILE UPLOAD ────────────────────────────────────────────────────────── */
  if (type === 'FILE') {
    return (
      <Upload
        id={`field-${key}`}
        disabled={readOnly}
        beforeUpload={() => false}
        onChange={(info) => {
          if (info.fileList.length > 0) {
            handleChange(info.file.name);
          } else {
            handleChange('');
          }
        }}
        maxCount={1}
      >
        <Button disabled={readOnly} icon={<UploadOutlined />} className="bg-white border-slate-300 text-slate-700 shadow-sm hover:text-[#0f52ba] hover:border-[#0f52ba]">
          {lang === 'hi' ? 'फ़ाइल अपलोड करें' : 'Choose File'}
        </Button>
      </Upload>
    );
  }

  /* ─── EMAIL ──────────────────────────────────────────────────────────────── */
  if (type === 'EMAIL') {
    return (
      <Input
        id={`field-${key}`}
        type="email"
        disabled={readOnly}
        value={value || ''}
        onChange={(e) => handleChange(e.target.value)}
        status={status}
        placeholder={placeholder}
      />
    );
  }

  /* ─── FALLBACK: render as text ───────────────────────────────────────────── */
  return (
    <TextField
      id={`field-${key}`}
      disabled={readOnly}
      value={value}
      onChange={handleChange}
      status={status}
      placeholder={placeholder}
    />
  );
}
