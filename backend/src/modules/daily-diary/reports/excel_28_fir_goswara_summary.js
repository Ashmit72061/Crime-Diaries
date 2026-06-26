import { isBurglary, isHouseTheft, isOtherTheft, isMvt, isElectronicCase } from '../classifiers.js';

export default {
  tableName: 'excel_28fir_goswara_summary',
  label:     'FIR Goswara Summary',
  type:      'summary',
  num:       28,
  columns:   ['district', 'manual_fir', 'theft_efir', 'house_theft_efir', 'burglary_efir', 'mvt_motor_vehicle_theft', 'total'],
  columnLabels: {
    manual_fir:            'Manual FIR',
    theft_efir:            'Theft E-FIR',
    house_theft_efir:      'House Theft E-FIR',
    burglary_efir:         'Burglary E-FIR',
    mvt_motor_vehicle_theft: 'MVT (Motor Vehicle Theft)',
  },
  summarize: ({ cases, records }) => [{
    district:                records[0]?.district_name || 'District',
    manual_fir:              cases.filter(r => !isElectronicCase(r.data)).length,
    theft_efir:              cases.filter(r => isOtherTheft(r.data)).length,
    house_theft_efir:        cases.filter(r => isHouseTheft(r.data)).length,
    burglary_efir:           cases.filter(r => isBurglary(r.data)).length,
    mvt_motor_vehicle_theft: cases.filter(r => isMvt(r.data)).length,
    total:                   cases.length,
  }],
};
