import { fmtDate } from '../formatters.js';
import { isMvt, isDisposed } from '../classifiers.js';

export default {
  tableName: 'excel_16pi_disposal_emvt',
  label:     'PI Disposal - E-MVT',
  type:      'list',
  num:       16,
  columns:   ['s_no', 'fir_no', 'date', 'us', 'rc', 'challan_untrace_cancel'],
  columnLabels: {
    rc: 'RC No.',
  },
  filter: ({ cases }) => cases.filter(r => isMvt(r.data) && isDisposed(r.data)),
  mapRow: (r, idx) => {
    const d = r.data;
    return {
      s_no:                   idx + 1,
      fir_no:                 d.fir_no || '',
      date:                   fmtDate(d.fir_date || r.record_date),
      us:                     d.sections || '',
      rc:                     d.rc_no || 'RC-1',
      challan_untrace_cancel: d.disposal_type || 'Challan',
    };
  },
};
