import { formatPerson, fmtDate } from '../formatters.js';
import { isInquestCase } from '../classifiers.js';

export default {
  tableName: 'excel_25inquest_registered',
  label:     'Inquest Registered',
  type:      'list',
  num:       25,
  columns:   ['sn', 'dd_no', 'date', 'us', 'deceased_details', 'sex', 'cause_of_death', 'place_of_occurrence', 'io'],
  filter: ({ cases }) => cases.filter(r => isInquestCase(r.data)),
  mapRow: (r, idx) => {
    const d = r.data;
    return {
      sn:              idx + 1,
      dd_no:           d.gd_no || d.dd_no || d.fir_no || '',
      date:            fmtDate(d.fir_date || r.record_date),
      us:              d.sections || '',
      deceased_details: formatPerson(d.deceased_name, d.age, d.deceased_father_husband_name, d.deceased_address),
      sex:             d.gender || d.sex || '',
      cause_of_death:  d.cause_of_death || '',
      place_of_occurrence: d.occurrence_place || '',
      io:              d.io_name || '',
    };
  },
};
