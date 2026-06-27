import { formatPerson } from '../formatters.js';

export default {
  tableName: 'excel_13arrested_24_hrs_list',
  label:     'Arrested - Last 24 Hrs',
  type:      'list',
  num:       13,
  columns:   ['s_no', 'accused_details', 'firdd_no', 'us', 'police_station', 'name_of_io', 'rank_of_io', 'mobile_no_of_io', 'remarks_pc_remand_formal_arrest_bail_etc'],
  columnLabels: {
    police_station: 'Police Station',
    remarks_pc_remand_formal_arrest_bail_etc: 'Remarks (PC Remand / Formal Arrest / Bail etc.)',
  },
  filter: ({ arrests }) => arrests,
  mapRow: (r, idx) => {
    const d = r.data;
    return {
      s_no:            idx + 1,
      accused_details: formatPerson(d.arrested_name, d.age, d.arrested_father_husband_name || d.father_husband_name, d.arrested_address),
      firdd_no:        d.linked_fir_dd_no || d.fir_no || '',
      us:              d.sections || '',
      police_station:  r.ps_name || '',
      name_of_io:      d.io_name || '',
      rank_of_io:      d.rank_of_io || 'Inspector',
      mobile_no_of_io: d.io_mobile || '',
      remarks_pc_remand_formal_arrest_bail_etc: d.status || 'JC',
    };
  },
};
