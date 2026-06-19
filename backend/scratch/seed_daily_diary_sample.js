/**
 * Seeds a comprehensive set of sample records on a single test date so that
 * ALL 34 Daily Diary worksheets/reports get populated. Idempotent: every row
 * uses the id prefix `R_DD_TEST_` and is deleted + re-inserted on each run.
 *
 * Usage: node scratch/seed_daily_diary_sample.js [YYYY-MM-DD]
 */
import db from '../src/config/db.js';

const TEST_DATE = process.argv[2] || '2026-06-19';
const PREFIX = 'R_DD_TEST_';

// Valid hierarchy + creator combo pulled from existing records (FK-safe).
const LOC = {
  ps_id: 'PS_NDD_PARLIAMENTSTREET',
  district_id: 'DIST_NDD',
  sub_div_id: 'SUBDIV_DIST_NDD_1',
  created_by: 'U_HC001'
};

const now = new Date().toISOString();
let seq = 0;
const rows = [];

function rec(record_type, data, overrides = {}) {
  seq += 1;
  rows.push({
    id: `${PREFIX}${String(seq).padStart(3, '0')}`,
    record_type,
    ps_id: LOC.ps_id,
    district_id: LOC.district_id,
    sub_div_id: LOC.sub_div_id,
    data: JSON.stringify(data),
    current_status: 'HQ_RECEIVED',
    current_level: 'HQ',
    record_date: TEST_DATE,
    created_by: LOC.created_by,
    updated_by: LOC.created_by,
    created_at: now,
    updated_at: now,
    is_legacy: false,
    ...overrides
  });
}

// ── CASES ──────────────────────────────────────────────────────────────────
// Burglary (sheets 1 manual_fir, 2 eburglary, 27 important[burglary])
rec('CASE', {
  fir_no: 'FIR/DD/2001', fir_date: TEST_DATE, gd_no: 'GD/2001', gd_date: TEST_DATE, gd_time: '08:15',
  beat_no: 'B-11', local_head: 'Burglary', act_name: 'BNS', sections: '305',
  occurrence_date: TEST_DATE, occurrence_time: '02:30', occurrence_place: 'Sector 5 Market',
  complainant_name: 'Anil Verma', father_husband_name_of_complainant: 'Ram Verma',
  complainant_address: '12, Sector 5, New Delhi', brief_facts: 'House broken into overnight, valuables stolen.',
  property_description: 'Gold jewellery, cash', io_name: 'Insp. Rao', io_mobile: '9811112222',
  status: 'Open', zero_fir_flag: false
});

// House Theft + chargesheeted (1, 3, 14 disposal_manual, 15 disposal_eproperty)
rec('CASE', {
  fir_no: 'FIR/DD/2002', fir_date: TEST_DATE, local_head: 'House Theft', act_name: 'BNS', sections: '303',
  occurrence_time: '14:00', occurrence_place: 'Green Park', complainant_name: 'Sunita Devi',
  father_husband_name_of_complainant: 'Mohan Lal', complainant_address: 'B-7, Green Park',
  brief_facts: 'Theft from residence during day.', property_description: 'Laptop, watch',
  io_name: 'SI Khan', io_mobile: '9822223333', beat_no: 'B-3', status: 'Chargesheeted', zero_fir_flag: false
});

// Other Theft + closed (1, 4 eother_theft, 14, 15)
rec('CASE', {
  fir_no: 'FIR/DD/2003', fir_date: TEST_DATE, local_head: 'Other Theft', act_name: 'BNS', sections: '303(2)',
  occurrence_time: '19:45', occurrence_place: 'Bus Stand', complainant_name: 'Rakesh Gupta',
  father_husband_name_of_complainant: 'Suresh Gupta', complainant_address: '44, Karol Bagh',
  brief_facts: 'Pickpocketing at bus stand.', property_description: 'Wallet',
  io_name: 'SI Meena', io_mobile: '9833334444', beat_no: 'B-9', status: 'Closed', zero_fir_flag: false
});

// MVCT + emvt + chargesheeted (1, 5 mvt_cases, 14, 16 disposal_emvt)
rec('CASE', {
  fir_no: 'FIR/DD/2004', fir_date: TEST_DATE, local_head: 'MVCT', act_name: 'BNS', sections: '303',
  occurrence_date: TEST_DATE, occurrence_time: '23:10', occurrence_place: 'Parking Lot A',
  complainant_name: 'Deepak Singh', father_husband_name_of_complainant: 'Harpal Singh',
  complainant_address: '9, Patel Nagar', vehicle_no: 'DL3CAB1234', vehicle_type: 'Motorcycle',
  io_name: 'Insp. Yadav', io_mobile: '9844445555', beat_no: 'B-2',
  emvt_flag: true, cctns_flag: true, footage_collected: true, status: 'Chargesheeted', zero_fir_flag: false
});

// Inquest + closed (1, 25 inquest_registered, 26 inquest_acpsdm_disposal)
rec('CASE', {
  fir_no: 'FIR/DD/2005', gd_no: 'GD/2005', gd_date: TEST_DATE, local_head: 'Inquest', act_name: 'BNSS',
  sections: '194', occurrence_place: 'Riverbank', accused_name: 'Unidentified Body',
  io_name: 'Insp. Rao', status: 'Closed', zero_fir_flag: false
});

// Murder (1, 27 important[murder])
rec('CASE', {
  fir_no: 'FIR/DD/2006', fir_date: TEST_DATE, local_head: 'Murder', act_name: 'BNS', sections: '103',
  occurrence_place: 'Old Town', complainant_name: 'Police', brief_facts: 'Homicide reported, investigation on.',
  accused_name: 'Vijay (absconding)', io_name: 'Insp. Rao', io_mobile: '9811112222',
  property_description: 'Knife recovered', status: 'Open', zero_fir_flag: false
});

// NDPS (1, 31 ndps_action)
rec('CASE', {
  fir_no: 'FIR/DD/2007', fir_date: TEST_DATE, local_head: 'NDPS', act_name: 'NDPS Act', sections: '20',
  occurrence_place: 'Highway Check Post', complainant_name: 'SHO', brief_facts: 'Contraband recovered.',
  property_description: 'Ganja 2kg', io_name: 'SI Khan', status: 'Open', zero_fir_flag: false
});

// Robbery + mobile recovered (1, 27 important[robbery], 33 mobile_recovered_ps)
rec('CASE', {
  fir_no: 'FIR/DD/2008', fir_date: TEST_DATE, local_head: 'Robbery', act_name: 'BNS', sections: '309',
  occurrence_place: 'Metro Station', complainant_name: 'Pooja Rani',
  father_husband_name_of_complainant: 'Ashok Rani', complainant_address: '21, Lajpat Nagar',
  brief_facts: 'Mobile snatched and later recovered.', property_description: 'Mobile phone (Samsung)',
  property_status: 'Recovered', io_name: 'SI Meena', status: 'Open', zero_fir_flag: false
});

// ── ARRESTS ─────────────────────────────────────────────────────────────────
// Normal IPC/BNS arrest (7 east_district, 13 24hrs, 6 all_heads)
rec('ARREST', {
  linked_fir_dd_no: 'FIR/DD/2006', sections: '103', act_name: 'BNS', arrested_name: 'Vijay Kumar',
  father_husband_name: 'Lala Kumar', arrested_address: 'Slum Area, Old Town', age: 32,
  io_name: 'Insp. Rao', status: 'PC', prev_involvement: 3, recovery: 'Knife', is_bc: true,
  arrested_under_special_scheme: 'PRAHARI'
});

// Preventive + 126/170 (8 kalandara, 24 preventive_action, 6 all_heads)
rec('ARREST', {
  linked_fir_dd_no: 'DD/2010', sections: '126/170 BNSS', act_name: 'BNSS', arrested_name: 'Mahesh Yadav',
  father_husband_name: 'Ganga Yadav', arrested_address: 'Camp Road', age: 41, crime_head: 'PREVENTIVE',
  io_name: 'SI Khan', status: 'Bound Down', prev_involvement: 1, arrest_place: 'Camp Road'
});

// Theft arrest (9 efir_theft)
rec('ARREST', {
  linked_fir_dd_no: 'EFIR Theft 2003', sections: '303', act_name: 'BNS', arrested_name: 'Sanjay Lal',
  father_husband_name: 'Babu Lal', arrested_address: 'Karol Bagh', age: 27, crime_head: 'Theft',
  io_name: 'SI Meena', status: 'JC', prev_involvement: 2,
  arrested_under_special_scheme: 'group patrolling'
});

// MV Theft arrest (10 efir_mv_theft)
rec('ARREST', {
  linked_fir_dd_no: 'EFIR MVT 2004', sections: '303', act_name: 'MVT', arrested_name: 'Imran Sheikh',
  father_husband_name: 'Yusuf Sheikh', arrested_address: 'Patel Nagar', age: 29,
  io_name: 'Insp. Yadav', status: 'PC', prev_involvement: 0,
  arrested_under_special_scheme: 'integrated patrolling'
});

// Proclaimed Offender (11 proclaimed_offenders, 6 all_heads po)
rec('ARREST', {
  linked_fir_dd_no: 'FIR/DD/1900', sections: '309', act_name: 'BNS', arrested_name: 'Ramesh Tomar',
  father_husband_name: 'Dhan Singh', arrested_address: 'Unknown', age: 38, crime_head: 'PO',
  status: 'po', io_name: 'Insp. Rao', prev_involvement: 5
});

// Listed Criminal (12 listed_criminals_action)
rec('ARREST', {
  linked_fir_dd_no: 'FIR/DD/1850', sections: '305', act_name: 'BNS', arrested_name: 'Karan Bawaria',
  father_husband_name: 'Sher Singh', arrested_address: 'Bawana', age: 44, crime_head: 'LISTED',
  io_name: 'SI Khan', status: 'JC', prev_involvement: 8
});

// Juvenile (17 juveniles_conflict_law)
rec('ARREST', {
  linked_fir_dd_no: 'FIR/DD/2003', sections: '303', act_name: 'BNS', arrested_name: 'Minor X',
  father_husband_name: 'Guardian Y', arrested_address: 'Karol Bagh', age: 16,
  io_name: 'SI Meena', status: 'JJB', prev_involvement: 0,
  arrested_under_special_scheme: 'anti snatching'
});

// Financial fraud / cyber (29 financial_fraud_arrest)
rec('ARREST', {
  linked_fir_dd_no: 'FIR/DD/2009', sections: '318', act_name: 'BNS', arrested_name: 'Naveen Agarwal',
  father_husband_name: 'Prem Agarwal', arrested_address: 'Cyber Hub', age: 30, crime_head: 'Cyber Fraud',
  io_name: 'Insp. Cyber', status: 'PC', prev_involvement: 1
});

// Arms + Excise + Gambling + NDPS arrests (feed 6 all_heads counts + 30 patrolling)
rec('ARREST', { linked_fir_dd_no: 'FIR/DD/2011', sections: '25', act_name: 'Arms Act', arrested_name: 'Faisal Khan', father_husband_name: 'Ali Khan', arrested_address: 'Seelampur', age: 33, io_name: 'SI Khan', status: 'JC' });
rec('ARREST', { linked_fir_dd_no: 'DD/2012', sections: '33', act_name: 'Excise Act', arrested_name: 'Gopal Das', father_husband_name: 'Hari Das', arrested_address: 'Wazirpur', age: 36, io_name: 'SI Meena', status: 'Bail' });
rec('ARREST', { linked_fir_dd_no: 'DD/2013', sections: '13', act_name: 'Gambling Act', arrested_name: 'Pawan Joshi', father_husband_name: 'Kishan Joshi', arrested_address: 'Sadar Bazar', age: 39, io_name: 'Insp. Rao', status: 'Bail' });
rec('ARREST', { linked_fir_dd_no: 'FIR/DD/2007', sections: '20', act_name: 'NDPS Act', arrested_name: 'Sohan Singh', father_husband_name: 'Mohan Singh', arrested_address: 'Highway', age: 31, io_name: 'SI Khan', status: 'JC' });

// ── MISSING ─────────────────────────────────────────────────────────────────
// Female adult missing (18 missing_persons, 22 women_missing)
rec('MISSING', {
  dd_no: 'DD/M/3001', dd_date: TEST_DATE, missing_name: 'Geeta Sharma', gender: 'Female', age: 28,
  missing_date: TEST_DATE, complainant_address: 'Tilak Nagar', io_name: 'SI Meena', status: 'Missing'
});
// Male child traced (18, 21 traced_persons, 23 children_missing)
rec('MISSING', {
  dd_no: 'DD/M/3002', dd_date: TEST_DATE, missing_name: 'Rohit (minor)', gender: 'Male', age: 12,
  missing_date: TEST_DATE, complainant_address: 'Janakpuri', io_name: 'SI Khan', status: 'Traced'
});
// Female child abandoned (18, 20 abandoned_persons, 23 children_missing)
rec('MISSING', {
  dd_no: 'DD/M/3003', dd_date: TEST_DATE, missing_name: 'Baby Anu', gender: 'Female', age: 6,
  missing_date: TEST_DATE, missing_place: 'Railway Station', complainant_address: 'Unknown',
  io_name: 'SI Meena', status: 'Abandoned'
});
// Female child traced (22 women? no, women counts all female; 23 children female traced)
rec('MISSING', {
  dd_no: 'DD/M/3004', dd_date: TEST_DATE, missing_name: 'Kavya (minor)', gender: 'Female', age: 10,
  missing_date: TEST_DATE, complainant_address: 'Dwarka', io_name: 'SI Khan', status: 'Traced'
});

// ── UIDB ────────────────────────────────────────────────────────────────────
rec('UIDB', { dd_no: 'DD/U/4001', found_place: 'Yamuna Ghat', found_date: TEST_DATE, gender: 'Male', approx_age: '45-50', io_name: 'Insp. Rao' });
rec('UIDB', { dd_no: 'DD/U/4002', found_place: 'Ring Road', found_date: TEST_DATE, gender: 'Female', approx_age: '30-35', io_name: 'SI Meena' });

// ── PCR CALLS ───────────────────────────────────────────────────────────────
rec('PCR_CALL', { call_no: 'PCR/5001', call_time: '21:30', call_type: 'Quarrel', location: 'Market Road', io_name: 'PCR Van 12' });
rec('PCR_CALL', { call_no: 'PCR/5002', call_time: '22:15', call_type: 'Suspicious Person', location: 'Park Gate', io_name: 'PCR Van 7' });

// ── Persist ─────────────────────────────────────────────────────────────────
async function run() {
  const deleted = await db('records').where('id', 'like', `${PREFIX}%`).del();
  await db('records').insert(rows);
  console.log(`Seed complete for ${TEST_DATE}: removed ${deleted} old test rows, inserted ${rows.length}.`);
  const byType = {};
  rows.forEach(r => { byType[r.record_type] = (byType[r.record_type] || 0) + 1; });
  console.log('By type:', JSON.stringify(byType));
  await db.destroy();
}

run().catch(async (e) => { console.error('Seed failed:', e.message); await db.destroy(); process.exit(1); });
