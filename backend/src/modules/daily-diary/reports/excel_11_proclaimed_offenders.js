import { formatPersonNoAge } from '../formatters.js';

export default {
  tableName: 'excel_11proclaimed_offenders',
  label: 'Proclaimed Offenders',
  type: 'list',
  num: 11,
  columns: ['sn', 'ps', 'dd_nofir_no', 'us', 'po_details', 'case_in_which_declared_po', 'name_of_court_which_declared_po'],
  columnLabels: {
    case_in_which_declared_po: 'Case in Which Declared PO',
    name_of_court_which_declared_po: 'Name of Court Which Declared PO',
  },
  filter: ({ arrests }) => arrests.filter(r => r.data.crime_head === 'PO' || r.data.proclaimed_offender === true),
  mapRow: (r, idx) => {
    const d = r.data;
    return {
      sn: idx + 1,
      ps: r.ps_name || '',
      dd_nofir_no: d.linked_fir_dd_no || d.fir_no || '',
      us: d.sections || '',
      po_details: formatPersonNoAge(d.arrested_name, d.arrested_father_husband_name || d.father_husband_name, d.arrested_address, d),
      case_in_which_declared_po: d.case_declared_po || '',
      name_of_court_which_declared_po: d.court_declared_po || '',
    };
  },
};
