import { formatPerson, fmtDate } from '../formatters.js';
import { isInquestCase, isDisposed } from '../classifiers.js';

export default {
  tableName: 'excel_26inquest_acpsdm_disposal',
  label:     'Inquest ACP/SDM Disposal',
  type:      'list',
  num:       26,
  columns:   ['sno', 'dd_no', 'date', 'us', 'deceased_details', 'sex', 'cause_of_death', 'date_of_filed_by_acpsdm'],
  columnLabels: {
    date_of_filed_by_acpsdm: 'Date Filed by ACP/SDM',
  },
  filter: ({ cases }) => cases.filter(r => isInquestCase(r.data) && isDisposed(r.data)),
  mapRow: (r, idx) => {
    const d = r.data;
    return {
      sno:             idx + 1,
      dd_no:           d.gd_no || d.dd_no || d.fir_no || '',
      date:            fmtDate(d.fir_date || r.record_date),
      us:              d.sections || '',
      deceased_details: formatPerson(d.deceased_name, d.age, d.deceased_father_husband_name, d.deceased_address),
      sex:             d.gender || d.sex || '',
      cause_of_death:  d.cause_of_death || '',
      date_of_filed_by_acpsdm: fmtDate(d.disposal_date || (r.updated_at || '').split('T')[0]),
    };
  },
};
