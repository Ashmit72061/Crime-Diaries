// Auto-assembles REPORTS, REPORT_COLUMNS, and COLUMN_LABELS from individual report files.
// To add a new sheet: create its file, import it here, add to the array below. Nothing else.

import { SHARED_COLUMN_LABELS } from '../formatters.js';

import excel01 from './excel_01_manual_fir.js';
import excel02 from './excel_02_eburglary_cases.js';
import excel03 from './excel_03_ehouse_theft_cases.js';
import excel04 from './excel_04_eother_theft_cases.js';
import excel05 from './excel_05_mvt_cases.js';
import excel06 from './excel_06_arrested_all_heads.js';
import excel07 from './excel_07_arrested_east_district.js';
import excel08 from './excel_08_arrested_kalandara.js';
import excel09 from './excel_09_arrested_efir_theft.js';
import excel10 from './excel_10_arrested_efir_mv_theft.js';
import excel11 from './excel_11_proclaimed_offenders.js';
import excel13 from './excel_13_arrested_24_hrs_list.js';
import excel14 from './excel_14_pi_disposal_manual.js';
import excel15 from './excel_15_pi_disposal_eproperty.js';
import excel16 from './excel_16_pi_disposal_emvt.js';
import excel18 from './excel_18_missing_persons.js';
import excel19 from './excel_19_uidb.js';
import excel20 from './excel_20_abandoned_persons.js';
import excel21 from './excel_21_traced_persons.js';
import excel22 from './excel_22_women_missing.js';
import excel23 from './excel_23_children_missing.js';
import excel25 from './excel_25_inquest_registered.js';
import excel26 from './excel_26_inquest_acpsdm_disposal.js';
import excel28 from './excel_28_fir_goswara_summary.js';

// Ordered list of active sheets — sort order = workbook sheet order
export const REPORTS = [
  excel01, excel02, excel03, excel04, excel05,
  excel06, excel07, excel08, excel09, excel10,
  excel11, excel13, excel14, excel15, excel16,
  excel18, excel19, excel20, excel21,
  excel22, excel23,
  excel25, excel26,
  excel28,
].sort((a, b) => a.num - b.num);

// Aggregated column lists — built from each report's own `columns` array
export const REPORT_COLUMNS = Object.fromEntries(
  REPORTS.map(r => [r.tableName, r.columns])
);

// Merged column label overrides: shared base + each report's specific labels (report wins on conflict)
export const COLUMN_LABELS = REPORTS.reduce(
  (acc, r) => ({ ...acc, ...(r.columnLabels || {}) }),
  { ...SHARED_COLUMN_LABELS }
);
