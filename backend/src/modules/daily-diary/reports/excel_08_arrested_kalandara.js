import { formatPerson } from '../formatters.js';
import { isPreventiveArrest } from '../classifiers.js';

export default {
  tableName: 'excel_8arrested_kalandara',
  label: 'Arrested - Kalandara / Preventive',
  type: 'list',
  num: 8,
  columns: ['sn', 'fir_no', 'us', 'accused_details', 'place_of_occurrence', 'io', 'pcjcbail', 'prev_involvement', 'recovery', 'whether_accused_is_bc_or_not', 'integrated_pick', 'group_patrolling', 'cycle_patrolling', 'by_antisnatching_team', 'by_prahari', 'by_eyes_ears_scheme_members'],
  columnLabels: {
    prev_involvement: 'Prev. Involvement',
    integrated_pick: 'Integrated Pick',
  },
  filter: ({ arrests }) => arrests.filter(r => isPreventiveArrest(r.data)),
  mapRow: (r, idx) => {
    const d = r.data;
    return {
      sn: idx + 1,
      fir_no: d.linked_fir_dd_no || d.fir_no || '',
      us: d.sections || '',
      accused_details: formatPerson(d.arrested_name, d.age, d.arrested_father_husband_name || d.father_husband_name, d.arrested_address, d),
      place_of_occurrence: d.arrest_place || '',
      io: d.io_name || '',
      pcjcbail: d.status || '',
      prev_involvement: d.prev_involvement || '0',
      recovery: d.recovery || 'No',
      whether_accused_is_bc_or_not: d.bad_character || 'No',
      integrated_pick: d.integrated_pick || 'No',
      group_patrolling: d.group_patrolling || 'No',
      cycle_patrolling: d.cycle_patrolling || 'No',
      by_antisnatching_team: d.by_antisnatching_team || 'No',
      by_prahari: d.by_prahari || 'No',
      by_eyes_ears_scheme_members: d.by_eyes_ears_scheme_members || 'No',
    };
  },
};
