import { formatPersonNoAge } from '../formatters.js';
import { isHouseTheft } from '../classifiers.js';

export default {
  tableName: 'excel_3ehouse_theft_cases',
  label:     'E-House Theft Cases',
  type:      'list',
  num:       3,
  columns:   ['sr_no', 'ps', 'efir_no', 'us', 'complainant_details', 'place_of_occurrence', 'time_of_occurrence', 'stolen_items', 'place_of_occurrence_1', 'io_name', 'io_mobile_no', 'beat_no'],
  filter: ({ cases }) => cases.filter(r => isHouseTheft(r.data)),
  mapRow: (r, idx) => {
    const d = r.data;
    return {
      sr_no:               idx + 1,
      ps:                  r.ps_name || '',
      efir_no:             d.fir_no || '',
      us:                  d.sections || '',
      complainant_details: formatPersonNoAge(d.complainant_name, d.complainant_father_husband_name, d.complainant_address),
      place_of_occurrence: d.occurrence_place || '',
      time_of_occurrence:  d.occurrence_time || d.gd_time || '',
      stolen_items:        d.property_description || d.stolen_items || 'None',
      place_of_occurrence_1: d.occurrence_place || '',
      io_name:             d.io_name || '',
      io_mobile_no:        d.io_mobile || d.io_mobile_no || '',
      beat_no:             d.beat_no || '',
    };
  },
};
