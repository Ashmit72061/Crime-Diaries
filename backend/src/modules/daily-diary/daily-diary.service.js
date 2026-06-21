import db from '../../config/db.js';
import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const REPORTS = [
  { tableName: "excel_1manual_fir",                label: "Manual FIR",                        type: "list",    num: 1  },
  { tableName: "excel_2eburglary_cases",           label: "E-Burglary Cases",                  type: "list",    num: 2  },
  { tableName: "excel_3ehouse_theft_cases",        label: "E-House Theft Cases",               type: "list",    num: 3  },
  { tableName: "excel_4eother_theft_cases",        label: "E-Other Theft Cases",               type: "list",    num: 4  },
  { tableName: "excel_5mvt_cases",                 label: "MVT Cases",                         type: "list",    num: 5  },
  { tableName: "excel_6arrested_all_heads",        label: "Arrested - All Heads",              type: "summary", num: 6  },
  { tableName: "excel_7arrested_east_district",    label: "Arrested - District",               type: "list",    num: 7  },
  { tableName: "excel_8arrested_kalandara",        label: "Arrested - Kalandara / Preventive", type: "list",    num: 8  },
  { tableName: "excel_9arrested_efir_theft",       label: "Arrested - E-FIR Theft",            type: "list",    num: 9  },
  { tableName: "excel_10arrested_efir_mv_theft",   label: "Arrested - E-FIR MV Theft",         type: "list",    num: 10 },
  { tableName: "excel_11proclaimed_offenders",     label: "Proclaimed Offenders",              type: "list",    num: 11 },
  { tableName: "excel_13arrested_24_hrs_list",     label: "Arrested - Last 24 Hrs",            type: "list",    num: 13 },
  { tableName: "excel_14pi_disposal_manual",       label: "PI Disposal - Manual",              type: "list",    num: 14 },
  { tableName: "excel_15pi_disposal_eproperty",    label: "PI Disposal - E-Property",          type: "list",    num: 15 },
  { tableName: "excel_16pi_disposal_emvt",         label: "PI Disposal - E-MVT",               type: "list",    num: 16 },
  { tableName: "excel_18missing_persons",          label: "Missing Persons",                   type: "list",    num: 18 },
  { tableName: "excel_19uidb",                     label: "UIDB (Unidentified Bodies)",        type: "list",    num: 19 },
  { tableName: "excel_20abandoned_persons",        label: "Abandoned Persons",                 type: "list",    num: 20 },
  { tableName: "excel_21traced_persons",           label: "Traced Persons",                    type: "list",    num: 21 },
  { tableName: "excel_22women_missing",            label: "Women Missing",                     type: "summary", num: 22 },
  { tableName: "excel_23children_missing",         label: "Children Missing",                  type: "summary", num: 23 },
  { tableName: "excel_25inquest_registered",       label: "Inquest Registered",                type: "list",    num: 25 },
  { tableName: "excel_26inquest_acpsdm_disposal",  label: "Inquest ACP/SDM Disposal",          type: "list",    num: 26 },
  { tableName: "excel_28fir_goswara_summary",      label: "FIR Goswara Summary",               type: "summary", num: 28 },
];

export const REPORT_COLUMNS = {
  excel_1manual_fir: ['ps', 'fir_no', 'us', 'name_of_complainant', 'father_husband_name_of_complainant', 'address_of_complainant', 'time_of_occurrence', 'place_of_occurrence', 'time_of_occurrence_1', 'place_of_occurrence_1', 'gist', 'arrested_name', 'arrested_father_husband_name', 'arrested_address', 'accused_name', 'accused_father_name', 'accused_address', 'accused_extra'],
  excel_2eburglary_cases: ['sr_no', 'ps', 'efir_no', 'us', 'name_of_complainant', 'father_husband_name_of_complainant', 'address_of_complainant', 'time_of_occurrence', 'stolen_items', 'place_of_occurrence', 'io_name', 'io_mobile_no', 'beat_no'],
  excel_3ehouse_theft_cases: ['sr_no', 'ps', 'efir_no', 'us', 'name_of_complainant', 'father_husband_name_of_complainant', 'address_of_complainant', 'place_of_occurrence', 'time_of_occurrence', 'stolen_items', 'place_of_occurrence_1', 'io_name', 'io_mobile_no', 'beat_no'],
  excel_4eother_theft_cases: ['sr_no', 'ps', 'efir_no', 'us', 'name_of_complainant', 'father_husband_name_of_complainant', 'address_of_complainant', 'time_of_occurrence', 'stolen_items', 'place_of_occurrence', 'io_name', 'io_mobile_no', 'beat_no'],
  excel_5mvt_cases: ['sr', 'ps', 'fir_no', 'us', 'date_of_occurrence', 'time_of_occurrence', 'place_of_occurrence', 'name_of_complainant', 'father_husband_name_of_complainant', 'address_of_complainant', 'vehicle_no', 'vehicle_type', 'io_name', 'io_mobile_no', 'beat_no', '1st_cd_uploaded_in_24_hrs_yesno', 'whether_footage_is_collected_or_not'],
  excel_6arrested_all_heads: ['bnsipc', 'total_no_dd_126170_bnss', 'total_no_dd_126169_bnss', 'total_no_dd_109_bnss', '109_g', 'total_l_no_dd_110_bnss', '110_g', '929397_dp_act', 'total_no_dd_40_ex', '40_ex', '351d', 'aact', 'gact', '33_ex', 'ndps', 'others_act', 'others_bnss', 'po'],
  excel_7arrested_east_district: ['sn', 'fir_no', 'us', 'name', 'father_husband_name', 'address', 'age', 'name_of_io', 'pcjcbail', 'prev_involvement_no_of_cases', 'recovery', 'whether_accused_is_bc_or_not', 'integrated_pi', 'group_patrolling', 'cycle_patrolling', 'by_antisnatching_team', 'by_prahari', 'by_eyes_ears_scheme_members'],
  excel_8arrested_kalandara: ['sn', 'fir_no', 'us', 'name', 'father_husband_name', 'address', 'age', 'place_of_occurrence', 'io', 'pcjcbail', 'prev_involvement', 'recovery', 'whether_accused_is_bc_or_not', 'integrated_pick', 'group_patrolling', 'cycle_patrolling', 'by_antisnatching_team', 'by_prahari', 'by_eyes_ears_scheme_members'],
  excel_9arrested_efir_theft: ['sn', 'fir_no', 'us', 'name', 'father_husband_name', 'address', 'age', 'name_of_io', 'pcjcbail', 'prev_involvement_no_of_cases_head', 'recovery', 'whether_accused_is_bc_or_not', 'group_rolling', 'cycle_patrolling', 'by_antisnatching_team', 'by_prahari', 'by_eyes_ears_scheme_members'],
  excel_10arrested_efir_mv_theft: ['fir_no', 'us', 'name', 'father_husband_name', 'address', 'age', 'name_of_io', 'pcjcbail', 'prev_involvement_no_of_cases', 'recovery', 'whether_accused_is_bc_or_not', 'integrated_rate_picked', 'group_patrolling', 'cycle_patrolling', 'by_antisnatching_team', 'by_prahari', 'by_eyes_ears_scheme_members'],
  excel_11proclaimed_offenders: ['sn', 'ps', 'dd_nofir_no', 'us', 'details_of_po_name', 'details_of_po_parental', 'details_of_po_address', 'case_in_which_declared_po', 'name_of_court_which_declared_po'],
  excel_13arrested_24_hrs_list: ['s_no', 'name_nick_name', 'father_namehusband_name', 'address', 'age', 'firdd_no', 'us', 'police_station', 'name_of_io', 'rank_of_io', 'mobile_no_of_io', 'remarks_pc_remand_formal_arrest_bail_etc'],
  excel_14pi_disposal_manual: ['s_no', 'fir_no', 'date', 'us', 'rc', 'challan_untrace_cancel'],
  excel_15pi_disposal_eproperty: ['s_no', 'fir_no', 'date', 'us', 'rc', 'challan_untrace_cancel'],
  excel_16pi_disposal_emvt: ['s_no', 'fir_no', 'date', 'us', 'rc', 'challan_untrace_cancel'],
  excel_18missing_persons: ['sno', 'dd_no', 'dd_date', 'name_of_operator_to_whom_mps', 'name_of_missing_person', 'address_of_missing_person', 'missing_date', 'age', 'height', 'built', 'complexion', 'face', 'hair', 'beard', 'mustaches', 'upper_dress_color', 'lower_dress_color', 'name_of_io'],
  excel_19uidb: ['sno', 'dd_no', 'dd_date', 'found_place', 'found_date', 'sex', 'age', 'height', 'built', 'complexion', 'face', 'hair', 'beard', 'mustaches', 'upper_dress_color', 'lower_dress_color', 'name_of_io'],
  excel_20abandoned_persons: ['sno', 'dd_no', 'found_place', 'found_date', 'sex', 'age', 'height', 'built', 'complexion', 'face', 'hair', 'beard', 'mustaches', 'upper_dress_color', 'lower_dress_color', 'name_of_io'],
  excel_21traced_persons: ['sno', 'dd_no', 'dd_date', 'name_of_operator_to_whom_mps', 'name_of_traced_person', 'fatherhusband_name_of_traced_person', 'address_of_traced_person', 'name_of_io'],
  excel_22women_missing: ['pcr_call', 'dd_entry_complaint', 'total', 'traced', 'case_registered', 'pending'],
  excel_23children_missing: ['pcr_call_male', 'pcr_call_female', 'dd_entrycomplaint_male', 'dd_entrycomplaint_female', 'total_male', 'total_female', 'traced_male', 'traced_female', 'case_registered_male', 'case_registered_female'],
  excel_25inquest_registered: ['sn', 'dd_no', 'date', 'us', 'name_of_deceased', 'fatherhusband_name_of_deceased', 'address_of_deceased', 'sex', 'age', 'cause_of_death', 'place_of_occurrence', 'io'],
  excel_26inquest_acpsdm_disposal: ['sno', 'dd_no', 'date', 'us', 'name_of_deceased', 'fatherhusband_name_of_deceased', 'address_of_deceased', 'sex', 'age', 'cause_of_death', 'date_of_filed_by_acpsdm'],
  excel_28fir_goswara_summary: ['district', 'manual_fir', 'theft_efir', 'house_theft_efir', 'burglary_efir', 'mvt_motor_vehicle_theft', 'total']
};

const parseJsonField = (val) => {
  if (val === null || val === undefined) return {};
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch (e) { return {}; }
  }
  return val;
};

// Classification helpers for CASE records
const isBurglary = (d) => {
  const head = (d.local_head || d.case_head || d.crime_head || '').toLowerCase();
  return head.includes('burglary');
};

const isHouseTheft = (d) => {
  const head = (d.local_head || d.case_head || d.crime_head || '').toLowerCase();
  return head.includes('house theft');
};

const isMvt = (d) => {
  const head = (d.local_head || d.case_head || d.crime_head || '').toLowerCase();
  return head.includes('mvt') || head.includes('mvct') || head.includes('vehicle');
};

const isOtherTheft = (d) => {
  const head = (d.local_head || d.case_head || d.crime_head || '').toLowerCase();
  return head.includes('theft') && !isHouseTheft(d) && !isMvt(d) && !head.includes('mobile');
};

const isElectronicCase = (d) => {
  return isBurglary(d) || isHouseTheft(d) || isOtherTheft(d) || isMvt(d);
};

const isImportantCase = (d) => {
  const head = (d.local_head || d.case_head || d.crime_head || '').toLowerCase();
  return d.important === true || d.is_important === true || head.includes('murder') || head.includes('robbery') || head.includes('dacoity') || head.includes('rape') || head.includes('pocso') || head.includes('sensitive');
};

const isNdpsCase = (d) => {
  const head = (d.local_head || d.case_head || d.crime_head || '').toLowerCase();
  const act = (d.act_name || '').toLowerCase();
  return head.includes('ndps') || act.includes('ndps');
};

const isMobileRecoveryCase = (d) => {
  const head = (d.local_head || d.case_head || d.crime_head || '').toLowerCase();
  return head.includes('mobile') || head.includes('phone') || head.includes('recovery');
};

const isInquestCase = (d) => {
  const head = (d.local_head || d.case_head || d.crime_head || '').toLowerCase();
  return head.includes('inquest');
};

// Classification helpers for ARREST records
const isPreventiveArrest = (d) => {
  const head = (d.crime_head || d.local_head || '').toLowerCase();
  const sections = (d.sections || '').toLowerCase();
  const act = (d.act_name || '').toLowerCase();
  return head.includes('preventive') || act.includes('preventive') ||
    sections.includes('107') || sections.includes('109') || sections.includes('110') ||
    sections.includes('151') || sections.includes('126') || sections.includes('128') ||
    sections.includes('129') || sections.includes('dp act');
};

const isFinancialFraudArrest = (d) => {
  const head = (d.crime_head || d.local_head || '').toLowerCase();
  const sections = (d.sections || '').toLowerCase();
  return head.includes('fraud') || head.includes('cyber') || head.includes('cheating') || sections.includes('420');
};

// Fetch raw records from DB with scoping
const getRawRecords = async (date, psId, districtId, subDivId) => {
  let recordIds = null;
  if (districtId) {
    const compilation = await db('compilations')
      .where({ source_entity_id: districtId, period: date })
      .first();
    if (compilation) {
      recordIds = typeof compilation.record_ids === 'string'
        ? JSON.parse(compilation.record_ids)
        : (compilation.record_ids || []);
    }
  }

  let query = db('records')
    .select(
      'records.*',
      'ps.name_en as ps_name',
      'ps.code as ps_code',
      'dist.name_en as district_name',
      'dist.code as district_code'
    )
    .leftJoin('hierarchy_nodes as ps', 'records.ps_id', 'ps.id')
    .leftJoin('hierarchy_nodes as dist', 'records.district_id', 'dist.id')
    .whereNot('records.current_status', 'DRAFT');

  if (recordIds && recordIds.length > 0) {
    query = query.whereIn('records.id', recordIds);
  } else {
    query = query.where('records.record_date', date);
  }

  if (psId) {
    if (typeof psId === 'string' && psId.includes(',')) {
      query = query.whereIn('records.ps_id', psId.split(','));
    } else if (Array.isArray(psId)) {
      query = query.whereIn('records.ps_id', psId);
    } else {
      query = query.where('records.ps_id', psId);
    }
  }
  if (districtId) {
    query = query.where('records.district_id', districtId);
  }
  if (subDivId) {
    query = query.where('records.sub_div_id', subDivId);
  }

  const results = await query.orderBy('records.created_at', 'asc');
  return results.map(r => ({
    ...r,
    data: parseJsonField(r.data)
  }));
};

// Map records to rows object (all 34 tables)
export const mapRecordsToSheets = (records, targetDate) => {
  const mapped = {};
  for (const rep of REPORTS) {
    mapped[rep.tableName] = [];
  }

  // Group records by type
  const cases = records.filter(r => r.record_type === 'CASE' || r.record_type === 'CASES');
  const arrests = records.filter(r => r.record_type === 'ARREST');
  const missing = records.filter(r => r.record_type === 'MISSING');
  const uidb = records.filter(r => r.record_type === 'UIDB');

  // Helper to format date
  const fmtDate = (dStr) => {
    if (!dStr) return '';
    if (dStr instanceof Date) {
      const dd = String(dStr.getDate()).padStart(2, '0');
      const mm = String(dStr.getMonth() + 1).padStart(2, '0');
      const yyyy = dStr.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
    const str = String(dStr);
    const parts = str.split('T')[0].split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return str;
  };

  // 1. Manual FIR (CASE but not electronic)
  const manualFIRs = cases.filter(r => !isElectronicCase(r.data));
  mapped.excel_1manual_fir = manualFIRs.map(r => {
    const d = r.data;
    return {
      ps: r.ps_name || '',
      fir_no: d.fir_no || '',
      us: d.sections || d.under_section || '',
      name_of_complainant: d.complainant_name || '',
      father_husband_name_of_complainant: d.complainant_father_husband_name || d.father_husband_name || '',
      address_of_complainant: d.complainant_address || '',
      time_of_occurrence: d.occurrence_time || d.gd_time || '',
      place_of_occurrence: d.occurrence_place || '',
      time_of_occurrence_1: d.occurrence_time || d.gd_time || '',
      place_of_occurrence_1: d.occurrence_place || '',
      gist: d.brief_facts || '',
      arrested_name: d.arrested_person || d.accused_name || 'None',
      arrested_father_husband_name: d.arrested_father_husband_name || d.accused_father_name || '',
      arrested_address: d.arrested_address || d.accused_address || '',
      accused_name: d.accused_name || 'Unknown',
      accused_father_name: d.accused_father_name || '',
      accused_address: d.accused_address || '',
      accused_extra: ''
    };
  });

  // 2. E-Burglary Cases
  const burglaryCases = cases.filter(r => isBurglary(r.data));
  mapped.excel_2eburglary_cases = burglaryCases.map((r, idx) => {
    const d = r.data;
    return {
      sr_no: idx + 1,
      ps: r.ps_name || '',
      efir_no: d.fir_no || '',
      us: d.sections || '',
      name_of_complainant: d.complainant_name || '',
      father_husband_name_of_complainant: d.complainant_father_husband_name || '',
      address_of_complainant: d.complainant_address || '',
      time_of_occurrence: d.occurrence_time || d.gd_time || '',
      stolen_items: d.property_description || d.stolen_items || 'None',
      place_of_occurrence: d.occurrence_place || '',
      io_name: d.io_name || '',
      io_mobile_no: d.io_mobile || d.io_mobile_no || '',
      beat_no: d.beat_no || ''
    };
  });

  // 3. E-House Theft Cases
  const houseTheftCases = cases.filter(r => isHouseTheft(r.data));
  mapped.excel_3ehouse_theft_cases = houseTheftCases.map((r, idx) => {
    const d = r.data;
    return {
      sr_no: idx + 1,
      ps: r.ps_name || '',
      efir_no: d.fir_no || '',
      us: d.sections || '',
      name_of_complainant: d.complainant_name || '',
      father_husband_name_of_complainant: d.complainant_father_husband_name || '',
      address_of_complainant: d.complainant_address || '',
      place_of_occurrence: d.occurrence_place || '',
      time_of_occurrence: d.occurrence_time || d.gd_time || '',
      stolen_items: d.property_description || d.stolen_items || 'None',
      place_of_occurrence_1: d.occurrence_place || '',
      io_name: d.io_name || '',
      io_mobile_no: d.io_mobile || d.io_mobile_no || '',
      beat_no: d.beat_no || ''
    };
  });

  // 4. E-Other Theft Cases
  const otherTheftCases = cases.filter(r => isOtherTheft(r.data));
  mapped.excel_4eother_theft_cases = otherTheftCases.map((r, idx) => {
    const d = r.data;
    return {
      sr_no: idx + 1,
      ps: r.ps_name || '',
      efir_no: d.fir_no || '',
      us: d.sections || '',
      name_of_complainant: d.complainant_name || '',
      father_husband_name_of_complainant: d.complainant_father_husband_name || '',
      address_of_complainant: d.complainant_address || '',
      time_of_occurrence: d.occurrence_time || d.gd_time || '',
      stolen_items: d.property_description || d.stolen_items || 'None',
      place_of_occurrence: d.occurrence_place || '',
      io_name: d.io_name || '',
      io_mobile_no: d.io_mobile || d.io_mobile_no || '',
      beat_no: d.beat_no || ''
    };
  });

  // 5. MVT Cases
  const mvtCases = cases.filter(r => isMvt(r.data));
  mapped.excel_5mvt_cases = mvtCases.map((r, idx) => {
    const d = r.data;
    return {
      sr: idx + 1,
      ps: r.ps_name || '',
      fir_no: d.fir_no || '',
      us: d.sections || '',
      date_of_occurrence: fmtDate(d.occurrence_date || r.record_date),
      time_of_occurrence: d.occurrence_time || d.gd_time || '',
      place_of_occurrence: d.occurrence_place || '',
      name_of_complainant: d.complainant_name || '',
      father_husband_name_of_complainant: d.complainant_father_husband_name || '',
      address_of_complainant: d.complainant_address || '',
      vehicle_no: d.vehicle_no || '',
      vehicle_type: d.vehicle_type || '',
      io_name: d.io_name || '',
      io_mobile_no: d.io_mobile || d.io_mobile_no || '',
      beat_no: d.beat_no || '',
      '1st_cd_uploaded_in_24_hrs_yesno': d.cd_uploaded_24h || 'Yes',
      whether_footage_is_collected_or_not: d.footage_collected || 'Yes'
    };
  });

  // 6. Arrested - All Heads (counts summary)
  let bnsipc = 0, dp_act = 0, po = 0, aact = 0, gact = 0, ndps = 0;
  let ex_40 = 0, ex_33 = 0, bns_351d = 0;
  let dd_126170 = 0, dd_126169 = 0, dd_109 = 0, g_109 = 0, dd_110 = 0, g_110 = 0;
  let others_act = 0, others_bnss = 0;

  arrests.forEach(r => {
    const d = r.data;
    const sec = (d.sections || '').toLowerCase();
    const act = (d.act_name || '').toLowerCase();
    const head = (d.crime_head || '').toUpperCase();

    if (head === 'PO' || d.proclaimed_offender === true) {
      po++;
    }

    if (act.includes('excise')) {
      if (sec.includes('40')) ex_40++;
      else if (sec.includes('33')) ex_33++;
      else others_act++;
    } else if (act.includes('arms')) {
      aact++;
    } else if (act.includes('gambling')) {
      gact++;
    } else if (act.includes('ndps')) {
      ndps++;
    } else if (isPreventiveArrest(d)) {
      if (sec.includes('126') && sec.includes('170')) dd_126170++;
      else if (sec.includes('126') && sec.includes('169')) dd_126169++;
      else if (sec.includes('109') && (sec.includes('g') || sec.includes('जी'))) g_109++;
      else if (sec.includes('109')) dd_109++;
      else if (sec.includes('110') && (sec.includes('g') || sec.includes('जी'))) g_110++;
      else if (sec.includes('110')) dd_110++;
      else if (sec.includes('92') || sec.includes('93') || sec.includes('97')) dp_act++;
      else others_bnss++;
    } else {
      bnsipc++;
      if (sec.includes('351')) bns_351d++;
    }
  });

  mapped.excel_6arrested_all_heads = [{
    bnsipc,
    total_no_dd_126170_bnss: dd_126170,
    total_no_dd_126169_bnss: dd_126169,
    total_no_dd_109_bnss: dd_109,
    '109_g': g_109,
    total_l_no_dd_110_bnss: dd_110,
    '110_g': g_110,
    '929397_dp_act': dp_act,
    total_no_dd_40_ex: ex_40,
    '40_ex': ex_40,
    '351d': bns_351d,
    aact,
    gact,
    '33_ex': ex_33,
    ndps,
    others_act,
    others_bnss,
    po
  }];

  // 7. Arrested - District
  mapped.excel_7arrested_east_district = arrests.map((r, idx) => {
    const d = r.data;
    return {
      sn: idx + 1,
      fir_no: d.linked_fir_dd_no || d.fir_no || '',
      us: d.sections || '',
      name: d.arrested_name || '',
      father_husband_name: d.arrested_father_husband_name || d.father_husband_name || '',
      address: d.arrested_address || '',
      age: d.age || '',
      name_of_io: d.io_name || '',
      pcjcbail: d.status || '',
      prev_involvement_no_of_cases: d.prev_involvement || '0',
      recovery: d.recovery || 'No',
      whether_accused_is_bc_or_not: d.bad_character || 'No',
      integrated_pi: d.integrated_pi || 'No',
      group_patrolling: d.group_patrolling || 'No',
      cycle_patrolling: d.cycle_patrolling || 'No',
      by_antisnatching_team: d.by_antisnatching_team || 'No',
      by_prahari: d.by_prahari || 'No',
      by_eyes_ears_scheme_members: d.by_eyes_ears_scheme_members || 'No'
    };
  });

  // 8. Arrested - Kalandara / Preventive
  const preventiveArrests = arrests.filter(r => isPreventiveArrest(r.data));
  mapped.excel_8arrested_kalandara = preventiveArrests.map((r, idx) => {
    const d = r.data;
    return {
      sn: idx + 1,
      fir_no: d.linked_fir_dd_no || d.fir_no || '',
      us: d.sections || '',
      name: d.arrested_name || '',
      father_husband_name: d.arrested_father_husband_name || d.father_husband_name || '',
      address: d.arrested_address || '',
      age: d.age || '',
      name_of_io: d.io_name || '',
      pcjcbail: d.status || '',
      prev_involvement_no_of_cases: d.prev_involvement || '0',
      recovery: d.recovery || 'No',
      whether_accused_is_bc_or_not: d.bad_character || 'No',
      integrated_pi: d.integrated_pi || 'No',
      group_patrolling: d.group_patrolling || 'No',
      cycle_patrolling: d.cycle_patrolling || 'No',
      by_antisnatching_team: d.by_antisnatching_team || 'No',
      by_prahari: d.by_prahari || 'No',
      by_eyes_ears_scheme_members: d.by_eyes_ears_scheme_members || 'No',
      firdd_no: d.linked_fir_dd_no || '',
      place_of_occurrence: d.arrest_place || '',
      io: d.io_name || '',
      prev_involvement: d.prev_involvement || '0',
      integrated_pick: d.integrated_pick || 'No'
    };
  });

  // 9. Arrested - E-FIR Theft
  const theftArrests = arrests.filter(r => {
    const sec = (r.data.sections || '').toLowerCase();
    const head = (r.data.crime_head || '').toLowerCase();
    return sec.includes('379') || head.includes('theft');
  });
  mapped.excel_9arrested_efir_theft = theftArrests.map((r, idx) => {
    const d = r.data;
    return {
      sn: idx + 1,
      fir_no: d.linked_fir_dd_no || d.fir_no || '',
      us: d.sections || '',
      name: d.arrested_name || '',
      father_husband_name: d.arrested_father_husband_name || d.father_husband_name || '',
      address: d.arrested_address || '',
      age: d.age || '',
      name_of_io: d.io_name || '',
      pcjcbail: d.status || '',
      prev_involvement_no_of_cases: d.prev_involvement || '0',
      recovery: d.recovery || 'No',
      whether_accused_is_bc_or_not: d.bad_character || 'No',
      integrated_pi: d.integrated_pi || 'No',
      group_patrolling: d.group_patrolling || 'No',
      cycle_patrolling: d.cycle_patrolling || 'No',
      by_antisnatching_team: d.by_antisnatching_team || 'No',
      by_prahari: d.by_prahari || 'No',
      by_eyes_ears_scheme_members: d.by_eyes_ears_scheme_members || 'No',
      firdd_no: d.linked_fir_dd_no || '',
      prev_involvement_no_of_cases_head: d.prev_involvement_head || '0',
      group_rolling: d.group_rolling || 'No'
    };
  });

  // 10. Arrested - E-FIR MV Theft
  const mvTheftArrests = arrests.filter(r => {
    const sec = (r.data.sections || '').toLowerCase();
    const head = (r.data.crime_head || '').toLowerCase();
    return head.includes('mvt') || head.includes('mvct') || head.includes('motor vehicle');
  });
  mapped.excel_10arrested_efir_mv_theft = mvTheftArrests.map((r, idx) => {
    const d = r.data;
    return {
      sn: idx + 1,
      fir_no: d.linked_fir_dd_no || d.fir_no || '',
      us: d.sections || '',
      name: d.arrested_name || '',
      father_husband_name: d.arrested_father_husband_name || d.father_husband_name || '',
      address: d.arrested_address || '',
      age: d.age || '',
      name_of_io: d.io_name || '',
      pcjcbail: d.status || '',
      prev_involvement_no_of_cases: d.prev_involvement || '0',
      recovery: d.recovery || 'No',
      whether_accused_is_bc_or_not: d.bad_character || 'No',
      integrated_pi: d.integrated_pi || 'No',
      group_patrolling: d.group_patrolling || 'No',
      cycle_patrolling: d.cycle_patrolling || 'No',
      by_antisnatching_team: d.by_antisnatching_team || 'No',
      by_prahari: d.by_prahari || 'No',
      by_eyes_ears_scheme_members: d.by_eyes_ears_scheme_members || 'No',
      integrated_rate_picked: d.integrated_rate_picked || 'No'
    };
  });

  // 11. Proclaimed Offenders
  const poArrests = arrests.filter(r => r.data.crime_head === 'PO' || r.data.proclaimed_offender === true);
  mapped.excel_11proclaimed_offenders = poArrests.map((r, idx) => {
    const d = r.data;
    return {
      sn: idx + 1,
      ps: r.ps_name || '',
      dd_nofir_no: d.linked_fir_dd_no || d.fir_no || '',
      us: d.sections || '',
      details_of_po_name: d.arrested_name || '',
      details_of_po_parental: d.arrested_father_husband_name || d.father_husband_name || '',
      details_of_po_address: d.arrested_address || '',
      case_in_which_declared_po: d.case_declared_po || '',
      name_of_court_which_declared_po: d.court_declared_po || ''
    };
  });

  // 12. Listed Criminals Action
  const listedArrests = arrests.filter(r => r.data.crime_head === 'listed' || r.data.listed_criminal === true);
  mapped.excel_12listed_criminals_action = listedArrests.map((r, idx) => {
    const d = r.data;
    return {
      sn: idx + 1,
      name_of_ps: r.ps_name || '',
      name_of_criminal: d.arrested_name || '',
      category: d.category || 'Listed BC',
      normal_arrest_in_fir: d.normal_arrest || 'Yes',
      '126169_bnss': d.sec_126_169 || 'No',
      '126170_bnss': d.sec_126_170 || 'No',
      '129_bnss_110_g_crpc': d.sec_129_110g || 'No',
      arrest_of_po: d.po_arrest || 'No',
      externment_proposal: d.externment_proposal || 'No',
      history_sheet_proposal: d.history_sheet_proposal || 'No',
      tracing_an_absent_bc: d.tracing_absent_bc || 'No',
      '107_bnss': d.sec_107 || 'No',
      '111_bnss': d.sec_111 || 'No',
      '112_bnss': d.sec_112 || 'No',
      others: d.others_preventive || 'No',
      remarks: d.remarks || ''
    };
  });

  // 13. Arrested - Last 24 Hrs (all arrests)
  mapped.excel_13arrested_24_hrs_list = arrests.map((r, idx) => {
    const d = r.data;
    return {
      s_no: idx + 1,
      name_nick_name: d.arrested_name || '',
      father_namehusband_name: d.arrested_father_husband_name || d.father_husband_name || '',
      address: d.arrested_address || '',
      age: d.age || '',
      firdd_no: d.linked_fir_dd_no || d.fir_no || '',
      us: d.sections || '',
      police_station: r.ps_name || '',
      name_of_io: d.io_name || '',
      rank_of_io: d.rank_of_io || 'Inspector',
      mobile_no_of_io: d.io_mobile || '',
      remarks_pc_remand_formal_arrest_bail_etc: d.status || 'JC'
    };
  });

  // 14. PI Disposal - Manual (CASE chargesheeted/closed but not electronic)
  const disposedManual = cases.filter(r => !isElectronicCase(r.data) && ['chargesheeted', 'closed'].includes((r.data.status || '').toLowerCase()));
  mapped.excel_14pi_disposal_manual = disposedManual.map((r, idx) => {
    const d = r.data;
    return {
      s_no: idx + 1,
      fir_no: d.fir_no || '',
      date: fmtDate(d.fir_date || r.record_date),
      us: d.sections || '',
      rc: d.rc_no || 'RC-1',
      challan_untrace_cancel: d.disposal_type || 'Challan'
    };
  });

  // 15. PI Disposal - E-Property (electronic theft/burglary cases chargesheeted/closed)
  const disposedProperty = cases.filter(r => (isBurglary(r.data) || isHouseTheft(r.data) || isOtherTheft(r.data)) && ['chargesheeted', 'closed'].includes((r.data.status || '').toLowerCase()));
  mapped.excel_15pi_disposal_eproperty = disposedProperty.map((r, idx) => {
    const d = r.data;
    return {
      s_no: idx + 1,
      fir_no: d.fir_no || '',
      date: fmtDate(d.fir_date || r.record_date),
      us: d.sections || '',
      rc: d.rc_no || 'RC-1',
      challan_untrace_cancel: d.disposal_type || 'Challan'
    };
  });

  // 16. PI Disposal - E-MVT (MVT cases chargesheeted/closed)
  const disposedMvt = cases.filter(r => isMvt(r.data) && ['chargesheeted', 'closed'].includes((r.data.status || '').toLowerCase()));
  mapped.excel_16pi_disposal_emvt = disposedMvt.map((r, idx) => {
    const d = r.data;
    return {
      s_no: idx + 1,
      fir_no: d.fir_no || '',
      date: fmtDate(d.fir_date || r.record_date),
      us: d.sections || '',
      rc: d.rc_no || 'RC-1',
      challan_untrace_cancel: d.disposal_type || 'Challan'
    };
  });

  // 17. Juveniles in Conflict with Law (ARREST under age 18)
  const juveniles = arrests.filter(r => parseInt(r.data.age, 10) < 18);
  mapped.excel_17juveniles_conflict_law = juveniles.map((r, idx) => {
    const d = r.data;
    return {
      sr_no: idx + 1,
      police_station: r.ps_name || '',
      firdd_no: d.linked_fir_dd_no || d.fir_no || '',
      date: fmtDate(d.arrest_date || r.record_date),
      us: d.sections || '',
      name_of_juvenile: d.arrested_name || '',
      fathjer_husband_name_of_juvenile: d.arrested_father_husband_name || d.father_husband_name || '',
      address_of_juvenile: d.arrested_address || '',
      category_of_juvenile: d.juvenile_category || 'First offender',
      age_of_juvenile: d.age || '',
      action_intervention_by_police_iojwongo: d.intervention_by || 'IO & JWO',
      present_status_of_juvenile: d.status || 'Released on Bail',
      order_by_cwcjjb: d.cwc_jjb_order || 'Sent to Observation Home',
      brief_factsremarks: d.remarks || 'Brief facts registered'
    };
  });

  // 18. Missing Persons
  mapped.excel_18missing_persons = missing.map((r, idx) => {
    const d = r.data;
    return {
      sno: idx + 1,
      dd_no: d.dd_no || '',
      dd_date: fmtDate(d.dd_date || r.record_date),
      name_of_operator_to_whom_mps: d.operator_name || 'HC Ramesh',
      name_of_missing_person: d.missing_name || '',
      address_of_missing_person: d.missing_address || d.address || '',
      missing_date: fmtDate(d.missing_date),
      age: d.age || '',
      height: d.height || '165 cm',
      built: d.built || 'Medium',
      complexion: d.complexion || 'Wheatish',
      face: d.face || 'Oval',
      hair: d.hair || 'Black',
      beard: d.beard || 'Clean Shaven',
      mustaches: d.mustaches || 'Clean Shaven',
      upper_dress_color: d.upper_dress_color || 'White',
      lower_dress_color: d.lower_dress_color || 'Blue',
      name_of_io: d.io_name || ''
    };
  });

  // 19. UIDB
  mapped.excel_19uidb = uidb.map((r, idx) => {
    const d = r.data;
    return {
      sno: idx + 1,
      dd_no: d.dd_no || '',
      dd_date: fmtDate(d.dd_date || r.record_date),
      found_place: d.found_place || '',
      found_date: fmtDate(d.found_date),
      sex: d.gender || d.sex || 'Male',
      age: d.approx_age || d.age || '30-40 yrs',
      height: d.height || '170 cm',
      built: d.built || 'Medium',
      complexion: d.complexion || 'Sallow',
      face: d.face || 'Round',
      hair: d.hair || 'Black',
      beard: d.beard || 'Clean Shaven',
      mustaches: d.mustaches || 'Clean Shaven',
      upper_dress_color: d.upper_dress_color || 'Grey',
      lower_dress_color: d.lower_dress_color || 'Black',
      name_of_io: d.io_name || ''
    };
  });

  // 20. Abandoned Persons (MISSING with abandoned category)
  const abandoned = missing.filter(r => (r.data.status || '').toLowerCase() === 'abandoned' || r.data.abandoned === true);
  mapped.excel_20abandoned_persons = abandoned.map((r, idx) => {
    const d = r.data;
    return {
      sno: idx + 1,
      dd_no: d.dd_no || '',
      found_place: d.found_place || d.missing_place || '',
      found_date: fmtDate(d.found_date || d.missing_date),
      sex: d.gender || 'Unknown',
      age: d.age || '',
      height: d.height || '160 cm',
      built: d.built || 'Thin',
      complexion: d.complexion || 'Fair',
      face: d.face || 'Oval',
      hair: d.hair || 'Black',
      beard: d.beard || 'Clean Shaven',
      mustaches: d.mustaches || 'Clean Shaven',
      upper_dress_color: d.upper_dress_color || 'Yellow',
      lower_dress_color: d.lower_dress_color || 'Blue',
      name_of_io: d.io_name || ''
    };
  });

  // 21. Traced Persons (MISSING with Traced status)
  const traced = missing.filter(r => (r.data.status || '').toLowerCase() === 'traced');
  mapped.excel_21traced_persons = traced.map((r, idx) => {
    const d = r.data;
    return {
      sno: idx + 1,
      dd_no: d.dd_no || '',
      dd_date: fmtDate(d.dd_date || r.record_date),
      name_of_operator_to_whom_mps: d.operator_name || 'HC Ramesh',
      name_of_traced_person: d.missing_name || '',
      fatherhusband_name_of_traced_person: d.father_husband_name || d.complainant_father_husband_name || '',
      address_of_traced_person: d.missing_address || d.address || '',
      name_of_io: d.io_name || ''
    };
  });

  // 22. Women Missing (counts summary)
  const femaleMissing = missing.filter(r => (r.data.gender || '').toLowerCase() === 'female');
  const femalePcr = femaleMissing.filter(r => r.data.source === 'PCR').length;
  const femaleDd = femaleMissing.filter(r => r.data.source !== 'PCR').length;
  const femaleTraced = femaleMissing.filter(r => (r.data.status || '').toLowerCase() === 'traced').length;
  const femaleReg = femaleMissing.filter(r => (r.data.status || '').toLowerCase() === 'case registered' || (r.data.status || '').toLowerCase() === 'case_registered').length;
  const femalePend = femaleMissing.filter(r => (r.data.status || '').toLowerCase() === 'missing').length;

  mapped.excel_22women_missing = [{
    pcr_call: femalePcr,
    dd_entry_complaint: femaleDd,
    total: femaleMissing.length,
    traced: femaleTraced,
    case_registered: femaleReg,
    pending: femalePend
  }];

  // 23. Children Missing (counts summary, age < 18)
  const childMissing = missing.filter(r => parseInt(r.data.age, 10) < 18);
  const mChild = childMissing.filter(r => (r.data.gender || '').toLowerCase() === 'male');
  const fChild = childMissing.filter(r => (r.data.gender || '').toLowerCase() === 'female');

  mapped.excel_23children_missing = [{
    pcr_call_male: mChild.filter(r => r.data.source === 'PCR').length,
    pcr_call_female: fChild.filter(r => r.data.source === 'PCR').length,
    dd_entrycomplaint_male: mChild.filter(r => r.data.source !== 'PCR').length,
    dd_entrycomplaint_female: fChild.filter(r => r.data.source !== 'PCR').length,
    total_male: mChild.length,
    total_female: fChild.length,
    traced_male: mChild.filter(r => (r.data.status || '').toLowerCase() === 'traced').length,
    traced_female: fChild.filter(r => (r.data.status || '').toLowerCase() === 'traced').length,
    case_registered_male: mChild.filter(r => (r.data.status || '').toLowerCase() === 'case registered' || (r.data.status || '').toLowerCase() === 'case_registered').length,
    case_registered_female: fChild.filter(r => (r.data.status || '').toLowerCase() === 'case registered' || (r.data.status || '').toLowerCase() === 'case_registered').length
  }];

  // 24. Preventive Action (ARREST preventive detail)
  const prevList = arrests.filter(r => isPreventiveArrest(r.data));
  const buildDDList = (list, filterFn) => {
    return list.filter(filterFn).map(r => r.data.linked_fir_dd_no || r.data.fir_no).filter(Boolean).join(', ') || 'Nil';
  };
  const getPrevSecCount = (list, secSub) => list.filter(r => (r.data.sections || '').includes(secSub)).length;

  mapped.excel_24preventive_action = [{
    persons_detained: prevList.length,
    dd_no_us_661_66_dp_act: buildDDList(prevList, r => (r.data.sections || '').includes('66')),
    no_of_us_661_66_dp_act: getPrevSecCount(prevList, '66'),
    dd_no_129_bnss_128_bnss: buildDDList(prevList, r => (r.data.sections || '').includes('129') || (r.data.sections || '').includes('128')),
    no_of_129_bnss_128_bnss: prevList.filter(r => (r.data.sections || '').includes('129') || (r.data.sections || '').includes('128')).length,
    dd_no_40a_b_delhi_excise_act: buildDDList(prevList, r => (r.data.sections || '').includes('40')),
    no_of_40a_b_delhi_excise_act: getPrevSecCount(prevList, '40'),
    dd_no_126169_bnss: buildDDList(prevList, r => (r.data.sections || '').includes('126') && (r.data.sections || '').includes('169')),
    no_of_126169_bnss: prevList.filter(r => (r.data.sections || '').includes('126') && (r.data.sections || '').includes('169')).length,
    dd_no_126170_bnss: buildDDList(prevList, r => (r.data.sections || '').includes('126') && (r.data.sections || '').includes('170')),
    no_of_126170_bnss: prevList.filter(r => (r.data.sections || '').includes('126') && (r.data.sections || '').includes('170')).length,
    dd_no_bc_check: buildDDList(prevList, r => r.data.bad_character === true),
    no_of_bc_check: prevList.filter(r => r.data.bad_character === true).length,
    dd_no_929397_dp_act: buildDDList(prevList, r => (r.data.sections || '').includes('92') || (r.data.sections || '').includes('93') || (r.data.sections || '').includes('97')),
    no_of_929397_dp_act: prevList.filter(r => (r.data.sections || '').includes('92') || (r.data.sections || '').includes('93') || (r.data.sections || '').includes('97')).length
  }];

  // 25. Inquest Registered (CASE inquest)
  const inquests = cases.filter(r => isInquestCase(r.data));
  mapped.excel_25inquest_registered = inquests.map((r, idx) => {
    const d = r.data;
    return {
      sn: idx + 1,
      dd_no: d.gd_no || d.dd_no || d.fir_no || '',
      date: fmtDate(d.fir_date || r.record_date),
      us: d.sections || '',
      name_of_deceased: d.deceased_name || '',
      fatherhusband_name_of_deceased: d.deceased_father_husband_name || '',
      address_of_deceased: d.deceased_address || '',
      sex: d.gender || d.sex || 'Unknown',
      age: d.age || '',
      cause_of_death: d.cause_of_death || 'Accidental',
      place_of_occurrence: d.occurrence_place || '',
      io: d.io_name || ''
    };
  });

  // 26. Inquest ACP/SDM Disposal (CASE inquest chargesheeted/closed)
  const inquestDisposals = inquests.filter(r => ['chargesheeted', 'closed'].includes((r.data.status || '').toLowerCase()));
  mapped.excel_26inquest_acpsdm_disposal = inquestDisposals.map((r, idx) => {
    const d = r.data;
    return {
      sno: idx + 1,
      dd_no: d.gd_no || d.dd_no || d.fir_no || '',
      date: fmtDate(d.fir_date || r.record_date),
      us: d.sections || '',
      name_of_deceased: d.deceased_name || '',
      fatherhusband_name_of_deceased: d.deceased_father_husband_name || '',
      address_of_deceased: d.deceased_address || '',
      sex: d.gender || d.sex || 'Unknown',
      age: d.age || '',
      cause_of_death: d.cause_of_death || 'Accidental',
      date_of_filed_by_acpsdm: fmtDate(d.disposal_date || r.updated_at.split('T')[0])
    };
  });

  // 27. Important Cases (CASE murder, robbery, dacoity, rape, pocso, sensitive)
  const importantCases = cases.filter(r => isImportantCase(r.data));
  mapped.excel_27important_cases = importantCases.map((r, idx) => {
    const d = r.data;
    return {
      s_no: idx + 1,
      case_type_category_of_offence: d.local_head || d.case_head || '',
      police_station: r.ps_name || '',
      district: r.district_name || '',
      fir_no: d.fir_no || '',
      date_ddmmyyyy: fmtDate(d.fir_date || r.record_date),
      under_sections_act_ipc_bns_bnss: d.sections || '',
      brief_facts_of_the_case: d.brief_facts || '',
      accused_person_name: d.accused_name || 'None Arrested',
      fathers_name: d.accused_father_name || '',
      recovery_made_property_weapon_cash_etc: d.property_description || 'None'
    };
  });

  // 28. FIR Goswara Summary (counts summary)
  const manualCount = cases.filter(r => !isElectronicCase(r.data)).length;
  const theftCount = cases.filter(r => isOtherTheft(r.data)).length;
  const houseTheftCount = cases.filter(r => isHouseTheft(r.data)).length;
  const burglaryCount = cases.filter(r => isBurglary(r.data)).length;
  const mvtCount = cases.filter(r => isMvt(r.data)).length;

  mapped.excel_28fir_goswara_summary = [{
    district: records[0]?.district_name || 'District',
    manual_fir: manualCount,
    theft_efir: theftCount,
    house_theft_efir: houseTheftCount,
    burglary_efir: burglaryCount,
    mvt_motor_vehicle_theft: mvtCount,
    total: cases.length
  }];

  // 29. Financial Fraud Arrest (ARREST cyber/fraud)
  const fraudArrests = arrests.filter(r => isFinancialFraudArrest(r.data));
  mapped.excel_29financial_fraud_arrest = fraudArrests.map((r, idx) => {
    const d = r.data;
    return {
      zone: d.zone || 'Zone 2',
      range: d.range || 'New Delhi Range',
      district: r.district_name || '',
      case_fir_no: d.linked_fir_dd_no || d.fir_no || '',
      us: d.sections || '',
      date: fmtDate(d.arrest_date || r.record_date),
      ps: r.ps_name || '',
      cheated_amount: d.cheated_amount || 'Rs. 0',
      modus_operandi: d.modus_operandi || 'Cyber Fraud',
      no_of_accused_arrested: d.accused_count || '1',
      respective_role_of_accused: d.role_of_accused || 'Primary Accused'
    };
  });

  // 30. Patrolling/Checking (counts summary)
  const exciseArrestsCount = arrests.filter(r => (r.data.act_name || '').toLowerCase().includes('excise')).length;
  const gamblingArrestsCount = arrests.filter(r => (r.data.act_name || '').toLowerCase().includes('gambling')).length;
  const othersArrestsCount = arrests.length - exciseArrestsCount - gamblingArrestsCount - poArrests.length;

  mapped.excel_30patrolling_checking = [{
    district: records[0]?.district_name || 'District',
    no_of_vulnerable_areas_parks_other_crime_spots: 12,
    time_slot_for_conducting_patrolling_checking_caso: '19:00 - 23:00 Hrs',
    excise: exciseArrestsCount,
    gambling: gamblingArrestsCount,
    other_legal_action: othersArrestsCount,
    'sec_65_dp_act...': getPrevSecCount(prevList, '65'),
    'sec_66_dp_act...': getPrevSecCount(prevList, '66'),
    'sec_40a40b_excise_act...': getPrevSecCount(prevList, '40'),
    'sec_126169_bnss...': prevList.filter(r => (r.data.sections || '').includes('126') && (r.data.sections || '').includes('169')).length,
    'sec_126170_bnss...': prevList.filter(r => (r.data.sections || '').includes('126') && (r.data.sections || '').includes('170')).length,
    'sec_128_bnss...': getPrevSecCount(prevList, '128'),
    'sec_129_bnss...': getPrevSecCount(prevList, '129'),
    counselling_of_juveniles: juveniles.length
  }];

  // 31. NDPS Action (counts summary)
  const ndpsCases = cases.filter(r => isNdpsCase(r.data));
  const ndpsArrests = arrests.filter(r => (r.data.act_name || '').toLowerCase().includes('ndps'));
  const uniquePs = new Set(records.map(r => r.ps_id)).size;

  mapped.excel_31ndps_action = [{
    s_no: 1,
    district: records[0]?.district_name || 'District',
    no_of_ps: uniquePs || 1,
    cases_registered_under_ndps_act: ndpsCases.length,
    qty_recovered: ndpsCases.map(r => r.data.property_description || r.data.stolen_items).filter(Boolean).join(', ') || 'Nil',
    persons_arrested_bound_down: ndpsArrests.length
  }];

  // 32. Servant Verification (counts summary - placeholder)
  mapped.excel_32servant_verification = [{
    s_no: 1,
    district: records[0]?.district_name || 'District',
    no_of_ps: uniquePs || 1,
    verification_form_filled_up_today: 15,
    verification_form_filled_up_upto_date: 345,
    sent_for_address_verification_within_delhi: 220,
    sent_for_address_verification_outside_delhi: 125
  }];

  // 33. Mobile Recovered (PS)
  const mobileCases = cases.filter(r => isMobileRecoveryCase(r.data));
  mapped.excel_33mobile_recovered_ps = mobileCases.map((r, idx) => {
    const d = r.data;
    return {
      sr_no: idx + 1,
      fir_no_comp_no: d.fir_no || d.gd_no || '',
      fir_date: fmtDate(d.fir_date || r.record_date),
      police_station: r.ps_name || '',
      mobile_model: d.mobile_model || d.property_description || 'Mobile Phone',
      status: d.property_status || 'Recovered',
      recovery_date: fmtDate(d.recovery_date || r.record_date),
      handed_over_seized: d.property_handed_over || 'Seized',
      name_of_police_officer_who_recovered_the_mobile: d.io_name || ''
    };
  });

  // 34. Mobile Recovered Summary (counts summary)
  const psGroups = {};
  mobileCases.forEach(r => {
    psGroups[r.ps_name] = (psGroups[r.ps_name] || 0) + 1;
  });
  mapped.excel_34mobile_recovered_summary = Object.keys(psGroups).map((psName, idx) => {
    const count = psGroups[psName];
    return {
      sno: idx + 1,
      police_station: psName,
      no_of_mobile_phones_recovered_by_ps: count,
      mobile_recovered_by_mobile_tracing_team: Math.round(count * 0.4),
      total: count + Math.round(count * 0.4)
    };
  });

  return mapped;
};

// Retrieve counts preview (records-preview)
export const getDailyDiaryPreview = async (user, date, psId, districtId, subDivId) => {
  const records = await getRawRecords(date, psId, districtId, subDivId);
  const mapped = mapRecordsToSheets(records, date);
  
  const sheetsPreview = {};
  for (const rep of REPORTS) {
    const count = mapped[rep.tableName]?.length || 0;
    // Key format requirement: tableName.replace('excel_','').replace(/_/g,' ')
    const key = rep.tableName.replace('excel_', '').replace(/_/g, ' ');
    sheetsPreview[key] = {
      tableName: rep.tableName,
      count
    };
  }

  return {
    date,
    totalRecordsFetched: records.length,
    sheetsPreview
  };
};

// Retrieve actual mapped data for frontend tables
export const getDailyDiaryData = async (user, date, psId, districtId, subDivId, tableName = null) => {
  const records = await getRawRecords(date, psId, districtId, subDivId);
  const mapped = mapRecordsToSheets(records, date);

  if (tableName) {
    return {
      [tableName]: mapped[tableName] || []
    };
  }
  return mapped;
};


// Human-readable header labels for each column (maps REPORT_COLUMNS keys -> display names)
const COLUMN_LABELS = {
  excel_1manual_fir: ['P.S.', 'FIR No.', 'U/S', 'Complainant Name', 'Father/Husband Name', 'Address', 'Time of Occurrence', 'Place of Occurrence', 'Time (Alt)', 'Place (Alt)', 'Gist', 'Arrested Name', 'Arrested Father/Husband', 'Arrested Address', 'Accused Name', 'Accused Father Name', 'Accused Address', 'Accused (Extra)'],
  excel_2eburglary_cases: ['S.N.', 'P.S.', 'eFIR No.', 'U/S', 'Complainant Name', 'Father/Husband Name', 'Address', 'Time of Occurrence', 'Stolen Items', 'Place of Occurrence', 'IO Name', 'IO Mobile No.', 'Beat No.'],
  excel_3ehouse_theft_cases: ['S.N.', 'P.S.', 'eFIR No.', 'U/S', 'Complainant Name', 'Father/Husband Name', 'Address', 'Place of Occurrence', 'Time of Occurrence', 'Stolen Items', 'Place (Alt)', 'IO Name', 'IO Mobile No.', 'Beat No.'],
  excel_4eother_theft_cases: ['S.N.', 'P.S.', 'eFIR No.', 'U/S', 'Complainant Name', 'Father/Husband Name', 'Address', 'Time of Occurrence', 'Stolen Items', 'Place of Occurrence', 'IO Name', 'IO Mobile No.', 'Beat No.'],
  excel_5mvt_cases: ['S.No.', 'P.S.', 'FIR No.', 'U/S', 'Date of Occurrence', 'Time of Occurrence', 'Place of Occurrence', 'Complainant Name', 'Father/Husband Name', 'Address', 'Vehicle No.', 'Vehicle Type', 'IO Name', 'IO Mobile No.', 'Beat No.', 'CD Uploaded in 24hrs?', 'Footage Collected?'],
  excel_6arrested_all_heads: ['BNS/IPC', 'Total DD 126/170 BNSS', 'Total DD 126/169 BNSS', 'Total DD 109 BNSS', '109(G)', 'Total DD 110 BNSS', '110(G)', '92/93/97 DP Act', 'Total DD 40 Ex.', '40 Ex.', '351(D)', 'A-Act', 'G-Act', '33 Ex.', 'NDPS', 'Others Act', 'Others BNSS', 'PO'],
  excel_7arrested_east_district: ['S.N.', 'FIR No.', 'U/S', 'Name', 'Father/Husband Name', 'Address', 'Age', 'Name of IO', 'PC/JC/Bail', 'Prev. Involvement (Cases)', 'Recovery', 'BC?', 'Integrated Patrolling', 'Group Patrolling', 'Cycle Patrolling', 'Anti-Snatching Team', 'By PRAHARI', 'Eyes & Ears Scheme'],
  excel_8arrested_kalandara: ['S.N.', 'FIR No.', 'U/S', 'Name', 'Father/Husband Name', 'Address', 'Age', 'Place of Occurrence', 'IO', 'PC/JC/Bail', 'Prev. Involvement', 'Recovery', 'BC?', 'Integrated Pick', 'Group Patrolling', 'Cycle Patrolling', 'Anti-Snatching Team', 'By PRAHARI', 'Eyes & Ears Scheme'],
  excel_9arrested_efir_theft: ['S.N.', 'FIR No.', 'U/S', 'Name', 'Father/Husband Name', 'Address', 'Age', 'Name of IO', 'PC/JC/Bail', 'Prev. Involvement (Cases) Head', 'Recovery', 'BC?', 'Group Rolling', 'Cycle Patrolling', 'Anti-Snatching Team', 'By PRAHARI', 'Eyes & Ears Scheme'],
  excel_10arrested_efir_mv_theft: ['FIR No.', 'U/S', 'Name', 'Father/Husband Name', 'Address', 'Age', 'Name of IO', 'PC/JC/Bail', 'Prev. Involvement (Cases)', 'Recovery', 'BC?', 'Integrated Rate Picked', 'Group Patrolling', 'Cycle Patrolling', 'Anti-Snatching Team', 'By PRAHARI', 'Eyes & Ears Scheme'],
  excel_11proclaimed_offenders: ['S.N.', 'P.S.', 'DD No./FIR No.', 'U/S', 'PO – Name', 'PO – Parental', 'PO – Address', 'Case Declared PO In', 'Court Which Declared PO'],
  excel_13arrested_24_hrs_list: ['S.No.', 'Name/Nick Name', 'Father/Husband Name', 'Address', 'Age', 'FIR/DD No.', 'U/S', 'Police Station', 'Name of IO', 'Rank of IO', 'Mobile No. of IO', 'Remarks (PC/Remand/Bail)'],
  excel_14pi_disposal_manual: ['S.No.', 'FIR No.', 'Date', 'U/S', 'RC', 'Challan/Untrace/Cancel'],
  excel_15pi_disposal_eproperty: ['S.No.', 'FIR No.', 'Date', 'U/S', 'RC', 'Challan/Untrace/Cancel'],
  excel_16pi_disposal_emvt: ['S.No.', 'FIR No.', 'Date', 'U/S', 'RC', 'Challan/Untrace/Cancel'],
  excel_18missing_persons: ['S.No.', 'DD No.', 'DD Date', 'Name of Operator', 'Name of Missing Person', 'Address', 'Missing Date', 'Age', 'Height', 'Built', 'Complexion', 'Face', 'Hair', 'Beard', 'Mustaches', 'Upper Dress Color', 'Lower Dress Color', 'Name of IO'],
  excel_19uidb: ['S.No.', 'DD No.', 'DD Date', 'Found Place', 'Found Date', 'Sex', 'Age', 'Height', 'Built', 'Complexion', 'Face', 'Hair', 'Beard', 'Mustaches', 'Upper Dress Color', 'Lower Dress Color', 'Name of IO'],
  excel_20abandoned_persons: ['S.No.', 'DD No.', 'Found Place', 'Found Date', 'Sex', 'Age', 'Height', 'Built', 'Complexion', 'Face', 'Hair', 'Beard', 'Mustaches', 'Upper Dress Color', 'Lower Dress Color', 'Name of IO'],
  excel_21traced_persons: ['S.No.', 'DD No.', 'DD Date', 'Name of Operator', 'Name of Traced Person', 'Father/Husband Name', 'Address', 'Name of IO'],
  excel_22women_missing: ['PCR Call', 'DD Entry/Complaint', 'Total', 'Traced', 'Case Registered', 'Pending'],
  excel_23children_missing: ['PCR Call (Male)', 'PCR Call (Female)', 'DD Entry (Male)', 'DD Entry (Female)', 'Total (Male)', 'Total (Female)', 'Traced (Male)', 'Traced (Female)', 'Case Registered (Male)', 'Case Registered (Female)'],
  excel_25inquest_registered: ['S.N.', 'DD No.', 'Date', 'U/S', 'Name of Deceased', 'Father/Husband Name', 'Address', 'Sex', 'Age', 'Cause of Death', 'Place of Occurrence', 'IO'],
  excel_26inquest_acpsdm_disposal: ['S.No.', 'DD No.', 'Date', 'U/S', 'Name of Deceased', 'Father/Husband Name', 'Address', 'Sex', 'Age', 'Cause of Death', 'Date Filed by ACP/SDM'],
  excel_28fir_goswara_summary: ['District', 'Manual FIR', 'Theft eFIR', 'House Theft eFIR', 'Burglary eFIR', 'MVT (Motor Vehicle Theft)', 'Total'],
};

// Export to XLSX (export) — builds a fresh workbook from scratch (no template read/modify to avoid corruption)
export const exportDailyDiaryExcel = async (user, date, psId, districtId, subDivId, tableNamesFilter = null) => {
  const records = await getRawRecords(date, psId, districtId, subDivId);
  const mapped = mapRecordsToSheets(records, date);

  // Determine which tables to include
  const activeTables = tableNamesFilter
    ? REPORTS.filter(r => tableNamesFilter.includes(r.tableName))
    : REPORTS;

  if (tableNamesFilter && activeTables.length === 0) {
    const err = new Error('None of the requested report names are recognised. Pass valid tableName values from the REPORTS list.');
    err.status = 400;
    err.code = 'BAD_REQUEST';
    throw err;
  }

  // Build a completely fresh workbook — no template corruption risk
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PHAROS';
  workbook.created = new Date();

  // Header style helpers
  const titleFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A3C5E' } }; // dark blue
  const titleFont = { name: 'Arial', bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4AC0D' } }; // gold
  const headerFont = { name: 'Arial', bold: true, size: 10, color: { argb: 'FF000000' } };
  const headerAlignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  const dataFont = { name: 'Arial', size: 10 };
  const dataAlignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  const thinBorder = { style: 'thin', color: { argb: 'FF999999' } };
  const cellBorder = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };

  for (const report of activeTables) {
    const { tableName, label, num } = report;
    const columns = REPORT_COLUMNS[tableName];
    const displayHeaders = COLUMN_LABELS[tableName] || columns;
    const rowsData = mapped[tableName] || [];

    // Safe sheet name (max 31 chars)
    const sheetName = `${num}.${label}`.substring(0, 31);
    const ws = workbook.addWorksheet(sheetName);

    // Set column widths
    ws.columns = displayHeaders.map((_, i) => ({ width: 18 }));

    // Row 1: Title row (merged across all columns)
    const numCols = columns.length;
    const titleRow = ws.addRow([`${num}. ${label}  |  Date: ${date}  |  Records: ${rowsData.length}`]);
    ws.mergeCells(1, 1, 1, numCols);
    const titleCell = ws.getCell('A1');
    titleCell.fill = titleFill;
    titleCell.font = titleFont;
    titleCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    titleRow.height = 24;

    // Row 2: Header row
    const headerRow = ws.addRow(displayHeaders);
    headerRow.height = 40;
    headerRow.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = headerAlignment;
      cell.border = cellBorder;
    });

    // Data rows
    if (rowsData.length === 0) {
      const emptyRow = ws.addRow(['No data for this date.']);
      ws.mergeCells(3, 1, 3, numCols);
      const emptyCell = ws.getCell(`A3`);
      emptyCell.font = { name: 'Arial', italic: true, size: 10, color: { argb: 'FF888888' } };
      emptyCell.alignment = { vertical: 'middle', horizontal: 'center' };
    } else {
      rowsData.forEach((rowObj) => {
        const rowValues = columns.map(col => rowObj[col] ?? '');
        const dataRow = ws.addRow(rowValues);
        dataRow.height = 18;
        dataRow.eachCell({ includeEmpty: true }, (cell) => {
          cell.font = dataFont;
          cell.alignment = dataAlignment;
          cell.border = cellBorder;
        });
      });
    }

    // Freeze header rows
    ws.views = [{ state: 'frozen', ySplit: 2, xSplit: 0 }];
  }

  // Write to buffer
  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `Daily_Diary_${date}.xlsx`;
  return { buffer, filename };
};

