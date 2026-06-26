import { fmtDate } from '../formatters.js';

export default {
  tableName: 'excel_18missing_persons',
  label:     'Missing Persons',
  type:      'list',
  num:       18,
  columns:   ['sno', 'dd_no', 'dd_date', 'name_of_operator_to_whom_mps', 'name_of_missing_person', 'address_of_missing_person', 'missing_date', 'age', 'height', 'built', 'complexion', 'face', 'hair', 'beard', 'mustaches', 'upper_dress_color', 'lower_dress_color', 'name_of_io'],
  columnLabels: {
    name_of_missing_person:    'Name of Missing Person',
    address_of_missing_person: 'Address of Missing Person',
    missing_date:              'Missing Date',
    mustaches:                 'Mustaches',
  },
  filter: ({ missing }) => missing,
  mapRow: (r, idx) => {
    const d = r.data;
    return {
      sno:             idx + 1,
      dd_no:           d.dd_no || '',
      dd_date:         fmtDate(d.dd_date || r.record_date),
      name_of_operator_to_whom_mps: d.operator_name || '',
      name_of_missing_person:       d.missing_name || '',
      address_of_missing_person:    d.missing_address || d.mp_address || d.address || '',
      missing_date:    fmtDate(d.missing_date),
      age:             d.age || '',
      height:          d.height || '',
      built:           d.built || '',
      complexion:      d.complexion || '',
      face:            d.face || '',
      hair:            d.hair || '',
      beard:           d.beard || '',
      mustaches:       d.moustache || d.mustaches || '',
      upper_dress_color: d.upper_dress_color || '',
      lower_dress_color: d.lower_dress_color || '',
      name_of_io:      d.io_name || '',
    };
  },
};
