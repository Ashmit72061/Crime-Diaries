export default {
  tableName: 'excel_23children_missing',
  label:     'Children Missing',
  type:      'summary',
  num:       23,
  columns:   ['pcr_call_male', 'pcr_call_female', 'dd_entrycomplaint_male', 'dd_entrycomplaint_female', 'total_male', 'total_female', 'traced_male', 'traced_female', 'case_registered_male', 'case_registered_female'],
  columnLabels: {
    pcr_call_male:            'PCR Call (Male)',
    pcr_call_female:          'PCR Call (Female)',
    dd_entrycomplaint_male:   'DD Entry / Complaint (Male)',
    dd_entrycomplaint_female: 'DD Entry / Complaint (Female)',
    total_male:               'Total (Male)',
    total_female:             'Total (Female)',
    traced_male:              'Traced (Male)',
    traced_female:            'Traced (Female)',
    case_registered_male:     'Case Registered (Male)',
    case_registered_female:   'Case Registered (Female)',
  },
  summarize: ({ missing }) => {
    const children = missing.filter(r => parseInt(r.data.age, 10) < 18);
    const m = children.filter(r => (r.data.gender || '').toLowerCase() === 'male');
    const f = children.filter(r => (r.data.gender || '').toLowerCase() === 'female');
    const regStatus = ['case registered', 'case_registered'];
    return [{
      pcr_call_male:            m.filter(r => r.data.source === 'PCR').length,
      pcr_call_female:          f.filter(r => r.data.source === 'PCR').length,
      dd_entrycomplaint_male:   m.filter(r => r.data.source !== 'PCR').length,
      dd_entrycomplaint_female: f.filter(r => r.data.source !== 'PCR').length,
      total_male:               m.length,
      total_female:             f.length,
      traced_male:              m.filter(r => (r.data.status || '').toLowerCase() === 'traced').length,
      traced_female:            f.filter(r => (r.data.status || '').toLowerCase() === 'traced').length,
      case_registered_male:     m.filter(r => regStatus.includes((r.data.status || '').toLowerCase())).length,
      case_registered_female:   f.filter(r => regStatus.includes((r.data.status || '').toLowerCase())).length,
    }];
  },
};
