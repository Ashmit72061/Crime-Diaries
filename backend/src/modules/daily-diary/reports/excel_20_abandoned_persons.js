import { fmtDate } from '../formatters.js';

export default {
  tableName: 'excel_20abandoned_persons',
  label:     'Abandoned Persons',
  type:      'list',
  num:       20,
  columns:   ['sno', 'dd_no', 'found_place', 'found_date', 'sex', 'age', 'height', 'built', 'complexion', 'face', 'hair', 'beard', 'mustaches', 'upper_dress_color', 'lower_dress_color', 'name_of_io'],
  filter: ({ missing }) => missing.filter(r => (r.data.status || '').toLowerCase() === 'abandoned' || r.data.abandoned === true),
  mapRow: (r, idx) => {
    const d = r.data;
    return {
      sno:       idx + 1,
      dd_no:     d.dd_no || '',
      found_place: d.found_place || d.missing_place || '',
      found_date:  fmtDate(d.found_date || d.missing_date),
      sex:         d.gender || '',
      age:         d.age || '',
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
