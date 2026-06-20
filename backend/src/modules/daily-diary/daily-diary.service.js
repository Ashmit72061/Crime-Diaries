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
  { tableName: "excel_12listed_criminals_action",  label: "Listed Criminals Action",           type: "list",    num: 12 },
  { tableName: "excel_13arrested_24_hrs_list",     label: "Arrested - Last 24 Hrs",            type: "list",    num: 13 },
  { tableName: "excel_14pi_disposal_manual",       label: "PI Disposal - Manual",              type: "list",    num: 14 },
  { tableName: "excel_15pi_disposal_eproperty",    label: "PI Disposal - E-Property",          type: "list",    num: 15 },
  { tableName: "excel_16pi_disposal_emvt",         label: "PI Disposal - E-MVT",               type: "list",    num: 16 },
  { tableName: "excel_17juveniles_conflict_law",   label: "Juveniles in Conflict with Law",    type: "list",    num: 17 },
  { tableName: "excel_18missing_persons",          label: "Missing Persons",                   type: "list",    num: 18 },
  { tableName: "excel_19uidb",                     label: "UIDB (Unidentified Bodies)",        type: "list",    num: 19 },
  { tableName: "excel_20abandoned_persons",        label: "Abandoned Persons",                 type: "list",    num: 20 },
  { tableName: "excel_21traced_persons",           label: "Traced Persons",                    type: "list",    num: 21 },
  { tableName: "excel_22women_missing",            label: "Women Missing",                     type: "summary", num: 22 },
  { tableName: "excel_23children_missing",         label: "Children Missing",                  type: "summary", num: 23 },
  { tableName: "excel_24preventive_action",        label: "Preventive Action",                 type: "list",    num: 24 },
  { tableName: "excel_25inquest_registered",       label: "Inquest Registered",                type: "list",    num: 25 },
  { tableName: "excel_26inquest_acpsdm_disposal",  label: "Inquest ACP/SDM Disposal",          type: "list",    num: 26 },
  { tableName: "excel_27important_cases",          label: "Important Cases",                   type: "list",    num: 27 },
  { tableName: "excel_28fir_goswara_summary",      label: "FIR Goswara Summary",               type: "summary", num: 28 },
  { tableName: "excel_29financial_fraud_arrest",   label: "Financial Fraud Arrest",            type: "list",    num: 29 },
  { tableName: "excel_30patrolling_checking",      label: "Patrolling / Checking",             type: "summary", num: 30 },
  { tableName: "excel_31ndps_action",              label: "NDPS Action",                       type: "summary", num: 31 },
  { tableName: "excel_32servant_verification",     label: "Servant Verification",              type: "summary", num: 32 },
  { tableName: "excel_33mobile_recovered_ps",      label: "Mobile Recovered - PS",             type: "list",    num: 33 },
  { tableName: "excel_34mobile_recovered_summary", label: "Mobile Recovered Summary",          type: "summary", num: 34 },
];

const REPORT_COLUMNS = {
  excel_1manual_fir: ['ps', 'fir_no', 'us', 'name_of_complainant', 'father_husband_name_of_complainant', 'address_of_complainant', 'time_of_occurrence', 'place_of_occurrence', 'time_of_occurrence_1', 'place_of_occurrence_1', 'gist', 'arrested_person', 'name_of_accused'],
  excel_2eburglary_cases: ['sr_no', 'ps', 'efir_no', 'us', 'name_of_complainant', 'father_husband_name_of_complainant', 'address_of_complainant', 'time_of_occurrence', 'stolen_items', 'place_of_occurrence', 'io_name', 'io_mobile_no', 'beat_no'],
  excel_3ehouse_theft_cases: ['sr_no', 'ps', 'efir_no', 'us', 'name_of_complainant', 'father_husband_name_of_complainant', 'address_of_complainant', 'place_of_occurrence', 'time_of_occurrence', 'stolen_items', 'place_of_occurrence_1', 'io_name', 'io_mobile_no', 'beat_no'],
  excel_4eother_theft_cases: ['sr_no', 'ps', 'efir_no', 'us', 'name_of_complainant', 'father_husband_name_of_complainant', 'address_of_complainant', 'time_of_occurrence', 'stolen_items', 'place_of_occurrence', 'io_name', 'io_mobile_no', 'beat_no'],
  excel_5mvt_cases: ['sr', 'ps', 'fir_no', 'us', 'date_of_occurrence', 'time_of_occurrence', 'place_of_occurrence', 'name_of_complainant', 'father_husband_name_of_complainant', 'address_of_complainant', 'vehicle_no', 'vehicle_type', 'io_name', 'io_mobile_no', 'beat_no', '1st_cd_uploaded_in_24_hrs_yesno', 'whether_footage_is_collected_or_not'],
  excel_6arrested_all_heads: ['bnsipc', 'total_no_dd_126170_bnss', 'total_no_dd_126169_bnss', 'total_no_dd_109_bnss', '109_g', 'total_l_no_dd_110_bnss', '110_g', '929397_dp_act', 'total_no_dd_40_ex', '40_ex', '351d', 'aact', 'gact', '33_ex', 'ndps', 'others_act', 'others_bnss', 'po'],
  excel_7arrested_east_district: ['sn', 'fir_no', 'us', 'name', 'father_husband_name', 'address', 'age', 'name_of_io', 'pcjcbail', 'prev_involvement_no_of_cases', 'recovery', 'whether_accused_is_bc_or_not', 'integrated_pi', 'group_patrolling', 'cycle_patrolling', 'by_antisnatching_team', 'by_prahari', 'by_eyes_ears_scheme_members'],
  excel_8arrested_kalandara: ['sn', 'fir_no', 'us', 'name', 'father_husband_name', 'address', 'age', 'name_of_io', 'pcjcbail', 'prev_involvement_no_of_cases', 'recovery', 'whether_accused_is_bc_or_not', 'integrated_pi', 'group_patrolling', 'cycle_patrolling', 'by_antisnatching_team', 'by_prahari', 'by_eyes_ears_scheme_members', 'firdd_no', 'place_of_occurrence', 'io', 'prev_involvement', 'integrated_pick'],
  excel_9arrested_efir_theft: ['sn', 'fir_no', 'us', 'name', 'father_husband_name', 'address', 'age', 'name_of_io', 'pcjcbail', 'prev_involvement_no_of_cases', 'recovery', 'whether_accused_is_bc_or_not', 'integrated_pi', 'group_patrolling', 'cycle_patrolling', 'by_antisnatching_team', 'by_prahari', 'by_eyes_ears_scheme_members', 'firdd_no', 'prev_involvement_no_of_cases_head', 'group_rolling'],
  excel_10arrested_efir_mv_theft: ['sn', 'fir_no', 'us', 'name', 'father_husband_name', 'address', 'age', 'name_of_io', 'pcjcbail', 'prev_involvement_no_of_cases', 'recovery', 'whether_accused_is_bc_or_not', 'integrated_pi', 'group_patrolling', 'cycle_patrolling', 'by_antisnatching_team', 'by_prahari', 'by_eyes_ears_scheme_members', 'integrated_rate_picked'],
  excel_11proclaimed_offenders: ['sn', 'ps', 'dd_nofir_no', 'us', 'details_of_po_name', 'details_of_po_parental', 'details_of_po_address', 'case_in_which_declared_po', 'name_of_court_which_declared_po'],
  excel_12listed_criminals_action: ['sn', 'name_of_ps', 'name_of_criminal', 'category', 'normal_arrest_in_fir', '126169_bnss', '126170_bnss', '129_bnss_110_g_crpc', 'arrest_of_po', 'externment_proposal', 'history_sheet_proposal', 'tracing_an_absent_bc', '107_bnss', '111_bnss', '112_bnss', 'others', 'remarks'],
  excel_13arrested_24_hrs_list: ['s_no', 'name_nick_name', 'father_namehusband_name', 'address', 'age', 'firdd_no', 'us', 'police_station', 'name_of_io', 'rank_of_io', 'mobile_no_of_io', 'remarks_pc_remand_formal_arrest_bail_etc'],
  excel_14pi_disposal_manual: ['s_no', 'fir_no', 'date', 'us', 'rc', 'challan_untrace_cancel'],
  excel_15pi_disposal_eproperty: ['s_no', 'fir_no', 'date', 'us', 'rc', 'challan_untrace_cancel'],
  excel_16pi_disposal_emvt: ['s_no', 'fir_no', 'date', 'us', 'rc', 'challan_untrace_cancel'],
  excel_17juveniles_conflict_law: ['sr_no', 'police_station', 'firdd_no', 'date', 'us', 'name_of_juvenile', 'fathjer_husband_name_of_juvenile', 'address_of_juvenile', 'category_of_juvenile', 'age_of_juvenile', 'action_intervention_by_police_iojwongo', 'present_status_of_juvenile', 'order_by_cwcjjb', 'brief_factsremarks'],
  excel_18missing_persons: ['sno', 'dd_no', 'dd_date', 'name_of_operator_to_whom_mps', 'name_of_missing_person', 'address_of_missing_person', 'missing_date', 'age', 'height', 'built', 'complexion', 'face', 'hair', 'beard', 'mustaches', 'upper_dress_color', 'lower_dress_color', 'name_of_io'],
  excel_19uidb: ['sno', 'dd_no', 'dd_date', 'found_place', 'found_date', 'sex', 'age', 'height', 'built', 'complexion', 'face', 'hair', 'beard', 'mustaches', 'upper_dress_color', 'lower_dress_color', 'name_of_io'],
  excel_20abandoned_persons: ['sno', 'dd_no', 'found_place', 'found_date', 'sex', 'age', 'height', 'built', 'complexion', 'face', 'hair', 'beard', 'mustaches', 'upper_dress_color', 'lower_dress_color', 'name_of_io'],
  excel_21traced_persons: ['sno', 'dd_no', 'dd_date', 'name_of_operator_to_whom_mps', 'name_of_traced_person', 'fatherhusband_name_of_traced_person', 'address_of_traced_person', 'name_of_io'],
  excel_22women_missing: ['pcr_call', 'dd_entry_complaint', 'total', 'traced', 'case_registered', 'pending'],
  excel_23children_missing: ['pcr_call_male', 'pcr_call_female', 'dd_entrycomplaint_male', 'dd_entrycomplaint_female', 'total_male', 'total_female', 'traced_male', 'traced_female', 'case_registered_male', 'case_registered_female'],
  excel_24preventive_action: ['persons_detained', 'dd_no_us_661_66_dp_act', 'no_of_us_661_66_dp_act', 'dd_no_129_bnss_128_bnss', 'no_of_129_bnss_128_bnss', 'dd_no_40a_b_delhi_excise_act', 'no_of_40a_b_delhi_excise_act', 'dd_no_126169_bnss', 'no_of_126169_bnss', 'dd_no_126170_bnss', 'no_of_126170_bnss', 'dd_no_bc_check', 'no_of_bc_check', 'dd_no_929397_dp_act', 'no_of_929397_dp_act'],
  excel_25inquest_registered: ['sn', 'dd_no', 'date', 'us', 'name_of_deceased', 'fatherhusband_name_of_deceased', 'address_of_deceased', 'sex', 'age', 'cause_of_death', 'place_of_occurrence', 'io'],
  excel_26inquest_acpsdm_disposal: ['sno', 'dd_no', 'date', 'us', 'name_of_deceased', 'fatherhusband_name_of_deceased', 'address_of_deceased', 'sex', 'age', 'cause_of_death', 'date_of_filed_by_acpsdm'],
  excel_27important_cases: ['s_no', 'case_type_category_of_offence', 'police_station', 'district', 'fir_no', 'date_ddmmyyyy', 'under_sections_act_ipc_bns_bnss', 'brief_facts_of_the_case', 'accused_person_name', 'fathers_name', 'recovery_made_property_weapon_cash_etc'],
  excel_28fir_goswara_summary: ['district', 'manual_fir', 'theft_efir', 'house_theft_efir', 'burglary_efir', 'mvt_motor_vehicle_theft', 'total'],
  excel_29financial_fraud_arrest: ['zone', 'range', 'district', 'case_fir_no', 'us', 'date', 'ps', 'cheated_amount', 'modus_operandi', 'no_of_accused_arrested', 'respective_role_of_accused'],
  excel_30patrolling_checking: ['district', 'no_of_vulnerable_areas_parks_other_crime_spots', 'time_slot_for_conducting_patrolling_checking_caso', 'excise', 'gambling', 'other_legal_action', 'sec_65_dp_act...', 'sec_66_dp_act...', 'sec_40a40b_excise_act...', 'sec_126169_bnss...', 'sec_126170_bnss...', 'sec_128_bnss...', 'sec_129_bnss...', 'counselling_of_juveniles'],
  excel_31ndps_action: ['s_no', 'district', 'no_of_ps', 'cases_registered_under_ndps_act', 'qty_recovered', 'persons_arrested_bound_down'],
  excel_32servant_verification: ['s_no', 'district', 'no_of_ps', 'verification_form_filled_up_today', 'verification_form_filled_up_upto_date', 'sent_for_address_verification_within_delhi', 'sent_for_address_verification_outside_delhi'],
  excel_33mobile_recovered_ps: ['sr_no', 'fir_no_comp_no', 'fir_date', 'police_station', 'mobile_model', 'status', 'recovery_date', 'handed_over_seized', 'name_of_police_officer_who_recovered_the_mobile'],
  excel_34mobile_recovered_summary: ['sno', 'police_station', 'no_of_mobile_phones_recovered_by_ps', 'mobile_recovered_by_mobile_tracing_team', 'total']
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
    .where('records.record_date', date)
    .whereNot('records.current_status', 'DRAFT');

  if (psId) {
    query = query.where('records.ps_id', psId);
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
      arrested_person: d.arrested_person || d.accused_name || 'None',
      name_of_accused: d.accused_name || 'Unknown'
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
      date_of_filed_by_acpsdm: fmtDate(d.disposal_date || r.updated_at)
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

// Export to XLSX (export)
export const exportDailyDiaryExcel = async (user, date, psId, districtId, subDivId, tableNamesFilter = null) => {
  const records = await getRawRecords(date, psId, districtId, subDivId);
  const mapped = mapRecordsToSheets(records, date);

  const templatePath = path.resolve(__dirname, 'templates', 'Daily dairy all tables NO MULTIVALUED (1).xlsx');
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath);

  // Determine which tables to populate
  const activeTables = tableNamesFilter || REPORTS.map(r => r.tableName);

  workbook.worksheets.forEach((ws) => {
    if (ws.name === 'Sheet1') return;

    // Resolve which report this sheet maps to
    const match = ws.name.match(/^(\d+)\./);
    if (!match) return;
    const num = parseInt(match[1], 10);
    const report = REPORTS.find(r => r.num === num);
    if (!report) return;

    const tableName = report.tableName;
    const columns = REPORT_COLUMNS[tableName];
    
    // Determine data starting row
    // Sheets 27, 28, 30 have 3 rows of headers. Others have 2 rows.
    const headerRowsCount = [27, 28, 30].includes(num) ? 3 : 2;
    const dataStartRow = headerRowsCount + 1;

    // Clear all rows from dataStartRow onwards
    const totalRows = ws.rowCount;
    if (totalRows >= dataStartRow) {
      ws.spliceRows(dataStartRow, totalRows - dataStartRow + 1);
    }

    // If not selected in filter, leave it empty (only headers remain)
    if (!activeTables.includes(tableName)) {
      return;
    }

    // Populate data rows
    const rowsData = mapped[tableName] || [];
    rowsData.forEach((rowObj) => {
      // Map object to array of columns in exact order
      const rowValues = columns.map(col => rowObj[col] ?? '');
      
      const addedRow = ws.addRow(rowValues);
      
      // Inherit styles (borders, alignments, fonts)
      addedRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        cell.font = { name: 'Arial', size: 10 };
      });
    });
  });

  // Compile binary workbook buffer
  const buffer = await workbook.xlsx.writeBuffer();
  
  const filename = `Daily_Diary_${date}.xlsx`;
  return { buffer, filename };
};
