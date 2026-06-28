import { formatPerson } from '../formatters.js';

export default {
  tableName: 'excel_7arrested_east_district',
  label: 'Arrested - District',
  type: 'list',
  num: 7,
  columns: ['sn', 'fir_no', 'us', 'accused_details', 'name_of_io', 'pcjcbail', 'prev_involvement_no_of_cases', 'recovery', 'whether_accused_is_bc_or_not', 'integrated_pi', 'group_patrolling', 'cycle_patrolling', 'by_antisnatching_team', 'by_prahari', 'by_eyes_ears_scheme_members'],
  columnLabels: {
    integrated_pi: 'Integrated PI',
  },
  filter: ({ arrests }) => arrests,
  mapRow: (r, idx) => {
    const d = r.data;
    return {
      sn: idx + 1,
      fir_no: d.linked_fir_dd_no || d.fir_no || '',
      us: d.sections || '',
      accused_details: formatPerson(d.arrested_name, d.age, d.arrested_father_husband_name || d.father_husband_name, d.arrested_address, d),
      name_of_io: d.io_name || '',
      pcjcbail: d.status || '',
      prev_involvement_no_of_cases: d.prev_involvement || '0',
      recovery: d.recovery || 'No',
      whether_accused_is_bc_or_not: d.bad_character || 'No',
      integrated_pi: d.integrated_pi || 'No',
      group_patrolling: d.group_patrolling || 'No',
      cycle_patrolling: d.cycle_patrolling || 'No',
      by_antisnatching_team: d.by_antisnatching_team || 'No',
      by_prahari: d.by_prahari || 'No',
      by_eyes_ears_scheme_members: d.by_eyes_ears_scheme_members || 'No',
    };
  },
};
