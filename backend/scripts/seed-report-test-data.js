/**
 * seed-report-test-data.js
 *
 * Seeds one full day's worth of test data for 2026-06-22 covering every
 * report view in the daily-diary Excel workbook.
 *
 * Run with:  node scripts/seed-report-test-data.js
 */

import { db, connectDB } from '../src/config/db.js';
import { runWarehouseSync } from '../src/modules/warehouse/etl/sync.js';

const DATE = new Date(Date.now() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
const PS_NDD     = 'PS_NDD_PARLIAMENTSTREET';
const DIST_NDD   = 'DIST_NDD';
const PS_EAST    = 'PS_ED_MADHUVIHAR';
const DIST_EAST  = 'DIST_ED';
const NOW = new Date().toISOString();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function record(id, type, psId, distId, data) {
  return {
    id,
    record_type: type,
    ps_id: psId,
    district_id: distId,
    data: JSON.stringify(data),
    current_status: 'HQ_RECEIVED',
    current_level: 'HQ',
    record_date: DATE,
    created_by: 'U_SA001',
    created_at: NOW,
    updated_at: NOW,
  };
}

// Returns a complete FIR data object for records.data
// ETL reads: fir_no, fir_date, gd_no, gd_date, gd_time, beat_no, occurrence_date,
//            occurrence_place, local_head, act_name, sections, brief_facts,
//            complainant_name, complainant_address, accused_name, accused_address,
//            io_name, io_pis, io_mobile, property_description, property_status,
//            status, cctns_flag, zero_fir_flag, remarks
// View reads additionally: occurrence_time, complainant_parent_name, accused_parent_name,
//            stolen_property_value, vehicle_no, vehicle_type, cd_uploaded_24hrs, footage_collected
function firData(firNo, localHead, sections, complainant, place, opts = {}) {
  return {
    fir_no: firNo,
    fir_date: DATE,
    gd_no: `DD/2026/${9000 + Number(firNo.replace(/\D/g, '').slice(-3))}`,
    gd_date: DATE,
    gd_time: '08:30:00',
    beat_no: `Beat-${Number(firNo.replace(/\D/g, '').slice(-3)) % 5 + 1}`,
    occurrence_date: DATE,
    occurrence_time: opts.time || '10:30:00',
    occurrence_place: place,
    local_head: localHead,
    act_name: opts.actName || 'BNS',
    sections: sections,
    brief_facts: opts.facts || `Complaint filed at PS Parliament Street. ${localHead} case. Investigation in progress.`,
    complainant_name: complainant,
    complainant_address: opts.addr || '123 Test Street, New Delhi - 110001',
    complainant_parent_name: opts.parent || `Father of ${complainant}`,
    accused_name: opts.accused || null,
    accused_address: null,
    io_name: opts.io || 'SI Test Officer',
    io_pis: opts.ioPis || 'PIS10099',
    io_mobile: opts.ioMobile || '9810000099',
    property_description: opts.property || null,
    stolen_property_value: opts.value || null,
    recovered_property_desc: opts.recovered || null,
    vehicle_no: opts.vehicleNo || null,
    vehicle_type: opts.vehicleType || null,
    cd_uploaded_24hrs: opts.cdUploaded || null,
    footage_collected: opts.footage || null,
    property_status: opts.propStatus || null,
    status: opts.status || 'Open',
    cctns_flag: opts.cctns !== undefined ? opts.cctns : false,
    zero_fir_flag: false,
    remarks: '',
  };
}

// Returns a complete ARREST data object for records.data
// ETL reads: arrested_name, arrest_date, arrest_place, crime_head, sections, act_name,
//            io_name, linked_fir_dd_no, status (custody status), nafis_prepared, dossier_prepared
// View reads additionally: arrested_parent_name, arrested_age, io_mobile, io_rank,
//            prev_involvement_count, is_po, po_declared_court, po_case_reference,
//            seizure_desc, is_bc, is_dd_based, special_scheme, beat_no
function arrestData(arrestedName, crimeHead, sections, opts = {}) {
  return {
    arrested_name: arrestedName,
    arrested_age: opts.age || '28',
    arrested_parent_name: opts.parent || `Father of ${arrestedName}`,
    arrested_address: '456 Accused Lane, New Delhi',
    arrest_date: opts.arrestDate || DATE,
    arrest_place: opts.place || 'Near PS Gate, Parliament Street',
    crime_head: crimeHead,
    sections: sections,
    act_name: opts.actName || 'BNS',
    io_name: opts.io || 'SI Arresting Officer',
    io_mobile: opts.ioMobile || '9810000001',
    io_rank: opts.ioRank || 'SI',
    linked_fir_dd_no: opts.firNo || null,
    status: opts.status || 'police_custody',
    nafis_prepared: false,
    dossier_prepared: false,
    prev_involvement_count: opts.prevCount || '0',
    is_po: opts.isPO || null,
    po_declared_court: opts.poCourt || null,
    po_case_reference: opts.poCaseRef || null,
    is_dd_based: opts.isDDBased || null,
    seizure_desc: opts.seizure || null,
    is_bc: opts.isBC || null,
    beat_no: opts.beatNo || null,
  };
}

// Returns a complete MISSING data object for records.data
// ETL reads: dd_no, dd_date, missing_name, age, gender, major_minor, missing_date,
//            missing_place, physical_description, informant_name, informant_mobile,
//            io_name, zipnet_no, status (→ missing_status)
// View reads additionally: missing_parent_name, last_seen_address, found_place,
//            found_date, height, built, complexion, face, hair, beard, mustaches,
//            upper_dress_color, lower_dress_color, pcr_call, case_registered, abandoned
function missingData(missingName, gender, opts = {}) {
  return {
    dd_no: opts.ddNo || `DD/2026/${7000 + Math.floor(Math.random() * 99)}`,
    dd_date: DATE,
    missing_name: missingName,
    age: opts.age || 30,
    gender: gender,
    major_minor: opts.majorMinor || 'Major',
    missing_date: opts.missingDate || DATE,
    missing_place: opts.missingPlace || 'Connaught Place, New Delhi',
    physical_description: opts.physDesc || 'Medium height, wheatish complexion',
    informant_name: opts.informant || `Informant of ${missingName}`,
    informant_mobile: opts.infoMobile || '9820000001',
    io_name: opts.io || 'SI Missing Officer',
    zipnet_no: opts.zipnet || `ZN${DATE.replace(/-/g,'')}01`,
    status: opts.status || 'Missing',
    missing_parent_name: opts.parent || `Parent of ${missingName}`,
    last_seen_address: opts.lastSeen || 'ISBT Delhi',
    found_place: opts.foundPlace || null,
    found_date: opts.foundDate || null,
    height: opts.height || '168cm',
    built: opts.built || 'Medium',
    complexion: opts.complexion || 'Wheatish',
    face: opts.face || 'Oval',
    hair: opts.hair || 'Black',
    beard: opts.beard || null,
    mustaches: opts.mustaches || null,
    upper_dress_color: opts.upperDress || 'Blue',
    lower_dress_color: opts.lowerDress || 'Grey',
    pcr_call: opts.pcr || null,
    case_registered: null,
    abandoned: opts.abandoned || null,
    remarks: '',
  };
}

// Returns a complete PCR_CALL data object for records.data
// ETL reads: gd_no, gd_date, gd_time, call_head, call_gist, caller_name, caller_mobile,
//            io_name (→ officer_name), arrival_time, status (→ call_status)
// View reads additionally: caller_address, action_taken
function pcrData(gdNo, gdTime, callHead, callGist, opts = {}) {
  return {
    gd_no: gdNo,
    gd_date: DATE,
    gd_time: gdTime,
    call_head: callHead,
    call_gist: callGist,
    caller_name: opts.caller || 'Beat Officer',
    caller_mobile: opts.callerMobile || '9810000099',
    caller_address: opts.callerAddr || 'Near PS Parliament Street, New Delhi',
    io_name: opts.io || 'SI Night Duty Officer',
    arrival_time: opts.arrivalTime || gdTime,
    status: opts.status || 'Closed',
    action_taken: opts.action || 'Action taken as per law. Person detained and released after due process.',
  };
}

// Returns a complete UIDB data object for records.data
// ETL reads: dd_no, found_date, found_place, gender, approx_age, description,
//            io_name, informant_name, zipnet_no, identified, status (→ uidb_status)
// View reads additionally: uidb_gazette_number, dd_date, inquest_sections,
//            name_of_deceased, cause_of_death, filed_by_acp_sdm
function uidbData(ddNo, foundPlace, gender, opts = {}) {
  return {
    dd_no: ddNo,
    dd_date: DATE,
    found_date: DATE,
    found_place: foundPlace,
    gender: gender,
    approx_age: opts.age || '35-45',
    description: opts.description || 'Body found, no identification available',
    io_name: opts.io || 'SI UIDB Officer',
    informant_name: opts.informant || 'Station Master',
    informant_mobile: opts.infoMobile || '9810000201',
    zipnet_no: opts.zipnet || `UDB${DATE.replace(/-/g,'')}01`,
    identified: false,
    status: opts.status || 'Unidentified, held in mortuary',
    uidb_gazette_number: opts.gazette || `UIDB/2026/${ddNo.slice(-3)}`,
    inquest_sections: opts.inquest || '174 CrPC',
    name_of_deceased: opts.deceased || 'Unknown Deceased',
    deceased_parent_name: null,
    cause_of_death: opts.cause || 'Under Investigation',
    filed_by_acp_sdm: opts.filedACP || false,
    date_filed_acp_sdm: opts.dateFiledACP || null,
    remarks: '',
  };
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function seed() {
  await connectDB();
  console.log(`\n[seed] Seeding test data for ${DATE}...\n`);

  // ── 1. Fix dim_crime_head normalized values to match ETL normalization ───────
  // ETL uses normalizeCrimeHead(v) = v.trim().toUpperCase()
  // We seeded sk=15 with 'HOUSE_THEFT' (underscore) and sk=16 with 'MVT' —
  // but the ETL normalizes 'House Theft' → 'HOUSE THEFT' and 'M.V. Theft' → 'M.V. THEFT'
  // Fix: update to the correct normalized forms so ETL lookups succeed.
  await db.raw(`
    UPDATE rpt.dim_crime_head SET value_normalized = 'HOUSE THEFT'  WHERE sk = 15;
    UPDATE rpt.dim_crime_head SET value_normalized = 'M.V. THEFT'   WHERE sk = 16;
    SELECT setval(pg_get_serial_sequence('rpt.dim_crime_head', 'sk'), (SELECT MAX(sk) FROM rpt.dim_crime_head), true);
    SELECT setval(pg_get_serial_sequence('rpt.dim_case_status', 'sk'), (SELECT MAX(sk) FROM rpt.dim_case_status), true);
  `);
  console.log('[seed] Fixed dim_crime_head normalized values and advanced sequences');

  // ── 2. Wipe previous SD_ rows (delete → reinsert ensures fresh data) ─────────
  // Deletion order respects FKs: bridge → fact tables → record_links → records
  await db('rpt.bridge_fir_arrest')
    .where(function() { this.where('fir_sk', '>=', 1000).orWhere('arrest_sk', '>=', 2000); })
    .delete();
  await db('rpt.fact_fir').where('source_record_id', 'like', 'SD_F_%').delete();
  await db('rpt.fact_arrest').where('source_record_id', 'like', 'SD_A_%').delete();
  await db('rpt.fact_missing').where('source_record_id', 'like', 'SD_M_%').delete();
  await db('rpt.fact_uidb').where('source_record_id', 'like', 'SD_U_%').delete();
  await db('rpt.fact_pcr').where('source_record_id', 'like', 'SD_PCR_%').delete();
  await db('record_links')
    .where('source_record_id', 'like', 'SD_%')
    .orWhere('target_record_id', 'like', 'SD_%')
    .delete();
  await db('records').whereILike('id', 'SD_%').delete();
  console.log('[seed] Cleared previous SD_ seed rows');

  // ── 3. Build all records with COMPLETE records.data ───────────────────────────
  // The warehouse ETL reads records.data and populates fact_* tables.
  // We must put ALL fields the ETL and view layers need into records.data.

  const allRecords = [
    // ── FIR (CASE) records ────────────────────────────────────────────────────
    // rpt_01 Manual FIR  — localHead must NOT be a theft type (→ case_reg_type MANUAL_FIR)
    record('SD_F_001', 'CASE', PS_NDD, DIST_NDD,
      firData('FIR/2026/T001', 'Murder', '101 BNS', 'Sita Devi', 'Connaught Place',
        { time: '10:30:00', facts: 'Murder of victim found near Connaught Place. Complaint filed by sister.', io: 'SI Ramesh Kumar', ioPis: 'PIS10001', ioMobile: '9810000001' })),

    record('SD_F_002', 'CASE', PS_NDD, DIST_NDD,
      firData('FIR/2026/T002', 'Robbery', '309 BNS', 'Ram Prasad', 'Barakhamba Road',
        { time: '14:00:00', facts: 'Robbery with grievous hurt to victim. Accused armed with knife inflicted injuries.', io: 'SI Suresh Singh', ioPis: 'PIS10002', ioMobile: '9810000002' })),

    record('SD_F_003', 'CASE', PS_NDD, DIST_NDD,
      firData('FIR/2026/T003', 'IPC', '420 BNS', 'Mohan Lal', 'Janpath',
        { time: '22:15:00', io: 'HC Vijay Kumar', ioPis: 'PIS10003', ioMobile: '9810000003' })),

    // rpt_02 E-Burglary (Day Burglary → case_reg_type E_THEFT)
    record('SD_F_004', 'CASE', PS_NDD, DIST_NDD,
      firData('FIR/2026/T004', 'Day Burglary', '331(4) BNS', 'Geeta Singh', 'Karol Bagh',
        { time: '03:00:00', property: 'Gold ornaments', value: '15000',
          facts: 'Burglary in locked premises. Entry through rear window.', io: 'SI Amit Verma', ioPis: 'PIS10004', ioMobile: '9810000004' })),

    record('SD_F_005', 'CASE', PS_NDD, DIST_NDD,
      firData('FIR/2026/T005', 'Day Burglary', '331(4) BNS', 'Suresh Kumar', 'Patel Nagar',
        { time: '04:30:00', property: 'Cash Rs.8000', value: '8000',
          facts: 'Day burglary at residence. Cash and jewellery stolen.', io: 'SI Anil Sharma', ioPis: 'PIS10005', ioMobile: '9810000005' })),

    // rpt_03 E-House Theft (House Theft → case_reg_type E_THEFT)
    record('SD_F_006', 'CASE', PS_NDD, DIST_NDD,
      firData('FIR/2026/T006', 'House Theft', '305(a) BNS', 'Anita Sharma', 'Lajpat Nagar',
        { time: '12:00:00', property: 'Laptop and cash', value: '25000',
          io: 'SI Pradeep Kumar', ioPis: 'PIS10006', ioMobile: '9810000006' })),

    record('SD_F_007', 'CASE', PS_NDD, DIST_NDD,
      firData('FIR/2026/T007', 'House Theft', '305(a) BNS', 'Deepak Gupta', 'Saket',
        { time: '15:00:00', property: 'Jewellery', value: '5000',
          io: 'HC Naveen Yadav', ioPis: 'PIS10007', ioMobile: '9810000007' })),

    // rpt_04 E-Other Theft (Theft In Shop → case_reg_type E_THEFT)
    record('SD_F_008', 'CASE', PS_NDD, DIST_NDD,
      firData('FIR/2026/T008', 'Theft In Shop', '303(2) BNS', 'Vijay Merchant', 'Khan Market',
        { time: '11:00:00', io: 'SI Kiran Bala', ioPis: 'PIS10008', ioMobile: '9810000008' })),

    record('SD_F_009', 'CASE', PS_NDD, DIST_NDD,
      firData('FIR/2026/T009', 'Theft In Shop', '303(2) BNS', 'Priya Trader', 'South Ex',
        { time: '16:00:00', io: 'SI Rajiv Malhotra', ioPis: 'PIS10009', ioMobile: '9810000009' })),

    // rpt_05 E-MVT (M.V. Theft → case_reg_type E_MVT)
    record('SD_F_010', 'CASE', PS_NDD, DIST_NDD,
      firData('FIR/2026/T010', 'M.V. Theft', '379 BNS', 'Ravi Kumar', 'ITO Parking',
        { time: '09:00:00', vehicleNo: 'DL3C-1234', vehicleType: 'Motorcycle',
          cdUploaded: 'true', footage: 'true',
          io: 'SI Mohan Das', ioPis: 'PIS10010', ioMobile: '9810000010' })),

    record('SD_F_011', 'CASE', PS_NDD, DIST_NDD,
      firData('FIR/2026/T011', 'M.V. Theft', '379 BNS', 'Sunita Verma', 'CP Parking',
        { time: '17:00:00', vehicleNo: 'DL5S-5678', vehicleType: 'Car',
          io: 'SI Geeta Rani', ioPis: 'PIS10011', ioMobile: '9810000011' })),

    // rpt_14 PI Disposal Manual FIR — status=Chargesheeted, localHead → MANUAL_FIR
    record('SD_F_012', 'CASE', PS_NDD, DIST_NDD,
      firData('FIR/2026/T012', 'Murder', '101 BNS', 'Closed Case One', 'Delhi Gate',
        { facts: 'Chargesheeted case. Investigation complete and report filed.', status: 'Chargesheeted', io: 'Insp. Verma', ioPis: 'PIS10012', ioMobile: '9810000012' })),

    record('SD_F_013', 'CASE', PS_NDD, DIST_NDD,
      firData('FIR/2026/T013', 'Robbery', '309 BNS', 'Closed Case Two', 'Paharganj',
        { status: 'Chargesheeted', io: 'SI Kuldeep', ioPis: 'PIS10013', ioMobile: '9810000013' })),

    // rpt_15 PI Disposal E-Property Theft — status=Chargesheeted, localHead → E_THEFT
    record('SD_F_014', 'CASE', PS_NDD, DIST_NDD,
      firData('FIR/2026/T014', 'Day Burglary', '331(4) BNS', 'Disposed Burglary One', 'Karol Bagh',
        { property: 'Recovered gold', status: 'Chargesheeted', io: 'SI Arjun', ioPis: 'PIS10014', ioMobile: '9810000014' })),

    record('SD_F_015', 'CASE', PS_NDD, DIST_NDD,
      firData('FIR/2026/T015', 'House Theft', '305(a) BNS', 'Disposed Theft Two', 'Dwarka',
        { status: 'Chargesheeted', io: 'HC Asha', ioPis: 'PIS10015', ioMobile: '9810000015' })),

    // rpt_16 PI Disposal E-MVT — status=Chargesheeted, localHead → E_MVT
    record('SD_F_016', 'CASE', PS_NDD, DIST_NDD,
      firData('FIR/2026/T016', 'M.V. Theft', '379 BNS', 'MVT Disposed One', 'Nehru Place',
        { vehicleNo: 'DL7Y-9999', vehicleType: 'Scooty', status: 'Chargesheeted', io: 'SI Navneet', ioPis: 'PIS10016', ioMobile: '9810000016' })),

    record('SD_F_017', 'CASE', PS_NDD, DIST_NDD,
      firData('FIR/2026/T017', 'M.V. Theft', '379 BNS', 'MVT Disposed Two', 'Sarita Vihar',
        { vehicleNo: 'DL2A-4321', vehicleType: 'Truck', status: 'Chargesheeted', io: 'SI Deepa', ioPis: 'PIS10017', ioMobile: '9810000017' })),

    // ── ARREST records ────────────────────────────────────────────────────────
    // rpt_07 East District arrests (records must be from PS Madhu Vihar, East District)
    record('SD_A_001', 'ARREST', PS_EAST, DIST_EAST,
      arrestData('Rajesh Sharma', 'Theft', '379 BNS',
        { age: '28', parent: 'Ram Lal', io: 'SI East Officer 1', ioMobile: '9811000101', ioRank: 'SI',
          prevCount: '2', isBC: 'false', seizure: 'One mobile phone', status: 'police_custody' })),

    record('SD_A_002', 'ARREST', PS_EAST, DIST_EAST,
      arrestData('Mukesh Yadav', 'Robbery', '309 BNS',
        { age: '35', parent: 'Shyam Lal', io: 'SI East Officer 2', ioMobile: '9811000102', ioRank: 'SI',
          prevCount: '1', isBC: 'true', status: 'judicial_custody' })),

    // rpt_08 Kalandara – DD-based (is_dd_based='true', sections contain 126 or 170 BNSS)
    record('SD_A_003', 'ARREST', PS_NDD, DIST_NDD,
      arrestData('Ramu Chamar', 'Preventive', '126 BNSS',
        { age: '22', parent: 'Hari Dass', io: 'SI Kala', ioMobile: '9811000103', actName: 'BNSS',
          prevCount: '0', isDDBased: 'true', firNo: 'DD/2026/8001', status: 'bail' })),

    record('SD_A_004', 'ARREST', PS_NDD, DIST_NDD,
      arrestData('Bhola Paswan', 'Preventive', '170 BNSS',
        { age: '45', parent: 'Ganga Prasad', io: 'HC Devi', ioMobile: '9811000104', actName: 'BNSS',
          prevCount: '3', isDDBased: 'true', firNo: 'DD/2026/8002', status: 'bail' })),

    // rpt_09 E-Theft arrested (linked to burglary FIRs via fir_no)
    record('SD_A_005', 'ARREST', PS_NDD, DIST_NDD,
      arrestData('Bablu Chor', 'Day Burglary', '331(4) BNS',
        { age: '30', parent: 'Theft Father 1', io: 'SI Theft IO 1', ioMobile: '9811000105',
          prevCount: '5', isBC: 'true', seizure: 'Gold ornament recovered',
          firNo: 'FIR/2026/T004', status: 'police_custody' })),

    record('SD_A_006', 'ARREST', PS_NDD, DIST_NDD,
      arrestData('Pappu Chor', 'Day Burglary', '331(4) BNS',
        { age: '19', parent: 'Theft Father 2', io: 'SI Theft IO 2', ioMobile: '9811000106',
          prevCount: '2', isBC: 'false',
          firNo: 'FIR/2026/T005', status: 'judicial_custody' })),

    // rpt_10 E-MVT arrested (linked to MVT FIRs via fir_no)
    record('SD_A_007', 'ARREST', PS_NDD, DIST_NDD,
      arrestData('Gyandu MVT 1', 'M.V. Theft', '379 BNS',
        { age: '25', parent: 'MVT Father 1', io: 'SI MVT IO 1', ioMobile: '9811000107',
          prevCount: '3', seizure: 'Motorcycle recovered',
          firNo: 'FIR/2026/T010', status: 'police_custody' })),

    record('SD_A_008', 'ARREST', PS_NDD, DIST_NDD,
      arrestData('Babbu MVT 2', 'M.V. Theft', '379 BNS',
        { age: '32', parent: 'MVT Father 2', io: 'SI MVT IO 2', ioMobile: '9811000108',
          prevCount: '1', seizure: 'Car partially recovered',
          firNo: 'FIR/2026/T011', status: 'judicial_custody' })),

    // rpt_11 Proclaimed Offenders
    record('SD_A_009', 'ARREST', PS_NDD, DIST_NDD,
      arrestData('Declared PO One', 'Murder', '209 CrPC',
        { age: '40', parent: 'PO Father 1', io: 'SI PO IO 1', ioMobile: '9811000109',
          isPO: 'true', poCourt: 'Sessions Court Delhi', poCaseRef: 'SC/2024/001',
          status: 'judicial_custody' })),

    record('SD_A_010', 'ARREST', PS_NDD, DIST_NDD,
      arrestData('Declared PO Two', 'Robbery', '209 CrPC',
        { age: '38', parent: 'PO Father 2', io: 'SI PO IO 2', ioMobile: '9811000110',
          isPO: 'true', poCourt: 'MM Court Patiala House', poCaseRef: 'MM/2023/452',
          status: 'police_custody' })),

    // rpt_13 24-hr arrests (arrest_date = DATE)
    record('SD_A_011', 'ARREST', PS_NDD, DIST_NDD,
      arrestData('Fresh Arrest One', 'Theft', '303(2) BNS',
        { age: '27', parent: '24hr Father 1', io: 'SI 24hr IO 1', ioMobile: '9811000111', ioRank: 'SI',
          prevCount: '0', status: 'police_custody' })),

    record('SD_A_012', 'ARREST', PS_NDD, DIST_NDD,
      arrestData('Fresh Arrest Two', 'Robbery', '309 BNS',
        { age: '31', parent: '24hr Father 2', io: 'HC 24hr IO 2', ioMobile: '9811000112', ioRank: 'HC',
          prevCount: '1', status: 'judicial_custody' })),

    // ── MISSING records ───────────────────────────────────────────────────────
    // rpt_18 Missing Persons (status='Missing')
    record('SD_M_001', 'MISSING', PS_NDD, DIST_NDD,
      missingData('Ramesh Singh', 'Male',
        { ddNo: 'DD/2026/7001', age: 35, status: 'Missing', missingPlace: 'ISBT Delhi',
          parent: 'Suresh Singh', lastSeen: 'ISBT Delhi, Platform 3',
          height: '170cm', built: 'Medium', complexion: 'Wheatish', hair: 'Black',
          upperDress: 'Blue shirt', lowerDress: 'Grey trousers', pcr: 'true',
          io: 'SI Missing 1', zipnet: 'ZN202601' })),

    record('SD_M_002', 'MISSING', PS_NDD, DIST_NDD,
      missingData('Kamla Devi', 'Female',
        { ddNo: 'DD/2026/7002', age: 28, status: 'Missing', missingPlace: 'Connaught Place',
          parent: 'Ramdev Devi', lastSeen: 'Connaught Place, Gate 5',
          height: '155cm', built: 'Slim', complexion: 'Fair', hair: 'Black long',
          upperDress: 'Red saree', lowerDress: 'Red saree',
          io: 'SI Missing 2', zipnet: 'ZN202602' })),

    // rpt_20 Abandoned Persons (status='Abandoned' OR data.abandoned='true')
    record('SD_M_003', 'MISSING', PS_NDD, DIST_NDD,
      missingData('Unknown Male 1', 'Male',
        { ddNo: 'DD/2026/7003', age: 50, status: 'Abandoned',
          missingPlace: 'Railway Station Platform 3', foundPlace: 'Railway Station Platform 3',
          built: 'Thin', complexion: 'Dark', hair: 'Grey', abandoned: 'true',
          io: 'SI Missing 3', zipnet: 'ZN202603' })),

    record('SD_M_004', 'MISSING', PS_NDD, DIST_NDD,
      missingData('Unknown Male 2', 'Male',
        { ddNo: 'DD/2026/7004', age: 60, status: 'Abandoned',
          missingPlace: 'Nizamuddin Bridge', foundPlace: 'Nizamuddin Bridge',
          built: 'Heavy', complexion: 'Dark', hair: 'White', abandoned: 'true',
          io: 'SI Missing 4', zipnet: 'ZN202604' })),

    // rpt_21 Traced Persons (missing_status='Traced')
    record('SD_M_005', 'MISSING', PS_NDD, DIST_NDD,
      missingData('Sunita Rani', 'Female',
        { ddNo: 'DD/2026/7005', age: 22, status: 'Traced',
          parent: 'Traced Parent 1', lastSeen: 'Paharganj Market',
          io: 'SI Missing 5', zipnet: 'ZN202605' })),

    record('SD_M_006', 'MISSING', PS_NDD, DIST_NDD,
      missingData('Vikram Nath', 'Male',
        { ddNo: 'DD/2026/7006', age: 45, status: 'Traced',
          parent: 'Traced Parent 2', lastSeen: 'Karol Bagh, Main Road',
          io: 'SI Missing 6', zipnet: 'ZN202606' })),

    // ── UIDB records ──────────────────────────────────────────────────────────
    // rpt_19 UIDB / Inquest
    record('SD_U_001', 'UIDB', PS_NDD, DIST_NDD,
      uidbData('DD/2026/8001', 'Railway Track Area', 'Male',
        { age: '35-40', description: 'Body found near railway track, no identification',
          io: 'SI UIDB Officer 1', informant: 'Station Master Ravi',
          zipnet: 'UDB20260801', gazette: 'UIDB/2026/001',
          inquest: '174 CrPC', deceased: 'Unknown Deceased 1',
          cause: 'Under Investigation' })),

    record('SD_U_002', 'UIDB', PS_NDD, DIST_NDD,
      uidbData('DD/2026/8002', 'Yamuna Bank, Okhla', 'Unknown',
        { age: '30-35', description: 'Body found at river bank, drowning suspected',
          io: 'SI UIDB Officer 2', informant: 'Local Resident Shyam',
          zipnet: 'UDB20260802', gazette: 'UIDB/2026/002',
          inquest: '174 CrPC', deceased: 'Unknown Deceased 2',
          cause: 'Drowning (suspected)', filedACP: true, dateFiledACP: DATE })),

    // ── PCR_CALL records for Sheet 15 (Preventive Action) ─────────────────────
    // Sheet 15 reads pcr_kalandra_master (view on fact_pcr) for diary_record_date=DATE
    // and gd_entry_time >= 21:00. The call_head / call_gist keywords drive category counts.
    record('SD_PCR_001', 'PCR_CALL', PS_NDD, DIST_NDD,
      pcrData('DD/2026/9001', '21:30:00', 'Preventive',
        'Person detained U/S 66 DP Act during night patrol. Beat officer deputed immediately.',
        { io: 'SI Night Duty 1', action: 'Person detained U/S 66 DP Act. Released after verification.' })),

    record('SD_PCR_002', 'PCR_CALL', PS_NDD, DIST_NDD,
      pcrData('DD/2026/9002', '22:00:00', 'Preventive',
        'Person detained U/S 126/169 BNSS for roaming suspiciously at night.',
        { io: 'SI Night Duty 2', action: 'Person detained U/S 126/169 BNSS. Released after due process.' })),

    record('SD_PCR_003', 'PCR_CALL', PS_NDD, DIST_NDD,
      pcrData('DD/2026/9003', '22:30:00', 'BC Check',
        'BC check conducted at Connaught Place. Person detained U/S 40A Delhi Police Act.',
        { io: 'HC Night Duty 3', action: 'BC check conducted. Detained person released after process.' })),

    record('SD_PCR_004', 'PCR_CALL', PS_NDD, DIST_NDD,
      pcrData('DD/2026/9004', '23:00:00', 'Preventive',
        'Person detained U/S 92/93 DP Act for suspicious behaviour during night patrolling.',
        { io: 'SI Night Duty 4', action: 'Person detained U/S 92/93 DP Act and released after verification.' })),

    record('SD_PCR_005', 'PCR_CALL', PS_NDD, DIST_NDD,
      pcrData('DD/2026/9005', '23:15:00', 'Preventive',
        'Person detained U/S 126/170 BNSS during night checking. Beat officer deputed.',
        { io: 'HC Night Duty 5', action: 'Person detained and released after due verification.' })),

    record('SD_PCR_006', 'PCR_CALL', PS_NDD, DIST_NDD,
      pcrData('DD/2026/9006', '23:30:00', 'Preventive',
        'Two persons detained U/S 128 BNSS / 129 BNSS during night rounds at Janpath.',
        { io: 'SI Night Duty 6', action: 'Both persons detained U/S 128/129 BNSS. Released after process.' })),

    // ── Financial Fraud FIR + Arrest for Sheet 19 ─────────────────────────────
    // Sheet 19 joins arrest_master → record_links → fir_master where crime_head='Cheating'
    record('SD_F_018', 'CASE', PS_NDD, DIST_NDD,
      firData('FIR/2026/T018', 'Cheating', '420 IPC', 'Online Victim One', 'Connaught Place',
        { facts: 'Victim cheated of Rs.2,50,000 by online fraudster posing as bank official. Accused created fake bank account.',
          io: 'SI Fraud IO 1', ioPis: 'PIS10018', ioMobile: '9810000018',
          actName: 'IPC', property: 'Rs.2,50,000 transferred to fraudulent account', value: '250000' })),

    record('SD_A_013', 'ARREST', PS_NDD, DIST_NDD,
      arrestData('Fraud Accused One', 'Cheating', '420 IPC',
        { age: '33', parent: 'Fraud Father 1', io: 'SI Fraud IO 1', ioMobile: '9810000018',
          firNo: 'FIR/2026/T018', status: 'police_custody', prevCount: '2',
          seizure: 'Laptop, SIM cards, and fraudulent bank documents recovered',
          actName: 'IPC' })),

    // ── NDPS FIR + Arrest for Sheet 21 ────────────────────────────────────────
    // Sheet 21 cases: crime_head_name='Narcotics Drugs & Psychotropic Substances Act'
    // Sheet 21 arrests: sections LIKE '%NDPS%' (OR fallback even without a linked FIR)
    record('SD_F_019', 'CASE', PS_NDD, DIST_NDD,
      firData('FIR/2026/T019', 'Narcotics Drugs & Psychotropic Substances Act', '20 NDPS Act',
        'NDPS Informant One', 'Near Railway Station',
        { facts: 'Accused found in possession of 500 grams of Ganja (cannabis). Recovered from person during checking.',
          io: 'SI NDPS IO 1', ioPis: 'PIS10019', ioMobile: '9810000019',
          actName: 'NDPS Act', property: '500 grams Ganja recovered', value: '5000' })),

    record('SD_A_014', 'ARREST', PS_NDD, DIST_NDD,
      arrestData('NDPS Accused One', 'Narcotics Drugs & Psychotropic Substances Act', '20 NDPS Act',
        { age: '26', parent: 'NDPS Father 1', io: 'SI NDPS IO 1', ioMobile: '9810000019',
          firNo: 'FIR/2026/T019', status: 'police_custody', prevCount: '1',
          seizure: '500 grams Ganja recovered from accused person',
          actName: 'NDPS Act' })),
  ];

  // ── 4. Insert public.records ───────────────────────────────────────────────
  await db('records').insert(allRecords);
  console.log(`[seed] Inserted ${allRecords.length} records into public.records`);

  // ── 4b. Insert record_links for Sheet 19 (Financial Fraud) ────────────────
  // Sheet 19 queries arrest_master JOIN record_links JOIN fir_master WHERE link_type=CASE_ARREST
  // The CASE_ARREST link_type_id comes from link_type_registry.
  const caseArrestLinkTypeId = '960245db-67d7-4f93-bd6a-dcbe9525fba2';
  await db('record_links').insert([
    {
      id: db.raw('gen_random_uuid()'),
      link_type_id: caseArrestLinkTypeId,
      source_record_id: 'SD_F_018',  // Cheating FIR
      target_record_id: 'SD_A_013',  // Cheating arrest
      metadata: null,
      created_by: 'U_SA001',
      created_at: NOW,
    },
    {
      id: db.raw('gen_random_uuid()'),
      link_type_id: caseArrestLinkTypeId,
      source_record_id: 'SD_F_019',  // NDPS FIR
      target_record_id: 'SD_A_014',  // NDPS arrest
      metadata: null,
      created_by: 'U_SA001',
      created_at: NOW,
    },
  ]);
  console.log('[seed] Inserted record_links for SD_F_018→SD_A_013 and SD_F_019→SD_A_014');

  // ── 5. Run full warehouse sync to populate fact tables from records.data ──────
  // This is the authoritative ETL path. It reads records.data and populates
  // rpt.fact_fir, rpt.fact_arrest, rpt.fact_missing, rpt.fact_uidb, and
  // rpt.bridge_fir_arrest automatically.
  console.log('[seed] Running warehouse sync (forceFullSync=true)...');
  try {
    await runWarehouseSync('ALL', true);
    console.log('[seed] Warehouse sync complete');
  } catch (err) {
    console.error('[seed] Warehouse sync error:', err.message);
    console.error('[seed] Fact tables may be incomplete — check warehouse/etl logs');
  }

  // ── 6. Verify counts ────────────────────────────────────────────────────────
  console.log('\n[seed] Verifying view row counts for date=' + DATE + ':');
  const views = [
    'rpt_01_manual_fir', 'rpt_02_e_burglary_cases', 'rpt_03_e_house_theft_cases',
    'rpt_04_e_other_theft_cases', 'rpt_05_mvt_cases', 'rpt_07_arrested_east_district',
    'rpt_08_arrested_kalandara', 'rpt_09_arrested_efir_theft', 'rpt_10_arrested_efir_mv_theft',
    'rpt_11_proclaimed_offenders', 'rpt_13_arrested_24hrs_list', 'rpt_14_pi_disposal_manual',
    'rpt_15_pi_disposal_e_property', 'rpt_16_pi_disposal_e_mvt', 'rpt_18_missing_persons',
    'rpt_19_uidb', 'rpt_20_abandoned_persons', 'rpt_21_traced_persons',
  ];
  for (const v of views) {
    try {
      const isDateFiltered = v !== 'rpt_13_arrested_24hrs_list';
      const q = db.raw(`SELECT COUNT(*) as cnt FROM ${v}` + (isDateFiltered ? ` WHERE diary_record_date = '${DATE}'` : ''));
      const r = await q;
      const cnt = r.rows[0].cnt;
      const ok = parseInt(cnt) > 0 ? '✓' : '✗ EMPTY';
      console.log(`  ${ok}  ${v}: ${cnt}`);
    } catch (e) {
      console.log(`  !  ${v}: ERROR — ${e.message.substring(0, 80)}`);
    }
  }

  // Verify Sheet 15 (pcr_kalandra_master — night preventive entries)
  try {
    const pcrRows = await db.raw(
      `SELECT COUNT(*) as cnt FROM pcr_kalandra_master WHERE diary_record_date = '${DATE}' AND gd_entry_time >= '21:00:00'`
    );
    const cnt = pcrRows.rows[0].cnt;
    console.log(`  ${parseInt(cnt) > 0 ? '✓' : '✗ EMPTY'}  pcr_kalandra_master (night ≥21:00): ${cnt}`);
  } catch (e) {
    console.log(`  !  pcr_kalandra_master: ERROR — ${e.message.substring(0, 80)}`);
  }

  // Verify Sheet 19 (Cheating arrest via record_links)
  try {
    const fraudRows = await db('arrest_master as am')
      .join('record_links as rl', 'rl.target_record_id', '=', 'am.record_uid')
      .join('link_type_registry as ltr', 'ltr.id', '=', 'rl.link_type_id')
      .join('fir_master as fm', 'fm.record_uid', '=', 'rl.source_record_id')
      .join('ref_crime_head as ch', 'ch.crime_head_id', '=', 'fm.crime_head_id')
      .where('ltr.code', 'CASE_ARREST')
      .where('am.diary_record_date', DATE)
      .whereIn('ch.crime_head_name', ['Cheating', 'Information Technology Act 2000', 'Criminal Breach of Trust', 'Counterfeiting', 'Forgery'])
      .count('* as cnt').first();
    const cnt = Number(fraudRows.cnt);
    console.log(`  ${cnt > 0 ? '✓' : '✗ EMPTY'}  fraud_arrests_via_links (Sheet 19): ${cnt}`);
  } catch (e) {
    console.log(`  !  fraud check: ERROR — ${e.message.substring(0, 80)}`);
  }

  // Verify Sheet 21 (NDPS arrests)
  try {
    const ndpsRows = await db('arrest_master as am')
      .where('am.diary_record_date', DATE)
      .where('am.sections', 'like', '%NDPS%')
      .count('* as cnt').first();
    const cnt = Number(ndpsRows.cnt);
    console.log(`  ${cnt > 0 ? '✓' : '✗ EMPTY'}  ndps_arrests (Sheet 21): ${cnt}`);
  } catch (e) {
    console.log(`  !  NDPS check: ERROR — ${e.message.substring(0, 80)}`);
  }

  console.log('\n[seed] Done. Generate report for date=' + DATE);
  await db.destroy();
}

seed().catch(e => { console.error('[seed] FATAL:', e); process.exit(1); });
