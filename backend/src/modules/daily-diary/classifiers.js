// Record-type classifiers — used by report files to filter relevant records.
// All functions receive the record's parsed `data` JSONB object.

const head = (d) => (d.local_head || d.case_head || d.crime_head || '').toLowerCase();
const sec  = (d) => (d.sections || '').toLowerCase();
const act  = (d) => (d.act_name || '').toLowerCase();

export const isBurglary     = (d) => head(d).includes('burglary');
export const isHouseTheft   = (d) => head(d).includes('house theft');
export const isMvt          = (d) => head(d).includes('mvt') || head(d).includes('mvct') || head(d).includes('vehicle');
export const isOtherTheft   = (d) => head(d).includes('theft') && !isHouseTheft(d) && !isMvt(d) && !head(d).includes('mobile');
export const isElectronicCase = (d) => isBurglary(d) || isHouseTheft(d) || isOtherTheft(d) || isMvt(d);
export const isInquestCase  = (d) => head(d).includes('inquest');
export const isNdpsCase     = (d) => head(d).includes('ndps') || act(d).includes('ndps');
export const isMobileRecoveryCase = (d) => head(d).includes('mobile') || head(d).includes('phone') || head(d).includes('recovery');

export const isImportantCase = (d) =>
  d.important === true || d.is_important === true ||
  ['murder', 'robbery', 'dacoity', 'rape', 'pocso', 'sensitive'].some(k => head(d).includes(k));

export const isPreventiveArrest = (d) =>
  head(d).includes('preventive') || act(d).includes('preventive') ||
  ['107', '109', '110', '151', '126', '128', '129', 'dp act'].some(k => sec(d).includes(k));

export const isFinancialFraudArrest = (d) =>
  ['fraud', 'cyber', 'cheating'].some(k => head(d).includes(k)) || sec(d).includes('420');

export const isDisposed = (d) =>
  ['chargesheeted', 'closed'].includes((d.status || '').toLowerCase());
