import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, AlertTriangle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import { useFormSchema } from '../../hooks/useFormSchema.js';
import { useAutosave } from '../../hooks/useAutosave.js';
import useAuthStore from '../../store/authStore.js';
import { findNodeById } from '../../utils/hierarchyData.js';

import FormSection from './FormSection.jsx';
import FormToolbar from './FormToolbar.jsx';
import FormAutosave from './FormAutosave.jsx';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function parseRules(rawRules) {
  if (!rawRules) return {};
  if (typeof rawRules === 'object') return rawRules;
  try { return JSON.parse(rawRules); } catch { return {}; }
}

/* ─── StepDot ─────────────────────────────────────────────────────────────── */
function StepDot({ index, active, completed, hasError, title, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-1 cursor-pointer outline-none"
      title={title}
    >
      <span className={`
        flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs font-bold transition-all duration-300
        ${active
          ? 'bg-[var(--accent-color)] border-[var(--accent-color)] text-white shadow-md shadow-[var(--accent-glow)] scale-110'
          : hasError
            ? 'bg-red-50 border-red-500 text-red-600'
            : completed
              ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
              : 'bg-white border-slate-300 text-slate-400 group-hover:border-slate-400 group-hover:text-slate-600'
        }
      `}>
        {completed && !active ? <CheckCircle2 size={14} /> : index + 1}
      </span>
      <span className={`text-[11px] font-semibold max-w-[90px] text-center leading-tight hidden sm:block transition-colors ${
        active ? 'text-[var(--accent-color)]' : hasError ? 'text-red-600' : 'text-slate-400'
      }`}>
        {title}
      </span>
    </button>
  );
}

/**
 * DynamicForm
 *
 * @param {string}   recordType     - 'CASE' | 'ARREST' | 'PCR_CALL' | 'MISSING' | 'UIDB'
 * @param {object}   initialValues  - Pre-populated data (from existing record.data)
 * @param {function} onSubmit       - Final submit callback(formValues, activeRecordId)
 * @param {boolean}  readOnly       - Lock all inputs for review
 * @param {string[]} targetFields   - Field keys flagged for correction (send-back)
 */
export default function DynamicForm({
  recordType,
  initialValues = {},
  onSubmit,
  readOnly = false,
  targetFields = [],
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const navigate = useNavigate();

  const { user } = useAuthStore();
  const { schema, isLoading, isError, schemaError } = useFormSchema(recordType);
  const activeRecordIdRef = useRef(initialValues?.id || null);

  const { triggerAutosave, saveImmediately, saveStatus, savedRecord } = useAutosave(
    recordType,
    initialValues?.id
  );

  const [values,       setValues      ] = useState({});
  const [errors,       setErrors      ] = useState({});
  const [touched,      setTouched     ] = useState({});
  const [currentStep,  setCurrentStep ] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const formRef = useRef(null);

  /* ── Sync saved record ID ─────────────────────────────────────────────── */
  useEffect(() => {
    if (savedRecord?.id) {
      activeRecordIdRef.current = savedRecord.id;
    }
  }, [savedRecord]);

  const initialValuesStr = JSON.stringify(initialValues || {});
  const userStr = user ? JSON.stringify({
    id: user.id,
    role: user.role,
    psId: user.psId,
    districtId: user.districtId,
    stationName: user.stationName,
    districtKey: user.districtKey
  }) : '';

  /* ── Seed initial values & System Fields ──────────────────────────────── */
  useEffect(() => {
    const seed = initialValues?.data || initialValues || {};
    
    // Resolve station and district dynamically based on record metadata or active user node
    const recordPsId = initialValues?.ps_id || initialValues?.psId;
    const recordDistId = initialValues?.district_id || initialValues?.districtId;

    let resolvedStation = seed.police_station;
    let resolvedDistrict = seed.district;

    if (!resolvedStation) {
      if (recordPsId) {
        const node = findNodeById(recordPsId);
        if (node && node.type === 'PS') {
          resolvedStation = node.stationName || node.name;
        }
      } else if (user?.stationName) {
        resolvedStation = user.stationName;
      } else if (user?.psId) {
        const node = findNodeById(user.psId);
        if (node && node.type === 'PS') {
          resolvedStation = node.stationName || node.name;
        }
      } else {
        // Fallback only for Police Station level roles
        const isPsLevel = user?.role === 'PS' || user?.role === 'HC' || user?.role === 'SHO';
        resolvedStation = isPsLevel ? 'Parliament Street' : '';
      }
    }

    if (!resolvedDistrict) {
      if (recordDistId) {
        const node = findNodeById(recordDistId);
        if (node) {
          resolvedDistrict = node.districtKey || node.name;
        }
      } else if (user?.districtKey) {
        resolvedDistrict = user.districtKey;
      } else if (user?.districtId) {
        const node = findNodeById(user.districtId);
        if (node) {
          resolvedDistrict = node.districtKey || node.name;
        }
      } else {
        const isHqLevel = user?.role === 'HQ' || user?.role === 'HQ_ANALYST' || user?.role === 'HQ_ADMIN';
        resolvedDistrict = isHqLevel ? '' : 'New Delhi District (NDD)';
      }
    }

    // Auto-populate readonly system fields from session/metadata
    const updatedSeed = {
      ...seed,
      uid: initialValues?.id || seed.uid || 'NEW_DRAFT_PENDING',
      district: resolvedDistrict,
      police_station: resolvedStation,
      submission_status: initialValues?.current_status || seed.submission_status || 'DRAFT'
    };
    
    setValues(updatedSeed);
    if (initialValues?.id) {
      activeRecordIdRef.current = initialValues.id;
    }
  }, [initialValuesStr, userStr]);

  /* ── Validate a single section (step) ─────────────────────────────────── */
  const validateSection = useCallback((stepIdx, currentValues = values) => {
    const section = schema[stepIdx];
    if (!section) return {};

    const errs = {};
    section.fields.forEach((field) => {
      // Skip validating if field is hidden by condition
      if (field.show_when) {
        const { field: targetField, value: targetValue } = field.show_when;
        const currentValue = currentValues[targetField];
        if (String(currentValue || '').toLowerCase() !== String(targetValue || '').toLowerCase()) {
          return;
        }
      }

      const rules = parseRules(field.validation_rules);
      if (!rules.required) return;

      const val = currentValues[field.field_key];
      const isEmpty = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);

      if (isEmpty) {
        const label = lang === 'hi' ? (field.label_hi || field.label_en) : field.label_en;
        errs[field.field_key] = lang === 'hi'
          ? `${label} आवश्यक है`
          : `${label} is required`;
      }
    });
    return errs;
  }, [schema, values, lang]);

  /* ── Validate ALL sections ─────────────────────────────────────────────── */
  const validateAll = useCallback((currentValues = values) => {
    const allErrs = {};
    schema.forEach((section) => {
      const errs = validateSection(schema.indexOf(section), currentValues);
      Object.assign(allErrs, errs);
    });
    return allErrs;
  }, [schema, values, validateSection]);

  /* ── Handle field change ──────────────────────────────────────────────── */
  const handleChange = useCallback((key, val) => {
    if (readOnly) return;

    setValues((prev) => {
      const next = { ...prev, [key]: val };
      if (next.time_of_occurrence !== undefined) {
        next.occurrence_time = next.time_of_occurrence;
      }

      // Clear error on change
      if (errors[key]) {
        setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
      }

      // Auto-save using custom hook (2 seconds debounce)
      triggerAutosave(next, activeRecordIdRef.current);

      return next;
    });

    setTouched((prev) => ({ ...prev, [key]: true }));
  }, [readOnly, errors, triggerAutosave]);

  /* ── Navigate forward (with step validation) ──────────────────────────── */
  const handleNext = () => {
    const stepErrs = validateSection(currentStep);
    if (Object.keys(stepErrs).length > 0) {
      setErrors((prev) => ({ ...prev, ...stepErrs }));
      // Mark all fields in this step as touched
      const section = schema[currentStep];
      const newTouched = {};
      section?.fields?.forEach((f) => { newTouched[f.field_key] = true; });
      setTouched((prev) => ({ ...prev, ...newTouched }));
      
      toast.error(lang === 'hi'
        ? 'कृपया सभी आवश्यक फ़ील्ड भरें।'
        : 'Please fill all required fields before continuing.');
      return;
    }

    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    setCurrentStep((s) => Math.min(s + 1, schema.length - 1));
    // Scroll to top of form
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  /* ── Navigate backward ────────────────────────────────────────────────── */
  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 0));
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  /* ── Jump to a specific step (click step dot) ─────────────────────────── */
  const handleStepClick = (targetIdx) => {
    if (targetIdx < currentStep) {
      setCurrentStep(targetIdx);
      return;
    }
    if (targetIdx === currentStep) return;

    let canJump = true;
    for (let i = currentStep; i < targetIdx; i++) {
      const errs = validateSection(i);
      if (Object.keys(errs).length > 0) {
        setErrors((prev) => ({ ...prev, ...errs }));
        canJump = false;
        break;
      }
      setCompletedSteps((prev) => new Set([...prev, i]));
    }
    if (canJump) setCurrentStep(targetIdx);
  };

  /* ── Final form submission ─────────────────────────────────────────────── */
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (readOnly) return;

    const allErrs = validateAll();
    if (Object.keys(allErrs).length > 0) {
      setErrors(allErrs);
      const allTouched = {};
      schema.forEach((sec) => sec.fields.forEach((f) => { allTouched[f.field_key] = true; }));
      setTouched(allTouched);

      let firstErrStep = 0;
      schema.forEach((sec, idx) => {
        const hasErr = sec.fields.some((f) => allErrs[f.field_key]);
        if (hasErr && idx < firstErrStep + 1) firstErrStep = idx;
      });
      setCurrentStep(firstErrStep);

      toast.error(lang === 'hi'
        ? 'कृपया सभी आवश्यक फ़ील्ड भरें।'
        : 'Please complete all required fields.');

      setTimeout(() => {
        const firstErrKey = Object.keys(allErrs)[0];
        document.getElementById(`field-${firstErrKey}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
      return;
    }

    const finalValues = { ...values };
    if (finalValues.time_of_occurrence !== undefined) {
      finalValues.occurrence_time = finalValues.time_of_occurrence;
    }
    onSubmit?.(finalValues, activeRecordIdRef.current);
  };

  /* ── Manual save draft (button click) ────────────────────────────────────*/
  const handleManualSave = () => {
    const finalValues = { ...values };
    if (finalValues.time_of_occurrence !== undefined) {
      finalValues.occurrence_time = finalValues.time_of_occurrence;
    }
    saveImmediately(finalValues, activeRecordIdRef.current);
    toast.success(lang === 'hi' ? 'ड्राफ्ट सहेज लिया गया है।' : 'Draft saved successfully.');
  };

  /* ── Render states ─────────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-500 gap-3">
        <Loader2 size={32} className="animate-spin text-[var(--accent-color)]" />
        <p className="text-sm font-semibold">{t('common.loading', 'Loading form schema...')}</p>
      </div>
    );
  }

  if (isError || schema.length === 0) {
    const status = schemaError?.response?.status;
    const hint = status === 401
      ? 'Session expired — please log out and log back in with your badge credentials.'
      : status
        ? `Server returned ${status}. Check that the backend is running.`
        : 'No fields are configured for this record type. Re-run the database seed or switch to Mock Mode.';
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-500 gap-4 bg-white border border-dashed border-slate-300 rounded-xl shadow-sm">
        <AlertTriangle size={32} className="text-amber-500" />
        <p className="text-sm font-semibold text-slate-700">Form schema not found</p>
        <p className="text-xs text-slate-400 text-center max-w-xs leading-relaxed">{hint}</p>
        <p className="text-xs text-slate-500">
          Record type: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{recordType}</code>
        </p>
      </div>
    );
  }

  const activeSection = schema[currentStep];
  const isLastStep    = currentStep === schema.length - 1;

  const stepHasError = (idx) => {
    const sec = schema[idx];
    return sec?.fields?.some((f) => errors[f.field_key] && touched[f.field_key]);
  };

  return (
    <div className="space-y-6" ref={formRef}>

      {/* ── Step Navigator ── */}
      {schema.length > 1 && (
        <div className="bg-white border border-slate-200 rounded-xl px-6 py-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Active Step Indicator */}
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent-color)] text-white text-xs font-bold shadow-md shadow-[var(--accent-glow)] scale-110 flex-shrink-0">
                {currentStep + 1}
              </span>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">
                  {lang === 'hi' ? 'सक्रिय चरण' : 'Active Step'}
                </span>
                <span className="text-sm font-extrabold text-slate-800 font-display">
                  {lang === 'hi'
                    ? (activeSection.title_hi || activeSection.title_en)
                    : activeSection.title_en}
                </span>
              </div>
            </div>

            {/* Right: step counter + autosave */}
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end sm:pl-5 sm:border-l border-slate-100">
              <span className="text-xs font-extrabold text-[var(--accent-color)] bg-[var(--accent-glow)] border border-[var(--accent-color)]/10 px-3 py-1.5 rounded-lg whitespace-nowrap">
                {lang === 'hi' ? `चरण ${currentStep + 1} / ${schema.length}` : `Step ${currentStep + 1} / ${schema.length}`}
              </span>
              <FormAutosave status={saveStatus} lang={lang} />
            </div>
          </div>
        </div>
      )}

      {/* ── Single-step save indicator (when no step nav) ─────────────── */}
      {schema.length === 1 && (
        <div className="flex justify-end">
          <FormAutosave status={saveStatus} lang={lang} />
        </div>
      )}

      {/* ── Validation summary (top — shown after first submit attempt) ── */}
      {Object.keys(errors).length > 0 && Object.values(touched).some(Boolean) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 shadow-sm space-y-2">
          <div className="flex items-center gap-2 font-bold text-red-700 mb-1">
            <AlertCircle size={16} />
            <span>
              {lang === 'hi'
                ? `${Object.keys(errors).filter(k => touched[k]).length} फ़ील्ड अपूर्ण हैं`
                : `${Object.keys(errors).filter(k => touched[k]).length} field(s) need your attention`}
            </span>
          </div>
          {Object.entries(errors)
            .filter(([k]) => touched[k])
            .slice(0, 5)
            .map(([, msg]) => (
              <div key={msg} className="flex items-center gap-2 text-red-600">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                {msg}
              </div>
            ))}
        </div>
      )}

      {/* ── Active Section Form ─────────────────────────────────────────── */}
      {activeSection && (
        <div className="space-y-6">
          {/* Wrap ONLY the fields in a form so Enter key doesn't auto-submit
              when navigating between steps. The submit action is wired via
              an explicit onClick on the Submit button in FormToolbar. */}
          <form onSubmit={(e) => e.preventDefault()} noValidate>
            <FormSection
              section={activeSection}
              currentStep={currentStep}
              values={values}
              errors={errors}
              touched={touched}
              handleChange={handleChange}
              readOnly={readOnly}
              targetFields={targetFields}
              lang={lang}
            />
          </form>

          {/* ── Footer Action Bar (FormToolbar) ─────────────────────────── */}
          <FormToolbar
            currentStep={currentStep}
            totalSteps={schema.length}
            readOnly={readOnly}
            onBack={() => navigate('/records')}
            onPrevious={handleBack}
            onSaveDraft={!readOnly ? handleManualSave : null}
            onNext={handleNext}
            onSubmit={handleFormSubmit}
            isLastStep={isLastStep}
            lang={lang}
          />
        </div>
      )}
    </div>
  );
}
