import { fmtDate } from '../formatters.js';
import { isBurglary, isHouseTheft, isOtherTheft, isDisposed } from '../classifiers.js';

export default {
  tableName: 'excel_15pi_disposal_eproperty',
  label:     'PI Disposal - E-Property',
  type:      'list',
  num:       15,
  columns:   ['s_no', 'fir_no', 'date', 'us', 'rc', 'challan_untrace_cancel'],
  columnLabels: {
    rc: 'RC No.',
  },
  filter: ({ cases }) => cases.filter(r => (isBurglary(r.data) || isHouseTheft(r.data) || isOtherTheft(r.data)) && isDisposed(r.data)),
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
