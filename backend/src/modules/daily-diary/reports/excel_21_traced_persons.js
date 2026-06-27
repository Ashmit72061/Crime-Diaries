import { formatPersonNoAge, fmtDate } from '../formatters.js';

export default {
  tableName: 'excel_21traced_persons',
  label: 'Traced Persons',
  type: 'list',
  num: 21,
  columns: ['sno', 'dd_no', 'dd_date', 'name_of_operator_to_whom_mps', 'traced_person_details', 'name_of_io'],
  filter: ({ missing }) => missing.filter(r => (r.data.status || '').toLowerCase() === 'traced'),
  mapRow: (r, idx) => {
    const d = r.data;
    return {
      sno: idx + 1,
      dd_no: d.dd_no || '',
      dd_date: fmtDate(d.dd_date || r.record_date),
      name_of_operator_to_whom_mps: d.operator_name || '',
      traced_person_details: formatPersonNoAge(d.missing_name, d.father_husband_name || d.complainant_father_husband_name, d.missing_address || d.mp_address || d.address, d),
      name_of_io: d.io_name || '',
    };
  },
};
