import { fmtDate } from '../formatters.js';

export default {
  tableName: 'excel_19uidb',
  label:     'UIDB (Unidentified Bodies)',
  type:      'list',
  num:       19,
  columns:   ['sno', 'dd_no', 'dd_date', 'found_place', 'found_date', 'sex', 'age', 'height', 'built', 'complexion', 'face', 'hair', 'beard', 'mustaches', 'upper_dress_color', 'lower_dress_color', 'name_of_io'],
  filter: ({ uidb }) => uidb,
  mapRow: (r, idx) => {
    const d = r.data;
    return {
      sno:       idx + 1,
      dd_no:     d.dd_no || '',
      dd_date:   fmtDate(d.dd_date || r.record_date),
      found_place: d.found_place || '',
      found_date:  fmtDate(d.found_date),
      sex:         d.gender || d.sex || '',
      age:         d.approx_age || d.age || '',
      height:      d.height || '',
      built:       d.built || '',
      complexion:  d.complexion || '',
      face:        d.face || '',
      hair:        d.hair || '',
      beard:       d.beard || '',
      mustaches:   d.moustache || d.mustaches || '',
      upper_dress_color: d.upper_dress_color || '',
      lower_dress_color: d.lower_dress_color || '',
      name_of_io:  d.io_name || '',
    };
  },
};
