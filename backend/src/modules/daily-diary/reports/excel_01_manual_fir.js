import { formatPerson, formatPersonNoAge } from '../formatters.js';
import { isElectronicCase } from '../classifiers.js';

export default {
  tableName: 'excel_1manual_fir',
  label: 'Manual FIR',
  type: 'list',
  num: 1,
  columns: ['ps', 'fir_no', 'us', 'complainant_details', 'time_of_occurrence', 'place_of_occurrence', 'gist', 'arrested_details'],
  filter: ({ cases }) => cases.filter(r => !isElectronicCase(r.data)),
  mapRow: (r) => {
    const d = r.data;
    return {
      ps: r.ps_name || '',
      fir_no: d.fir_no || '',
      us: d.sections || d.under_section || '',
      complainant_details: formatPersonNoAge(d.complainant_name, d.complainant_father_husband_name || d.father_husband_name, d.complainant_address, d),
      time_of_occurrence: d.occurrence_time || d.gd_time || '',
      place_of_occurrence: d.occurrence_place || '',
      gist: d.brief_facts || '',
      arrested_details: formatPerson(d.arrested_person || d.accused_name, d.age, d.arrested_father_husband_name || d.accused_father_name, d.arrested_address || d.accused_address, d) || 'None',
    };
  },
};
