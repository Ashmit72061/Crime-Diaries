import { formatPersonNoAge } from '../formatters.js';
import { isOtherTheft } from '../classifiers.js';

export default {
  tableName: 'excel_4eother_theft_cases',
  label:     'E-Other Theft Cases',
  type:      'list',
  num:       4,
  columns:   ['sr_no', 'ps', 'efir_no', 'us', 'complainant_details', 'time_of_occurrence', 'stolen_items', 'place_of_occurrence', 'io_name', 'io_mobile_no', 'beat_no'],
  filter: ({ cases }) => cases.filter(r => isOtherTheft(r.data)),
  mapRow: (r, idx) => {
    const d = r.data;
    return {
      sr_no:               idx + 1,
      ps:                  r.ps_name || '',
      efir_no:             d.fir_no || '',
      us:                  d.sections || '',
      complainant_details: formatPersonNoAge(d.complainant_name, d.complainant_father_husband_name, d.complainant_address),
      time_of_occurrence:  d.occurrence_time || d.gd_time || '',
      stolen_items:        d.property_description || d.stolen_items || 'None',
      place_of_occurrence: d.occurrence_place || '',
      io_name:             d.io_name || '',
      io_mobile_no:        d.io_mobile || d.io_mobile_no || '',
      beat_no:             d.beat_no || '',
    };
  },
};
