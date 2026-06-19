import db from '../../config/db.js';

/**
 * Fetch all transaction records matching the date, filters, and user jurisdiction.
 */
export const getDailyDiaryData = async (date, filters, user) => {
  let query = db('records')
    .select(
      'records.*',
      'ps.name_en as ps_name',
      'dist.name_en as district_name',
      'u.username as creator_name'
    )
    .leftJoin('hierarchy_nodes as ps', 'records.ps_id', 'ps.id')
    .leftJoin('hierarchy_nodes as dist', 'records.district_id', 'dist.id')
    .leftJoin('users as u', 'records.created_by', 'u.id')
    .where('records.record_date', date);

  // Exclude Drafts to ensure only verified, submitted, or SHO-approved records are reported
  query = query.whereNot('records.current_status', 'DRAFT');

  // Enforce role-based geographical boundary filters
  const { role, ps_id, district_id, sub_div_id } = user;
  
  if (role === 'HC' || role === 'SHO') {
    query = query.where('records.ps_id', ps_id);
  } else if (role === 'DISTRICT_OFFICER') {
    query = query.where('records.district_id', district_id);
  } else if (role === 'ACP') {
    query = query.where('records.sub_div_id', sub_div_id);
  }

  // Handle specific request filters
  if (filters.psId || filters.station_id) {
    const requestedPsId = filters.psId || filters.station_id;
    if (['HQ_ANALYST', 'HQ_ADMIN', 'SYSTEM_ADMIN'].includes(role) || 
        ((role === 'HC' || role === 'SHO') && ps_id === requestedPsId) ||
        (role === 'DISTRICT_OFFICER' && district_id === filters.districtId)) {
      query = query.where('records.ps_id', requestedPsId);
    }
  }
  if (filters.districtId || filters.district_id) {
    const requestedDistrictId = filters.districtId || filters.district_id;
    if (['HQ_ANALYST', 'HQ_ADMIN', 'SYSTEM_ADMIN'].includes(role) || 
        (role === 'DISTRICT_OFFICER' && district_id === requestedDistrictId)) {
      query = query.where('records.district_id', requestedDistrictId);
    }
  }

  const rawRecords = await query.orderBy('records.created_at', 'asc');

  // Parse raw JSON data block
  return rawRecords.map(r => {
    let dataObj = {};
    if (typeof r.data === 'string') {
      try {
        dataObj = JSON.parse(r.data);
      } catch (e) {
        dataObj = {};
      }
    } else if (r.data && typeof r.data === 'object') {
      dataObj = r.data;
    }
    return {
      ...r,
      parsedData: dataObj
    };
  });
};

/**
 * Maps transaction records into 34 distinct worksheet arrays.
 */
export const mapRecordsToSheets = (records, user) => {
  const getCases = () => records.filter(r => r.record_type === 'CASE' || r.record_type === 'CASES');
  const getArrests = () => records.filter(r => r.record_type === 'ARREST');
  const getPcr = () => records.filter(r => r.record_type === 'PCR_CALL' || r.record_type === 'PCR');
  const getMissing = () => records.filter(r => r.record_type === 'MISSING');
  const getUidb = () => records.filter(r => r.record_type === 'UIDB');

  const sheetsData = {};

  // Helper function to clean text matching
  const hasHead = (headStr, val) => headStr && headStr.toLowerCase().includes(val.toLowerCase());

  // 1. Manual FIR
  sheetsData['excel_1manual_fir'] = getCases().filter(c => !c.parsedData.zero_fir_flag).map(c => ({
    ps: c.ps_name || '',
    fir_no: c.parsedData.fir_no || '',
    us: c.parsedData.sections || c.parsedData.under_sections || '',
    name_of_complainant: c.parsedData.complainant_name || '',
    father_husband_name_of_complainant: c.parsedData.father_husband_name_of_complainant || '',
    address_of_complainant: c.parsedData.complainant_address || '',
    time_of_occurrence: c.parsedData.occurrence_time || c.parsedData.gd_time || '',
    place_of_occurrence: c.parsedData.occurrence_place || '',
    time_of_occurrence_1: c.parsedData.occurrence_time || c.parsedData.gd_time || '',
    place_of_occurrence_1: c.parsedData.occurrence_place || '',
    gist: c.parsedData.brief_facts || '',
    arrested_person: c.parsedData.accused_name || '',
    name_of_accused: c.parsedData.accused_name || ''
  }));

  // 2. E-Burglary Cases
  sheetsData['excel_2eburglary_cases'] = getCases().filter(c => hasHead(c.parsedData.local_head, 'burglary')).map((c, i) => ({
    sr_no: String(i + 1),
    ps: c.ps_name || '',
    efir_no: c.parsedData.fir_no || '',
    us: c.parsedData.sections || '',
    name_of_complainant: c.parsedData.complainant_name || '',
    father_husband_name_of_complainant: c.parsedData.father_husband_name_of_complainant || '',
    address_of_complainant: c.parsedData.complainant_address || '',
    time_of_occurrence: c.parsedData.occurrence_time || c.parsedData.gd_time || '',
    stolen_items: c.parsedData.property_description || '',
    place_of_occurrence: c.parsedData.occurrence_place || '',
    io_name: c.parsedData.io_name || '',
    io_mobile_no: c.parsedData.io_mobile || '',
    beat_no: c.parsedData.beat_no || ''
  }));

  // 3. E-House Theft Cases
  sheetsData['excel_3ehouse_theft_cases'] = getCases().filter(c => hasHead(c.parsedData.local_head, 'house theft')).map((c, i) => ({
    sr_no: String(i + 1),
    ps: c.ps_name || '',
    efir_no: c.parsedData.fir_no || '',
    us: c.parsedData.sections || '',
    name_of_complainant: c.parsedData.complainant_name || '',
    father_husband_name_of_complainant: c.parsedData.father_husband_name_of_complainant || '',
    address_of_complainant: c.parsedData.complainant_address || '',
    place_of_occurrence: c.parsedData.occurrence_place || '',
    time_of_occurrence: c.parsedData.occurrence_time || c.parsedData.gd_time || '',
    stolen_items: c.parsedData.property_description || '',
    place_of_occurrence_1: c.parsedData.occurrence_place || '',
    io_name: c.parsedData.io_name || '',
    io_mobile_no: c.parsedData.io_mobile || '',
    beat_no: c.parsedData.beat_no || ''
  }));

  // 4. E-Other Theft Cases
  sheetsData['excel_4eother_theft_cases'] = getCases().filter(c => hasHead(c.parsedData.local_head, 'theft') && !hasHead(c.parsedData.local_head, 'house')).map((c, i) => ({
    sr_no: String(i + 1),
    ps: c.ps_name || '',
    efir_no: c.parsedData.fir_no || '',
    us: c.parsedData.sections || '',
    name_of_complainant: c.parsedData.complainant_name || '',
    father_husband_name_of_complainant: c.parsedData.father_husband_name_of_complainant || '',
    address_of_complainant: c.parsedData.complainant_address || '',
    time_of_occurrence: c.parsedData.occurrence_time || c.parsedData.gd_time || '',
    stolen_items: c.parsedData.property_description || '',
    place_of_occurrence: c.parsedData.occurrence_place || '',
    io_name: c.parsedData.io_name || '',
    io_mobile_no: c.parsedData.io_mobile || '',
    beat_no: c.parsedData.beat_no || ''
  }));

  // 5. MVT Cases
  sheetsData['excel_5mvt_cases'] = getCases().filter(c => hasHead(c.parsedData.local_head, 'mvct') || c.parsedData.emvt_flag).map((c, i) => ({
    sr: String(i + 1),
    ps: c.ps_name || '',
    fir_no: c.parsedData.fir_no || '',
    us: c.parsedData.sections || '',
    date_of_occurrence: c.parsedData.occurrence_date || '',
    time_of_occurrence: c.parsedData.occurrence_time || c.parsedData.gd_time || '',
    place_of_occurrence: c.parsedData.occurrence_place || '',
    name_of_complainant: c.parsedData.complainant_name || '',
    father_husband_name_of_complainant: c.parsedData.father_husband_name_of_complainant || '',
    address_of_complainant: c.parsedData.complainant_address || '',
    vehicle_no: c.parsedData.vehicle_no || '',
    vehicle_type: c.parsedData.vehicle_type || '',
    io_name: c.parsedData.io_name || '',
    io_mobile_no: c.parsedData.io_mobile || '',
    beat_no: c.parsedData.beat_no || '',
    '1st_cd_uploaded_in_24_hrs_yesno': c.parsedData.cctns_flag ? 'YES' : 'NO',
    whether_footage_is_collected_or_not: c.parsedData.footage_collected ? 'YES' : 'NO'
  }));

  // 6. Arrested All Heads (Summary counts)
  const allArrests = getArrests();
  sheetsData['excel_6arrested_all_heads'] = [{
    bnsipc: String(allArrests.filter(r => r.parsedData.act_name && (r.parsedData.act_name.toLowerCase().includes('ipc') || r.parsedData.act_name.toLowerCase().includes('bns'))).length),
    total_no_dd_126170_bnss: String(allArrests.filter(r => r.parsedData.sections && r.parsedData.sections.includes('126/170')).length),
    total_no_dd_126169_bnss: String(allArrests.filter(r => r.parsedData.sections && r.parsedData.sections.includes('126/169')).length),
    total_no_dd_109_bnss: String(allArrests.filter(r => r.parsedData.sections && r.parsedData.sections.includes('109')).length),
    '109_g': '0',
    total_l_no_dd_110_bnss: String(allArrests.filter(r => r.parsedData.sections && r.parsedData.sections.includes('110')).length),
    '110_g': '0',
    '929397_dp_act': String(allArrests.filter(r => r.parsedData.sections && (r.parsedData.sections.includes('92') || r.parsedData.sections.includes('93') || r.parsedData.sections.includes('97')) && r.parsedData.act_name && r.parsedData.act_name.toLowerCase().includes('dp')).length),
    total_no_dd_40_ex: String(allArrests.filter(r => r.parsedData.sections && r.parsedData.sections.includes('40') && r.parsedData.act_name && r.parsedData.act_name.toLowerCase().includes('excise')).length),
    '40_ex': String(allArrests.filter(r => r.parsedData.sections && r.parsedData.sections.includes('40') && r.parsedData.act_name && r.parsedData.act_name.toLowerCase().includes('excise')).length),
    '351d': '0',
    aact: String(allArrests.filter(r => r.parsedData.act_name && r.parsedData.act_name.toLowerCase().includes('arms')).length),
    gact: String(allArrests.filter(r => r.parsedData.act_name && r.parsedData.act_name.toLowerCase().includes('gambling')).length),
    '33_ex': String(allArrests.filter(r => r.parsedData.sections && r.parsedData.sections.includes('33') && r.parsedData.act_name && r.parsedData.act_name.toLowerCase().includes('excise')).length),
    ndps: String(allArrests.filter(r => r.parsedData.act_name && r.parsedData.act_name.toLowerCase().includes('ndps')).length),
    others_act: String(allArrests.filter(r => r.parsedData.crime_head === 'LOCAL' && r.parsedData.act_name && !r.parsedData.act_name.toLowerCase().includes('ndps')).length),
    others_bnss: '0',
    po: String(allArrests.filter(r => r.parsedData.crime_head === 'PO' || r.parsedData.status === 'po').length)
  }];

  // Helper function to map arrest row
  const mapArrestRow = (r, idx) => ({
    sn: String(idx + 1),
    fir_no: r.parsedData.linked_fir_dd_no || '',
    us: r.parsedData.sections || '',
    name: r.parsedData.arrested_name || '',
    father_husband_name: r.parsedData.father_husband_name || '',
    address: r.parsedData.arrested_address || '',
    age: r.parsedData.age ? String(r.parsedData.age) : '',
    name_of_io: r.parsedData.io_name || '',
    pcjcbail: r.parsedData.status || '',
    prev_involvement_no_of_cases: String(r.parsedData.prev_involvement || 0),
    recovery: r.parsedData.recovery || '',
    whether_accused_is_bc_or_not: r.parsedData.is_bc ? 'YES' : 'NO',
    integrated_pi: r.parsedData.arrested_under_special_scheme === 'integrated patrolling' ? 'YES' : 'NO',
    group_patrolling: r.parsedData.arrested_under_special_scheme === 'group patrolling' ? 'YES' : 'NO',
    cycle_patrolling: r.parsedData.arrested_under_special_scheme === 'cycle patrolling' ? 'YES' : 'NO',
    by_antisnatching_team: r.parsedData.arrested_under_special_scheme === 'anti snatching' ? 'YES' : 'NO',
    by_prahari: r.parsedData.arrested_under_special_scheme === 'PRAHARI' ? 'YES' : 'NO',
    by_eyes_ears_scheme_members: r.parsedData.arrested_under_special_scheme === 'Eye and ear scheme' ? 'YES' : 'NO'
  });

  // 7. Arrested East District (All arrests in jurisdiction)
  sheetsData['excel_7arrested_east_district'] = allArrests.map(mapArrestRow);

  // 8. Arrested Kalandara
  sheetsData['excel_8arrested_kalandara'] = allArrests
    .filter(r => r.parsedData.crime_head === 'PREVENTIVE' || (r.parsedData.sections && (r.parsedData.sections.includes('126') || r.parsedData.sections.includes('109') || r.parsedData.sections.includes('110'))))
    .map((r, i) => ({
      ...mapArrestRow(r, i),
      firdd_no: r.parsedData.linked_fir_dd_no || '',
      place_of_occurrence: r.parsedData.arrest_place || '',
      io: r.parsedData.io_name || '',
      prev_involvement: String(r.parsedData.prev_involvement || 0),
      integrated_pick: r.parsedData.arrested_under_special_scheme === 'integrated patrolling' ? 'YES' : 'NO'
    }));

  // 9. Arrested E-FIR Theft
  sheetsData['excel_9arrested_efir_theft'] = allArrests
    .filter(r => r.parsedData.crime_head === 'Theft' || (r.parsedData.linked_fir_dd_no && r.parsedData.linked_fir_dd_no.includes('Theft')))
    .map((r, i) => ({
      ...mapArrestRow(r, i),
      firdd_no: r.parsedData.linked_fir_dd_no || '',
      prev_involvement_no_of_cases_head: String(r.parsedData.prev_involvement || 0),
      group_rolling: r.parsedData.arrested_under_special_scheme === 'group patrolling' ? 'YES' : 'NO'
    }));

  // 10. Arrested E-FIR MV Theft
  sheetsData['excel_10arrested_efir_mv_theft'] = allArrests
    .filter(r => hasHead(r.parsedData.act_name, 'mvt') || (r.parsedData.linked_fir_dd_no && r.parsedData.linked_fir_dd_no.includes('MVT')))
    .map((r, i) => ({
      ...mapArrestRow(r, i),
      fir_no: r.parsedData.linked_fir_dd_no || '',
      integrated_rate_picked: r.parsedData.arrested_under_special_scheme === 'integrated patrolling' ? 'YES' : 'NO'
    }));

  // 11. Proclaimed Offenders
  sheetsData['excel_11proclaimed_offenders'] = allArrests.filter(r => r.parsedData.crime_head === 'PO' || r.parsedData.status === 'po').map((r, i) => ({
    sn: String(i + 1),
    ps: r.ps_name || '',
    dd_nofir_no: r.parsedData.linked_fir_dd_no || '',
    us: r.parsedData.sections || '',
    details_of_po_name: r.parsedData.arrested_name || '',
    details_of_po_parental: r.parsedData.father_husband_name || '',
    details_of_po_address: r.parsedData.arrested_address || '',
    case_in_which_declared_po: r.parsedData.linked_fir_dd_no || '',
    name_of_court_which_declared_po: 'District Court'
  }));

  // 12. Listed Criminals Action
  sheetsData['excel_12listed_criminals_action'] = allArrests.filter(r => r.parsedData.crime_head === 'LISTED').map((r, i) => ({
    sn: String(i + 1),
    name_of_ps: r.ps_name || '',
    name_of_criminal: r.parsedData.arrested_name || '',
    category: 'BC',
    normal_arrest_in_fir: 'YES',
    '126169_bnss': '0',
    '126170_bnss': '0',
    '129_bnss_110_g_crpc': '0',
    arrest_of_po: 'NO',
    externment_proposal: 'NO',
    history_sheet_proposal: 'NO',
    tracing_an_absent_bc: 'NO',
    '107_bnss': '0',
    '111_bnss': '0',
    '112_bnss': '0',
    others: '0',
    remarks: ''
  }));

  // 13. Arrested 24 Hrs List
  sheetsData['excel_13arrested_24_hrs_list'] = allArrests.map((r, i) => ({
    s_no: String(i + 1),
    name_nick_name: r.parsedData.arrested_name || '',
    father_namehusband_name: r.parsedData.father_husband_name || '',
    address: r.parsedData.arrested_address || '',
    age: r.parsedData.age ? String(r.parsedData.age) : '',
    firdd_no: r.parsedData.linked_fir_dd_no || '',
    us: r.parsedData.sections || '',
    police_station: r.ps_name || '',
    name_of_io: r.parsedData.io_name || '',
    rank_of_io: 'Inspector',
    mobile_no_of_io: '',
    remarks_pc_remand_formal_arrest_bail_etc: r.parsedData.status || ''
  }));

  const mapDisposalRow = (c, i) => ({
    s_no: String(i + 1),
    fir_no: c.parsedData.fir_no || '',
    date: c.record_date || '',
    us: c.parsedData.sections || '',
    rc: 'Chargesheet',
    challan_untrace_cancel: c.parsedData.status || ''
  });

  // 14. PI Disposal Manual
  sheetsData['excel_14pi_disposal_manual'] = getCases()
    .filter(c => ['chargesheeted', 'closed'].includes(String(c.parsedData.status).toLowerCase()) && !c.parsedData.zero_fir_flag)
    .map(mapDisposalRow);

  // 15. PI Disposal E-Property
  sheetsData['excel_15pi_disposal_eproperty'] = getCases()
    .filter(c => ['chargesheeted', 'closed'].includes(String(c.parsedData.status).toLowerCase()) && hasHead(c.parsedData.local_head, 'theft'))
    .map(mapDisposalRow);

  // 16. PI Disposal E-MVT
  sheetsData['excel_16pi_disposal_emvt'] = getCases()
    .filter(c => ['chargesheeted', 'closed'].includes(String(c.parsedData.status).toLowerCase()) && (hasHead(c.parsedData.local_head, 'mvct') || c.parsedData.emvt_flag))
    .map(mapDisposalRow);

  // 17. Juveniles Conflict Law
  sheetsData['excel_17juveniles_conflict_law'] = allArrests
    .filter(r => r.parsedData.age && parseInt(r.parsedData.age, 10) < 18)
    .map((r, i) => ({
      sr_no: String(i + 1),
      police_station: r.ps_name || '',
      firdd_no: r.parsedData.linked_fir_dd_no || '',
      date: r.record_date || '',
      us: r.parsedData.sections || '',
      name_of_juvenile: r.parsedData.arrested_name || '',
      fathjer_husband_name_of_juvenile: r.parsedData.father_husband_name || '',
      address_of_juvenile: r.parsedData.arrested_address || '',
      category_of_juvenile: 'Minor',
      age_of_juvenile: String(r.parsedData.age),
      action_intervention_by_police_iojwongo: r.parsedData.io_name || '',
      present_status_of_juvenile: r.parsedData.status || '',
      order_by_cwcjjb: 'Pending JJB Order',
      brief_factsremarks: ''
    }));

  // 18. Missing Persons
  sheetsData['excel_18missing_persons'] = getMissing().map((r, i) => ({
    sno: String(i + 1),
    dd_no: r.parsedData.dd_no || '',
    dd_date: r.parsedData.dd_date || '',
    name_of_operator_to_whom_mps: r.creator_name || '',
    name_of_missing_person: r.parsedData.missing_name || '',
    address_of_missing_person: r.parsedData.complainant_address || '',
    missing_date: r.parsedData.missing_date || '',
    age: r.parsedData.age ? String(r.parsedData.age) : '',
    height: '165 cm',
    built: 'Medium',
    complexion: 'Fair',
    face: 'Oval',
    hair: 'Black',
    beard: 'No',
    mustaches: 'No',
    upper_dress_color: '',
    lower_dress_color: '',
    name_of_io: r.parsedData.io_name || ''
  }));

  // 19. UIDB
  sheetsData['excel_19uidb'] = getUidb().map((r, i) => ({
    sno: String(i + 1),
    dd_no: r.parsedData.dd_no || '',
    dd_date: r.record_date || '',
    found_place: r.parsedData.found_place || '',
    found_date: r.parsedData.found_date || '',
    sex: r.parsedData.gender || 'Unknown',
    age: r.parsedData.approx_age || '',
    height: '170 cm',
    built: 'Medium',
    complexion: 'Wheatish',
    face: 'Round',
    hair: 'Grey',
    beard: 'No',
    mustaches: 'No',
    upper_dress_color: '',
    lower_dress_color: '',
    name_of_io: r.parsedData.io_name || ''
  }));

  // 20. Abandoned Persons
  sheetsData['excel_20abandoned_persons'] = getMissing().filter(r => hasHead(r.parsedData.status, 'abandoned')).map((r, i) => ({
    sno: String(i + 1),
    dd_no: r.parsedData.dd_no || '',
    found_place: r.parsedData.missing_place || '',
    found_date: r.parsedData.missing_date || '',
    sex: r.parsedData.gender || '',
    age: r.parsedData.age ? String(r.parsedData.age) : '',
    height: '',
    built: '',
    complexion: '',
    face: '',
    hair: '',
    beard: '',
    mustaches: '',
    upper_dress_color: '',
    lower_dress_color: '',
    name_of_io: r.parsedData.io_name || ''
  }));

  // 21. Traced Persons
  sheetsData['excel_21traced_persons'] = getMissing().filter(r => r.parsedData.status === 'Traced').map((r, i) => ({
    sno: String(i + 1),
    dd_no: r.parsedData.dd_no || '',
    dd_date: r.parsedData.dd_date || '',
    name_of_operator_to_whom_mps: r.creator_name || '',
    name_of_traced_person: r.parsedData.missing_name || '',
    fatherhusband_name_of_traced_person: '',
    address_of_traced_person: '',
    name_of_io: r.parsedData.io_name || ''
  }));

  // 22. Women Missing
  const missingFemales = getMissing().filter(r => r.parsedData.gender === 'Female');
  sheetsData['excel_22women_missing'] = [{
    pcr_call: '0',
    dd_entry_complaint: String(missingFemales.length),
    total: String(missingFemales.length),
    traced: String(missingFemales.filter(r => r.parsedData.status === 'Traced').length),
    case_registered: '0',
    pending: String(missingFemales.filter(r => r.parsedData.status === 'Missing' || r.parsedData.status === 'Open').length)
  }];

  // 23. Children Missing
  const missingChildren = getMissing().filter(r => r.parsedData.age && parseInt(r.parsedData.age, 10) < 18);
  const minorMales = missingChildren.filter(r => r.parsedData.gender === 'Male');
  const minorFemales = missingChildren.filter(r => r.parsedData.gender === 'Female');
  sheetsData['excel_23children_missing'] = [{
    pcr_call_male: '0',
    pcr_call_female: '0',
    dd_entrycomplaint_male: String(minorMales.length),
    dd_entrycomplaint_female: String(minorFemales.length),
    total_male: String(minorMales.length),
    total_female: String(minorFemales.length),
    traced_male: String(minorMales.filter(r => r.parsedData.status === 'Traced').length),
    traced_female: String(minorFemales.filter(r => r.parsedData.status === 'Traced').length),
    case_registered_male: '0',
    case_registered_female: '0'
  }];

  // 24. Preventive Action
  sheetsData['excel_24preventive_action'] = allArrests.filter(r => r.parsedData.crime_head === 'PREVENTIVE').map(r => ({
    persons_detained: r.parsedData.arrested_name || '',
    dd_no_us_661_66_dp_act: r.parsedData.linked_fir_dd_no || '',
    no_of_us_661_66_dp_act: '1',
    dd_no_129_bnss_128_bnss: '',
    no_of_129_bnss_128_bnss: '0',
    dd_no_40a_b_delhi_excise_act: '',
    no_of_40a_b_delhi_excise_act: '0',
    dd_no_126169_bnss: '',
    no_of_126169_bnss: '0',
    dd_no_126170_bnss: '',
    no_of_126170_bnss: '0',
    dd_no_bc_check: '',
    no_of_bc_check: '0',
    dd_no_929397_dp_act: '',
    no_of_929397_dp_act: '0'
  }));

  // 25. Inquest Registered
  sheetsData['excel_25inquest_registered'] = getCases().filter(c => hasHead(c.parsedData.local_head, 'inquest')).map((c, i) => ({
    sn: String(i + 1),
    dd_no: c.parsedData.gd_no || '',
    date: c.parsedData.gd_date || '',
    us: c.parsedData.sections || '',
    name_of_deceased: c.parsedData.accused_name || 'Unidentified Body',
    fatherhusband_name_of_deceased: '',
    address_of_deceased: '',
    sex: 'Male',
    age: '',
    cause_of_death: 'Unknown',
    place_of_occurrence: c.parsedData.occurrence_place || '',
    io: c.parsedData.io_name || ''
  }));

  // 26. Inquest ACP-SDM Disposal
  sheetsData['excel_26inquest_acpsdm_disposal'] = getCases()
    .filter(c => hasHead(c.parsedData.local_head, 'inquest') && c.parsedData.status === 'Closed')
    .map((c, i) => ({
      sno: String(i + 1),
      dd_no: c.parsedData.gd_no || '',
      date: c.parsedData.gd_date || '',
      us: c.parsedData.sections || '',
      name_of_deceased: c.parsedData.accused_name || '',
      fatherhusband_name_of_deceased: '',
      address_of_deceased: '',
      sex: '',
      age: '',
      cause_of_death: '',
      date_of_filed_by_acpsdm: c.record_date || ''
    }));

  // 27. Important Cases
  const importantHeads = ['murder', 'robbery', 'dacoity', 'snatching', 'rape', 'burglary'];
  sheetsData['excel_27important_cases'] = getCases()
    .filter(c => c.parsedData.local_head && importantHeads.includes(c.parsedData.local_head.toLowerCase()))
    .map((c, i) => ({
      s_no: String(i + 1),
      case_type_category_of_offence: c.parsedData.local_head || '',
      police_station: c.ps_name || '',
      district: c.district_name || '',
      fir_no: c.parsedData.fir_no || '',
      date_ddmmyyyy: c.parsedData.fir_date || '',
      under_sections_act_ipc_bns_bnss: c.parsedData.sections || '',
      brief_facts_of_the_case: c.parsedData.brief_facts || '',
      accused_person_name: c.parsedData.accused_name || '',
      fathers_name: '',
      recovery_made_property_weapon_cash_etc: c.parsedData.property_description || ''
    }));

  // 28. FIR Goswara Summary
  const localCases = getCases();
  sheetsData['excel_28fir_goswara_summary'] = [{
    district: user.district_name || 'East District',
    manual_fir: String(localCases.filter(c => !c.parsedData.zero_fir_flag).length),
    theft_efir: String(localCases.filter(c => hasHead(c.parsedData.local_head, 'theft') && !hasHead(c.parsedData.local_head, 'house')).length),
    house_theft_efir: String(localCases.filter(c => hasHead(c.parsedData.local_head, 'house theft')).length),
    burglary_efir: String(localCases.filter(c => hasHead(c.parsedData.local_head, 'burglary')).length),
    mvt_motor_vehicle_theft: String(localCases.filter(c => hasHead(c.parsedData.local_head, 'mvct') || c.parsedData.emvt_flag).length),
    total: String(localCases.length)
  }];

  // 29. Financial Fraud Arrest
  sheetsData['excel_29financial_fraud_arrest'] = allArrests
    .filter(r => hasHead(r.parsedData.crime_head, 'fraud') || hasHead(r.parsedData.crime_head, 'cyber'))
    .map(r => ({
      zone: 'Zone-II',
      range: 'Eastern Range',
      district: r.district_name || '',
      case_fir_no: r.parsedData.linked_fir_dd_no || '',
      us: r.parsedData.sections || '',
      date: r.record_date || '',
      ps: r.ps_name || '',
      cheated_amount: '',
      modus_operandi: '',
      no_of_accused_arrested: '1',
      respective_role_of_accused: ''
    }));

  // 30. Patrolling Checking
  const pcrCalls = getPcr();
  sheetsData['excel_30patrolling_checking'] = [{
    district: user.district_name || 'East District',
    no_of_vulnerable_areas_parks_other_crime_spots: '12',
    time_slot_for_conducting_patrolling_checking_caso: '2100 - 0000 Hrs',
    excise: String(allArrests.filter(r => hasHead(r.parsedData.act_name, 'excise')).length),
    gambling: String(allArrests.filter(r => hasHead(r.parsedData.act_name, 'gambling')).length),
    other_legal_action: '0',
    sec_65_dp_act_delhi_police_act_unlawful_assembly_prohibition_order: '0',
    sec_66_dp_act_delhi_police_act_being_drunk_in_public_place: '0',
    sec_40a40b_excise_act_delhi_excise_act_possession_transport_of_liquor_without_permit: '0',
    sec_126169_bnss_bharatiya_nagarik_suraksha_sanhita_unlawful_assembly_dispersal: '0',
    sec_126170_bnss_bharatiya_nagarik_suraksha_sanhita_use_of_force_to_disperse_assembly: '0',
    sec_128_bnss_bharatiya_nagarik_suraksha_sanhita_power_of_officer_to_disperse_assembly: '0',
    sec_129_bnss_bharatiya_nagarik_suraksha_sanhita_use_of_armed_force_for_public_order: '0',
    counselling_of_juveniles: '0'
  }];

  // 31. NDPS Action
  const ndpsCases = getCases().filter(c => hasHead(c.parsedData.act_name, 'ndps'));
  const ndpsArrests = allArrests.filter(r => hasHead(r.parsedData.act_name, 'ndps'));
  sheetsData['excel_31ndps_action'] = [{
    s_no: '1',
    district: user.district_name || 'East District',
    no_of_ps: '1',
    cases_registered_under_ndps_act: String(ndpsCases.length),
    qty_recovered: '',
    persons_arrested_bound_down: String(ndpsArrests.length)
  }];

  // 32. Servant Verification
  sheetsData['excel_32servant_verification'] = [{
    s_no: '1',
    district: user.district_name || 'East District',
    no_of_ps: '1',
    verification_form_filled_up_today: '0',
    verification_form_filled_up_upto_date: '0',
    sent_for_address_verification_within_delhi: '0',
    sent_for_address_verification_outside_delhi: '0'
  }];

  // 33. Mobile Recovered PS
  sheetsData['excel_33mobile_recovered_ps'] = getCases()
    .filter(c => hasHead(c.parsedData.property_description, 'mobile') || hasHead(c.parsedData.property_description, 'phone'))
    .map((c, i) => ({
      sr_no: String(i + 1),
      fir_no_comp_no: c.parsedData.fir_no || '',
      fir_date: c.parsedData.fir_date || '',
      police_station: c.ps_name || '',
      mobile_model: '',
      status: c.parsedData.property_status || '',
      recovery_date: c.record_date || '',
      handed_over_seized: c.parsedData.property_status === 'Recovered' ? 'Handed Over' : 'Seized',
      name_of_police_officer_who_recovered_the_mobile: c.parsedData.io_name || ''
    }));

  // 34. Mobile Recovered Summary
  const recoveredMobilesCount = sheetsData['excel_33mobile_recovered_ps'].length;
  sheetsData['excel_34mobile_recovered_summary'] = [{
    sno: '1',
    police_station: user.ps_name || 'PS Gazipur',
    no_of_mobile_phones_recovered_by_ps: String(recoveredMobilesCount),
    mobile_recovered_by_mobile_tracing_team: '0',
    total: String(recoveredMobilesCount)
  }];

  return sheetsData;
};
