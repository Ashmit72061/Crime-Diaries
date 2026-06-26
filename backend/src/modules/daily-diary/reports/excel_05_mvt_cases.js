import { formatPersonNoAge, fmtDate } from '../formatters.js';
import { isMvt } from '../classifiers.js';

export default {
  tableName: 'excel_5mvt_cases',
  label:     'MVT Cases',
  type:      'list',
  num:       5,
  columns:   ['sr', 'ps', 'fir_no', 'us', 'date_of_occurrence', 'time_of_occurrence', 'place_of_occurrence', 'complainant_details', 'vehicle_no', 'vehicle_type', 'io_name', 'io_mobile_no', 'beat_no', '1st_cd_uploaded_in_24_hrs_yesno', 'whether_footage_is_collected_or_not'],
  columnLabels: {
    '1st_cd_uploaded_in_24_hrs_yesno': '1st CD Uploaded in 24 Hrs?',
    whether_footage_is_collected_or_not: 'Footage Collected?',
    vehicle_no:   'Vehicle No.',
    vehicle_type: 'Vehicle Type',
  },
  filter: ({ cases }) => cases.filter(r => isMvt(r.data)),
  mapRow: (r, idx) => {
    const d = r.data;
    return {
      sr:                  idx + 1,
      ps:                  r.ps_name || '',
      fir_no:              d.fir_no || '',
      us:                  d.sections || '',
      date_of_occurrence:  fmtDate(d.occurrence_date || r.record_date),
      time_of_occurrence:  d.occurrence_time || d.gd_time || '',
      place_of_occurrence: d.occurrence_place || '',
      complainant_details: formatPersonNoAge(d.complainant_name, d.complainant_father_husband_name, d.complainant_address),
      vehicle_no:          d.vehicle_no || '',
      vehicle_type:        d.vehicle_type || '',
      io_name:             d.io_name || '',
      io_mobile_no:        d.io_mobile || d.io_mobile_no || '',
      beat_no:             d.beat_no || '',
      '1st_cd_uploaded_in_24_hrs_yesno': d.cd_uploaded_24h || 'Yes',
      whether_footage_is_collected_or_not: d.footage_collected || 'Yes',
    };
  },
};
