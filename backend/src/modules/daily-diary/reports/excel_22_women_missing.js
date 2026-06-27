export default {
  tableName: 'excel_22women_missing',
  label:     'Women Missing',
  type:      'summary',
  num:       22,
  columns:   ['pcr_call', 'dd_entry_complaint', 'total', 'traced', 'case_registered', 'pending'],
  columnLabels: {
    dd_entry_complaint: 'DD Entry / Complaint',
    case_registered:    'Case Registered',
    pending:            'Pending',
    total:              'Total',
    traced:             'Traced',
  },
  summarize: ({ missing }) => {
    const female    = missing.filter(r => (r.data.gender || '').toLowerCase() === 'female');
    const traced    = female.filter(r => (r.data.status || '').toLowerCase() === 'traced').length;
    const regStatus = ['case registered', 'case_registered'];
    return [{
      pcr_call:           female.filter(r => r.data.source === 'PCR').length,
      dd_entry_complaint: female.filter(r => r.data.source !== 'PCR').length,
      total:              female.length,
      traced,
      case_registered:    female.filter(r => regStatus.includes((r.data.status || '').toLowerCase())).length,
      pending:            female.filter(r => (r.data.status || '').toLowerCase() === 'missing').length,
    }];
  },
};
