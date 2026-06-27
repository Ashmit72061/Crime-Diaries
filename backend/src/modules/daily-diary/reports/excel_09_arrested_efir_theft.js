import { formatPerson } from '../formatters.js';

export default {
  tableName: 'excel_9arrested_efir_theft',
  label:     'Arrested - E-FIR Theft',
  type:      'list',
  num:       9,
  columns:   ['sn', 'fir_no', 'us', 'accused_details', 'name_of_io', 'pcjcbail', 'prev_involvement_no_of_cases_head', 'recovery', 'whether_accused_is_bc_or_not', 'group_rolling', 'cycle_patrolling', 'by_antisnatching_team', 'by_prahari', 'by_eyes_ears_scheme_members'],
  columnLabels: {
    prev_involvement_no_of_cases_head: 'Prev. Involvement (No. of Cases) Head',
    group_rolling: 'Group Rolling',
  },
  filter: ({ arrests }) => arrests.filter(r => {
    const s = (r.data.sections || '').toLowerCase();
    const h = (r.data.crime_head || '').toLowerCase();
    return s.includes('379') || h.includes('theft');
  }),
  mapRow: (r, idx) => {
    const d = r.data;
    return {
      sn:                               idx + 1,
      fir_no:                           d.linked_fir_dd_no || d.fir_no || '',
      us:                               d.sections || '',
      accused_details:                  formatPerson(d.arrested_name, d.age, d.arrested_father_husband_name || d.father_husband_name, d.arrested_address),
      name_of_io:                       d.io_name || '',
      pcjcbail:                         d.status || '',
      prev_involvement_no_of_cases_head: d.prev_involvement_head || '0',
      recovery:                         d.recovery || 'No',
      whether_accused_is_bc_or_not:     d.bad_character || 'No',
      group_rolling:                    d.group_rolling || 'No',
      cycle_patrolling:                 d.cycle_patrolling || 'No',
      by_antisnatching_team:            d.by_antisnatching_team || 'No',
      by_prahari:                       d.by_prahari || 'No',
      by_eyes_ears_scheme_members:      d.by_eyes_ears_scheme_members || 'No',
    };
  },
};
