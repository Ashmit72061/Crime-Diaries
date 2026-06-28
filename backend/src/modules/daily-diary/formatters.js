// Shared formatting utilities for daily-diary report files

export const parseJsonField = (val) => {
  if (val === null || val === undefined) return {};
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return {}; }
  }
  return val;
};

// Concatenated person details formatting formula:
// Name + "@ nick_name" + relation_prefix + relation_name + "R/O " + full_address + " Age- " + age + " yrs"
export const formatPerson = (name, age, fatherHusbandName, address, recordData = {}) => {
  let gender = null;
  let relationType = null;
  let nickname = null;
  
  if (recordData && typeof recordData === 'object') {
    const keys = Object.keys(recordData);
    let prefix = '';
    for (const k of keys) {
      if (k.endsWith('_relative_name') && recordData[k] === fatherHusbandName) {
        prefix = k.replace('_relative_name', '');
        break;
      }
      if (k.endsWith('_father_husband_name') && recordData[k] === fatherHusbandName) {
        prefix = k.replace('_father_husband_name', '');
        break;
      }
    }
    
    if (prefix) {
      gender = recordData[`${prefix}_gender`];
      relationType = recordData[`${prefix}_relation_type`] || recordData[`${prefix}_relationship`];
      nickname = recordData[`${prefix}_nickname`] || recordData[`${prefix}_nick_name`];
    }
    
    if (!gender) gender = recordData.gender || recordData.sex || recordData.arrested_gender || recordData.complainant_gender || recordData.accused_gender || recordData.deceased_gender;
    if (!relationType) relationType = recordData.relation_type || recordData.relationship || recordData.arrested_relation_type || recordData.complainant_relation_type || recordData.accused_relation_type || recordData.deceased_relation_type;
    if (!nickname) nickname = recordData.nickname || recordData.nick_name || recordData.arrested_nickname || recordData.complainant_nickname || recordData.accused_nickname;
  }
  
  const parts = [];
  
  // Name + nickname
  let nameStr = name || '';
  if (nickname && nameStr && !nameStr.includes(nickname)) {
    nameStr += ` @ ${nickname}`;
  }
  if (nameStr) parts.push(nameStr);
  
  // Relation
  let relPrefix = 'S/O';
  if (relationType) {
    const relLower = String(relationType).toLowerCase();
    if (relLower === 'husband') relPrefix = 'W/O';
    else if (relLower === 'father' || relLower === 'mother') {
      if (gender && String(gender).toLowerCase() === 'female') relPrefix = 'D/O';
      else relPrefix = 'S/O';
    } else relPrefix = 'C/O';
  } else {
    if (gender && String(gender).toLowerCase() === 'female') relPrefix = 'D/O';
  }
  
  if (fatherHusbandName) {
    parts.push(`${relPrefix} ${fatherHusbandName}`);
  }
  if (address) {
    parts.push(`R/O ${address}`);
  }
  if (age) {
    parts.push(`Age- ${age} yrs`);
  }
  return parts.join(' ') || '';
};

// "Name, S/O Father Name, Address" (no age — complainants, POs, traced persons)
export const formatPersonNoAge = (name, fatherHusbandName, address, recordData = {}) => {
  return formatPerson(name, null, fatherHusbandName, address, recordData);
};

// DD/MM/YYYY from any Date or ISO string
export const fmtDate = (dStr) => {
  if (!dStr) return '';
  if (dStr instanceof Date) {
    return `${String(dStr.getDate()).padStart(2, '0')}/${String(dStr.getMonth() + 1).padStart(2, '0')}/${dStr.getFullYear()}`;
  }
  const parts = String(dStr).split('T')[0].split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return String(dStr);
};

// Column header labels shared across multiple sheets.
// Each report file can add its own labels — the index merges all of them.
export const SHARED_COLUMN_LABELS = {
  // Serial numbers
  sn: 'S.N.', sno: 'S.No.', s_no: 'S. No.', sr_no: 'Sr. No.', sr: 'Sr.',
  // Identifiers
  ps: 'Police Station',
  fir_no: 'FIR No.',
  efir_no: 'E-FIR No.',
  dd_nofir_no: 'DD No./FIR No.',
  firdd_no: 'FIR/DD No.',
  dd_no: 'DD No.',
  dd_date: 'DD Date',
  us: 'U/S',
  // IO fields
  io: 'Name of IO',
  name_of_io: 'Name of IO',
  io_name: 'IO Name',
  io_mobile_no: 'IO Mobile No.',
  rank_of_io: 'Rank of IO',
  mobile_no_of_io: 'Mobile No. of IO',
  // Combined person-detail columns
  complainant_details: 'Complainant (Name / S/O / Address)',
  arrested_details: 'Arrested Person (Name / Age / S/O / Address)',
  accused_details: 'Accused (Name / Age / S/O / Address)',
  po_details: 'PO Details (Name / S/O / Address)',
  deceased_details: 'Deceased (Name / Age / S/O / Address)',
  traced_person_details: 'Traced Person (Name / S/O / Address)',
  // Occurrence
  place_of_occurrence: 'Place of Occurrence',
  place_of_occurrence_1: 'Place of Occurrence (2)',
  time_of_occurrence: 'Time of Occurrence',
  date_of_occurrence: 'Date of Occurrence',
  // Common operational fields
  pcjcbail: 'PC/JC/Bail',
  recovery: 'Recovery',
  beat_no: 'Beat No.',
  stolen_items: 'Stolen Items',
  cause_of_death: 'Cause of Death',
  challan_untrace_cancel: 'Challan / Untrace / Cancel',
  name_of_operator_to_whom_mps: 'Name of Operator (MPS)',
  found_place: 'Found Place',
  found_date: 'Found Date',
  // Missing-person physical description
  upper_dress_color: 'Upper Dress Color',
  lower_dress_color: 'Lower Dress Color',
  // Arrest-specific
  prev_involvement_no_of_cases: 'Prev. Involvement (No. of Cases)',
  whether_accused_is_bc_or_not: 'Accused BC?',
  group_patrolling: 'Group Patrolling',
  cycle_patrolling: 'Cycle Patrolling',
  by_antisnatching_team: 'By Anti-Snatching Team',
  by_prahari: 'By Prahari',
  by_eyes_ears_scheme_members: 'By Eyes & Ears Scheme Members',
  // Summary-sheet columns
  pcr_call: 'PCR Call',
};
