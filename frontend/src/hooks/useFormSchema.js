import { useQuery } from '@tanstack/react-query';
import api from '../utils/api.js';

const SYSTEM_FIELDS = [
  { field_key: 'uid',              field_type: 'TEXT', label_en: 'Record UID',        label_hi: 'रिकॉर्ड यूआईडी (UID)',          readonly: true, validation_rules: { required: false } },
  { field_key: 'district',         field_type: 'TEXT', label_en: 'District',           label_hi: 'जिला',                           readonly: true, validation_rules: { required: false } },
  { field_key: 'police_station',   field_type: 'TEXT', label_en: 'Police Station',     label_hi: 'पुलिस थाना',                     readonly: true, validation_rules: { required: false } },
  { field_key: 'submission_status',field_type: 'TEXT', label_en: 'Submission Status',  label_hi: 'जमा करने की स्थिति',             readonly: true, validation_rules: { required: false } },
];

/**
 * Normalize a field from either mock (has validation_rules) or real backend
 * (may return `validation` instead of `validation_rules`).
 */
function normalizeField(f) {
  return {
    ...f,
    validation_rules: f.validation_rules ?? f.validation ?? {},
    label_hi: f.label_hi || f.label_en,
  };
}

/**
 * useFormSchema - Fetches the dynamic form schema for a given record type.
 * Returns sections: [{ section, title_en, title_hi, fields: [...] }]
 *
 * @param {string} recordType - 'CASE' | 'ARREST' | 'PCR_CALL' | 'MISSING' | 'UIDB'
 * @returns {{ schema, isLoading, isError, error }}
 */
export function useFormSchema(recordType) {
  const { data: schema, isLoading, isError, error } = useQuery({
    queryKey: ['fields', 'form', recordType],
    queryFn: async () => {
      if (!recordType) return [];
      const res = await api.get(`/fields/form/${recordType}`);
      const raw = res.data?.data;
      if (!raw) return [];

      // Accept flat sections array or wrapped { sections: [...] }
      const sections = Array.isArray(raw) ? raw : (raw.sections || []);

      // Normalize every field's validation key and add title fallback
      const normalized = sections.map((sec) => ({
        ...sec,
        title_en: sec.title_en || sec.section || 'Details',
        title_hi: sec.title_hi || sec.title_en || sec.section || 'विवरण',
        fields: (sec.fields || []).map(normalizeField),
      }));

      // Inject readonly system fields into the first section if not already present
      if (normalized.length > 0) {
        const firstSec = normalized[0];
        const existingKeys = new Set(firstSec.fields.map((f) => f.field_key));
        const toInject = SYSTEM_FIELDS.filter((f) => !existingKeys.has(f.field_key));
        firstSec.fields = [...toInject, ...firstSec.fields];
      }

      return normalized;
    },
    enabled: !!recordType,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return { schema: schema || [], isLoading, isError, schemaError: error };
}
