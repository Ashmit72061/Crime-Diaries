// backend/scripts/seed-dummy-data.js
// Comprehensive test-data seed for PHAROS
// Run: node scripts/seed-dummy-data.js  (from backend/)
// Password for ALL test accounts: Test@1234

import { db, connectDB } from '../src/config/db.js';
import bcrypt from 'bcryptjs';

// ── Hierarchy node IDs (from migration 20260620000000_full_delhi_hierarchy.js) ─
const H = {
  HQ:             'HQ',
  ZONE_Z2:        'ZONE_SCPLOZ',
  JCP_NDR:        'RANGE_NDR',
  DIST_NDD:       'DIST_NDD',
  SUB_NDD_0:      'SUBDIV_DIST_NDD_0',   // Barakhamba Road sub-div
  SUB_NDD_1:      'SUBDIV_DIST_NDD_1',   // Parliament Street sub-div
  PS_PARLIAMENT:  'PS_NDD_PARLIAMENTSTREET',
  PS_CONNAUGHT:   'PS_NDD_CONNAUGHTPLACE',
  JCP_NR:         'RANGE_NR',
  DIST_NWD:       'DIST_NWD',
  SUB_NWD_0:      'SUBDIV_DIST_NWD_0',   // Adarsh Nagar sub-div
  PS_ADARSH:      'PS_NWD_ADARSHNAGAR',
};

const PW = bcrypt.hashSync('Test@1234', 10);

// ── TEST USERS (16 total) ──────────────────────────────────────────────────────
const USERS = [
  // NDD — Parliament Street PS (primary test PS)
  { id:'U_HC001',  username:'hc_parliament_street',  badge_no:'HC001',  name_en:'Ramesh Kumar',      name_hi:'रमेश कुमार',            role:'HC',               station_id:H.PS_PARLIAMENT, district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_1 },
  { id:'U_SHO001', username:'sho_parliament_street', badge_no:'SHO001', name_en:'Vikram Singh',       name_hi:'विक्रम सिंह',           role:'SHO',              station_id:H.PS_PARLIAMENT, district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_1 },
  { id:'U_HC003',  username:'hc_parliament_2',       badge_no:'HC003',  name_en:'Deepak Verma',       name_hi:'दीपक वर्मा',            role:'HC',               station_id:H.PS_PARLIAMENT, district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_1 },
  // NDD — Connaught Place PS (second NDD test PS)
  { id:'U_HC004',  username:'hc_connaught_place',    badge_no:'HC004',  name_en:'Sunita Devi',        name_hi:'सुनीता देवी',           role:'HC',               station_id:H.PS_CONNAUGHT,  district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_0 },
  { id:'U_SHO002', username:'sho_connaught_place',   badge_no:'SHO002', name_en:'Anil Sharma',        name_hi:'अनिल शर्मा',            role:'SHO',              station_id:H.PS_CONNAUGHT,  district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_0 },
  // NDD — ACP (sub-division level)
  { id:'U_ACP001', username:'acp_ndd_subdiv1',       badge_no:'ACP001', name_en:'Rakesh Yadav',       name_hi:'राकेश यादव',            role:'ACP',              station_id:null, district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_1 },
  // NDD — DCP
  { id:'U_DO001',  username:'dcp_ndd',               badge_no:'DO001',  name_en:'Priya Sharma',       name_hi:'प्रिया शर्मा',          role:'DISTRICT_OFFICER', station_id:null, district_id:H.DIST_NDD, sub_div_id:null },
  // New Delhi Range — JCP
  { id:'U_JCP001', username:'jcp_new_delhi_range',   badge_no:'JCP001', name_en:'Rohit Mehta',        name_hi:'रोहित मेहता',           role:'JCP',              station_id:null, district_id:null, sub_div_id:null },
  // Zone 2 — SCP
  { id:'U_SCP001', username:'scp_zone_2',            badge_no:'SCP001', name_en:'Kavita Nair',        name_hi:'कविता नायर',            role:'SCP',              station_id:null, district_id:null, sub_div_id:null },
  // NWD — Adarsh Nagar PS
  { id:'U_HC002',  username:'hc_adarsh_nagar',       badge_no:'HC002',  name_en:'Sunil Dutt',         name_hi:'सुनील दत्त',            role:'HC',               station_id:H.PS_ADARSH, district_id:H.DIST_NWD, sub_div_id:H.SUB_NWD_0 },
  { id:'U_SHO003', username:'sho_adarsh_nagar',      badge_no:'SHO003', name_en:'Geeta Pillai',       name_hi:'गीता पिल्लई',           role:'SHO',              station_id:H.PS_ADARSH, district_id:H.DIST_NWD, sub_div_id:H.SUB_NWD_0 },
  { id:'U_ACP002', username:'acp_nwd_subdiv0',       badge_no:'ACP002', name_en:'Dinesh Rawat',       name_hi:'दिनेश रावत',            role:'ACP',              station_id:null, district_id:H.DIST_NWD, sub_div_id:H.SUB_NWD_0 },
  // NWD — DCP
  { id:'U_DO002',  username:'dcp_nwd',               badge_no:'DO002',  name_en:'Manish Gupta',       name_hi:'मनीष गुप्ता',           role:'DISTRICT_OFFICER', station_id:null, district_id:H.DIST_NWD, sub_div_id:null },
  // HQ
  { id:'U_HQ001',  username:'hq_analyst',            badge_no:'HQ001',  name_en:'Anita Verma',        name_hi:'अनिता वर्मा',           role:'HQ_ANALYST',       station_id:null, district_id:null, sub_div_id:null },
  { id:'U_HQ002',  username:'hq_admin',              badge_no:'HQ002',  name_en:'Suresh Gupta',       name_hi:'सुरेश गुप्ता',          role:'HQ_ADMIN',         station_id:null, district_id:null, sub_div_id:null },
  { id:'U_SA001',  username:'system_admin',          badge_no:'SA001',  name_en:'System Admin',       name_hi:'सिस्टम व्यवस्थापक',    role:'SYSTEM_ADMIN',     station_id:null, district_id:null, sub_div_id:null },
].map(u => ({ ...u, password_hash: PW, is_active: true }));

// ── DATA GENERATORS ────────────────────────────────────────────────────────────
const LOCS_NDD = ['Connaught Place', 'Parliament Street', 'Janpath', 'Patel Chowk', 'Rajpath'];
const LOCS_NWD = ['Adarsh Nagar', 'Shalimar Bagh', 'Mukherji Nagar', 'Model Town', 'Subhash Place'];
const IO_NAMES  = ['Insp. Sharma', 'Insp. Verma', 'SI Gupta', 'Insp. Singh', 'SI Tiwari'];
const CRIME_HEADS = ['Theft', 'Robbery', 'Murder', 'MVCT', 'Cyber'];
const IPC_SECS    = ['302', '420', '379', '392', '66C'];

function caseData(i, ps) {
  const loc = (ps === H.PS_PARLIAMENT || ps === H.PS_CONNAUGHT) ? LOCS_NDD[i%5] : LOCS_NWD[i%5];
  return {
    fir_no: `FIR/2026/${1000+i}`, fir_date: `2026-05-${pad(i%28+1)}`,
    gd_no: `GD/2026/${2000+i}`,   gd_date: `2026-05-${pad(i%28+1)}`,
    gd_time: `${pad((i*3)%24)}:${pad((i*7)%60)}`, beat_no: `B-${(i%10)+1}`,
    occurrence_date: `2026-05-${pad(i%28+1)}`, occurrence_place: `${loc}, New Delhi`,
    local_head: CRIME_HEADS[i%5], act_name: ['IPC','NDPS Act','IPC'][i%3],
    sections: IPC_SECS[i%5],
    brief_facts: `Complaint received from complainant. ${loc} area. Police reached scene and registered FIR. Investigation ongoing.`,
    complainant_name: ['Rahul Kumar','Priya Singh','Amit Jain','Meera Patel','Suresh Verma'][i%5],
    complainant_address: `${100+i}, ${loc}, New Delhi - 110001`,
    accused_name: i%3===0 ? '' : `Accused-${i}`, accused_address: i%3===0 ? '' : `Unknown, New Delhi`,
    io_name: IO_NAMES[i%5], io_pis: `PIS${10000+i}`, io_mobile: `98${pad8(10000000+i*7)}`,
    property_description: i%2===0 ? `Mobile phone, cash Rs.${(i+1)*500}` : '',
    property_status: ['Stolen','Recovered','NA'][i%3],
    status: ['Open','Chargesheeted','Open','Closed','Open'][i%5],
    cctns_flag: i%2===0, zero_fir_flag: i%7===0, remarks: '',
  };
}

function arrestData(i, ps) {
  const loc = (ps === H.PS_PARLIAMENT || ps === H.PS_CONNAUGHT) ? LOCS_NDD[i%5] : LOCS_NWD[i%5];
  return {
    linked_fir_dd_no: `FIR/2026/${1000+i}`,
    act_name: ['IPC','NDPS Act','Prevention of Corruption Act'][i%3],
    sections: IPC_SECS[i%5],
    arrested_name: `${['Mohan','Sohan','Ram','Shyam','Gita'][i%5]} ${['Lal','Kumar','Singh','Prasad','Devi'][i%5]}`,
    arrested_address: `${50+i}, ${loc}, Delhi`,
    arrest_date: `2026-05-${pad(i%28+1)}`, arrest_place: `Near market, ${loc}`,
    crime_head: ['IPC','LOCAL','PREVENTIVE'][i%3],
    status: ['judicial_custody','police_custody','bail','released','others'][i%5],
    other_status_reason: i%5===4 ? 'Surrendered voluntarily' : '',
    io_name: IO_NAMES[i%5], nafis_prepared: i%2===0, dossier_prepared: i%3===0,
  };
}

function pcrData(i, ps) {
  const loc = (ps === H.PS_PARLIAMENT || ps === H.PS_CONNAUGHT) ? LOCS_NDD[i%5] : LOCS_NWD[i%5];
  return {
    pcr_no: `PCR/2026/${3000+i}`, gd_no: `GD/2026/${4000+i}`,
    gd_date: `2026-06-${pad(i%17+1)}`, gd_time: `${pad((i*4)%24)}:${pad((i*11)%60)}`,
    call_head: ['Simple Hurt','Murder','Theft In Shop','Other IPC','Day Burglary','Robbery'][i%6],
    call_gist: `PCR call regarding ${['neighbour dispute','road accident','theft complaint','domestic issue','medical emergency','suspicious activity'][i%6]} at ${loc}. Beat officer deputed immediately.`,
    caller_name: `Caller-${i}`, caller_mobile: `70${pad8(10000000+i*9)}`,
    io_name: IO_NAMES[i%5], arrival_time: `${pad((i*2)%24)}:${pad((i*5)%60)}`,
    status: ['attended','fir_registered','no_cognizable'][i%3],
  };
}

function missingData(i) {
  const minor = i%3===0;
  return {
    dd_no: `DD/2026/${5000+i}`, dd_date: `2026-05-${pad(i%28+1)}`,
    missing_name: `${['Ankit','Priya','Ravi','Sunita','Mohan'][i%5]} ${['Sharma','Gupta','Singh','Verma','Yadav'][i%5]}`,
    age: String(minor ? (i%10)+8 : (i%40)+20), gender: ['Male','Female','Male','Female','Other'][i%5],
    major_minor: minor ? 'Minor' : 'Major',
    missing_date: `2026-05-${pad(i%28+1)}`,
    missing_place: ['Old Delhi Rly Stn','Chandni Chowk market','New Delhi Rly Stn','Nehru Place'][i%4],
    physical_description: `Ht ~${150+(i%30)}cm, ${['fair','wheatish','dark'][i%3]} complexion, ${['short','medium','long'][i%3]} hair`,
    informant_name: `${['Father','Mother','Brother','Sister'][i%4]} of missing`,
    informant_mobile: `91${pad8(10000000+i*13)}`,
    io_name: IO_NAMES[i%5], zipnet_no: `ZN2026${pad4(1000+i)}`,
    status: ['Missing','Traced','Missing','Closed','Missing'][i%5],
  };
}

function uidbData(i) {
  return {
    dd_no: `DD/2026/${6000+i}`, found_date: `2026-05-${pad(i%28+1)}`,
    found_place: `Near ${['railway track Paharganj','Yamuna Pushta','isolated plot Sadar Bazar','road NH-8'][i%4]}, Delhi`,
    gender: ['Male','Female','Unknown'][i%3], approx_age: `${25+(i*7)%40}-${35+(i*7)%40} yrs`,
    description: `${['Tall','Medium','Short'][i%3]} build, ${['blue shirt','saree','torn clothes'][i%3]}, no ID found`,
    io_name: IO_NAMES[i%5], informant_name: `${['Railway staff','Passerby','Local resident','Shopkeeper'][i%4]}`,
    zipnet_no: `ZN2026${pad4(2000+i)}`, identified: i%4===0,
    status: ['Unidentified, held in mortuary','Identified, body claimed','Referred to district hospital'][i%3],
  };
}

function makeData(type, i, ps) {
  switch(type) {
    case 'CASE':     return caseData(i, ps);
    case 'ARREST':   return arrestData(i, ps);
    case 'PCR_CALL': return pcrData(i, ps);
    case 'MISSING':  return missingData(i);
    case 'UIDB':     return uidbData(i);
  }
}

const pad    = n => String(n).padStart(2, '0');
const pad4   = n => String(n).padStart(4, '0');
const pad8   = n => String(n).padStart(8, '0');

// ── RECORD CONFIG TABLE ────────────────────────────────────────────────────────
// id, type, status, level, date, ps_id, district_id, sub_div_id, creator, di
// di = data-generator index (deterministic variety in JSONB data)

const RECS = [
  // ── NDD / Parliament Street PS ──────────────────────────────────────────────
  { id:'R_NDD_C01', type:'CASE',    status:'HQ_RECEIVED',   level:'HQ',       date:'2026-05-01', ps_id:H.PS_PARLIAMENT, district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_1, creator:'U_HC001', di:0  },
  { id:'R_NDD_C02', type:'CASE',    status:'HQ_RECEIVED',   level:'HQ',       date:'2026-05-05', ps_id:H.PS_PARLIAMENT, district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_1, creator:'U_HC001', di:1  },
  { id:'R_NDD_C03', type:'CASE',    status:'HQ_RECEIVED',   level:'HQ',       date:'2026-05-10', ps_id:H.PS_PARLIAMENT, district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_1, creator:'U_HC001', di:2  },
  { id:'R_NDD_C04', type:'CASE',    status:'ARCHIVED',      level:'HQ',       date:'2026-04-20', ps_id:H.PS_PARLIAMENT, district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_1, creator:'U_HC001', di:3  },
  { id:'R_NDD_C05', type:'CASE',    status:'DISTRICT_REVIEW',level:'DISTRICT',date:'2026-05-20', ps_id:H.PS_PARLIAMENT, district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_1, creator:'U_HC001', di:4  },
  { id:'R_NDD_C06', type:'CASE',    status:'PENDING_SHO',   level:'PS',       date:'2026-06-01', ps_id:H.PS_PARLIAMENT, district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_1, creator:'U_HC001', di:5  },
  { id:'R_NDD_C07', type:'CASE',    status:'SENT_BACK',     level:'PS',       date:'2026-05-25', ps_id:H.PS_PARLIAMENT, district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_1, creator:'U_HC001', di:6  },
  { id:'R_NDD_C08', type:'CASE',    status:'DRAFT',         level:'PS',       date:'2026-06-15', ps_id:H.PS_PARLIAMENT, district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_1, creator:'U_HC001', di:7  },
  { id:'R_NDD_C09', type:'CASE',    status:'HQ_RECEIVED',   level:'HQ',       date:'2026-05-12', ps_id:H.PS_PARLIAMENT, district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_1, creator:'U_HC003', di:8  },
  { id:'R_NDD_C10', type:'CASE',    status:'HQ_RECEIVED',   level:'HQ',       date:'2026-05-15', ps_id:H.PS_PARLIAMENT, district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_1, creator:'U_HC003', di:9  },
  { id:'R_NDD_A01', type:'ARREST',  status:'HQ_RECEIVED',   level:'HQ',       date:'2026-05-03', ps_id:H.PS_PARLIAMENT, district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_1, creator:'U_HC001', di:10 },
  { id:'R_NDD_A02', type:'ARREST',  status:'HQ_RECEIVED',   level:'HQ',       date:'2026-05-08', ps_id:H.PS_PARLIAMENT, district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_1, creator:'U_HC001', di:11 },
  { id:'R_NDD_A03', type:'ARREST',  status:'DISTRICT_REVIEW',level:'DISTRICT',date:'2026-05-18', ps_id:H.PS_PARLIAMENT, district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_1, creator:'U_HC001', di:12 },
  { id:'R_NDD_A04', type:'ARREST',  status:'PENDING_SHO',   level:'PS',       date:'2026-06-05', ps_id:H.PS_PARLIAMENT, district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_1, creator:'U_HC001', di:13 },
  { id:'R_NDD_A05', type:'ARREST',  status:'SENT_BACK',     level:'PS',       date:'2026-05-28', ps_id:H.PS_PARLIAMENT, district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_1, creator:'U_HC001', di:14 },
  { id:'R_NDD_A06', type:'ARREST',  status:'DRAFT',         level:'PS',       date:'2026-06-16', ps_id:H.PS_PARLIAMENT, district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_1, creator:'U_HC003', di:15 },
  { id:'R_NDD_A07', type:'ARREST',  status:'HQ_RECEIVED',   level:'HQ',       date:'2026-05-22', ps_id:H.PS_PARLIAMENT, district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_1, creator:'U_HC003', di:16 },
  { id:'R_NDD_P01', type:'PCR_CALL',status:'HQ_RECEIVED',   level:'HQ',       date:'2026-05-04', ps_id:H.PS_PARLIAMENT, district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_1, creator:'U_HC001', di:17 },
  { id:'R_NDD_P02', type:'PCR_CALL',status:'HQ_RECEIVED',   level:'HQ',       date:'2026-05-09', ps_id:H.PS_PARLIAMENT, district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_1, creator:'U_HC001', di:18 },
  { id:'R_NDD_P03', type:'PCR_CALL',status:'PENDING_SHO',   level:'PS',       date:'2026-06-10', ps_id:H.PS_PARLIAMENT, district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_1, creator:'U_HC001', di:19 },
  { id:'R_NDD_P04', type:'PCR_CALL',status:'DRAFT',         level:'PS',       date:'2026-06-17', ps_id:H.PS_PARLIAMENT, district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_1, creator:'U_HC001', di:20 },
  { id:'R_NDD_P05', type:'PCR_CALL',status:'HQ_RECEIVED',   level:'HQ',       date:'2026-05-14', ps_id:H.PS_PARLIAMENT, district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_1, creator:'U_HC003', di:21 },
  { id:'R_NDD_M01', type:'MISSING', status:'HQ_RECEIVED',   level:'HQ',       date:'2026-05-06', ps_id:H.PS_PARLIAMENT, district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_1, creator:'U_HC001', di:22 },
  { id:'R_NDD_M02', type:'MISSING', status:'PENDING_SHO',   level:'PS',       date:'2026-06-03', ps_id:H.PS_PARLIAMENT, district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_1, creator:'U_HC001', di:23 },
  { id:'R_NDD_M03', type:'MISSING', status:'DRAFT',         level:'PS',       date:'2026-06-16', ps_id:H.PS_PARLIAMENT, district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_1, creator:'U_HC003', di:24 },
  { id:'R_NDD_U01', type:'UIDB',    status:'HQ_RECEIVED',   level:'HQ',       date:'2026-05-11', ps_id:H.PS_PARLIAMENT, district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_1, creator:'U_HC001', di:25 },
  { id:'R_NDD_U02', type:'UIDB',    status:'DRAFT',         level:'PS',       date:'2026-06-14', ps_id:H.PS_PARLIAMENT, district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_1, creator:'U_HC001', di:26 },
  // ── NDD / Connaught Place PS ─────────────────────────────────────────────────
  { id:'R_CP_C01',  type:'CASE',    status:'HQ_RECEIVED',   level:'HQ',       date:'2026-05-02', ps_id:H.PS_CONNAUGHT,  district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_0, creator:'U_HC004', di:27 },
  { id:'R_CP_C02',  type:'CASE',    status:'HQ_RECEIVED',   level:'HQ',       date:'2026-05-07', ps_id:H.PS_CONNAUGHT,  district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_0, creator:'U_HC004', di:28 },
  { id:'R_CP_C03',  type:'CASE',    status:'DISTRICT_REVIEW',level:'DISTRICT',date:'2026-05-21', ps_id:H.PS_CONNAUGHT,  district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_0, creator:'U_HC004', di:29 },
  { id:'R_CP_C04',  type:'CASE',    status:'DRAFT',         level:'PS',       date:'2026-06-17', ps_id:H.PS_CONNAUGHT,  district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_0, creator:'U_HC004', di:30 },
  { id:'R_CP_A01',  type:'ARREST',  status:'HQ_RECEIVED',   level:'HQ',       date:'2026-05-13', ps_id:H.PS_CONNAUGHT,  district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_0, creator:'U_HC004', di:31 },
  { id:'R_CP_A02',  type:'ARREST',  status:'PENDING_SHO',   level:'PS',       date:'2026-06-08', ps_id:H.PS_CONNAUGHT,  district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_0, creator:'U_HC004', di:32 },
  { id:'R_CP_P01',  type:'PCR_CALL',status:'HQ_RECEIVED',   level:'HQ',       date:'2026-05-16', ps_id:H.PS_CONNAUGHT,  district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_0, creator:'U_HC004', di:33 },
  { id:'R_CP_P02',  type:'PCR_CALL',status:'DRAFT',         level:'PS',       date:'2026-06-15', ps_id:H.PS_CONNAUGHT,  district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_0, creator:'U_HC004', di:34 },
  { id:'R_CP_M01',  type:'MISSING', status:'HQ_RECEIVED',   level:'HQ',       date:'2026-05-19', ps_id:H.PS_CONNAUGHT,  district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_0, creator:'U_HC004', di:35 },
  { id:'R_CP_U01',  type:'UIDB',    status:'DISTRICT_REVIEW',level:'DISTRICT',date:'2026-05-23', ps_id:H.PS_CONNAUGHT,  district_id:H.DIST_NDD, sub_div_id:H.SUB_NDD_0, creator:'U_HC004', di:36 },
  // ── NWD / Adarsh Nagar PS ────────────────────────────────────────────────────
  { id:'R_NWD_C01', type:'CASE',    status:'HQ_RECEIVED',   level:'HQ',       date:'2026-05-02', ps_id:H.PS_ADARSH,     district_id:H.DIST_NWD, sub_div_id:H.SUB_NWD_0, creator:'U_HC002', di:37 },
  { id:'R_NWD_C02', type:'CASE',    status:'HQ_RECEIVED',   level:'HQ',       date:'2026-05-08', ps_id:H.PS_ADARSH,     district_id:H.DIST_NWD, sub_div_id:H.SUB_NWD_0, creator:'U_HC002', di:38 },
  { id:'R_NWD_C03', type:'CASE',    status:'DISTRICT_REVIEW',level:'DISTRICT',date:'2026-05-22', ps_id:H.PS_ADARSH,     district_id:H.DIST_NWD, sub_div_id:H.SUB_NWD_0, creator:'U_HC002', di:39 },
  { id:'R_NWD_C04', type:'CASE',    status:'PENDING_SHO',   level:'PS',       date:'2026-06-10', ps_id:H.PS_ADARSH,     district_id:H.DIST_NWD, sub_div_id:H.SUB_NWD_0, creator:'U_HC002', di:40 },
  { id:'R_NWD_C05', type:'CASE',    status:'DRAFT',         level:'PS',       date:'2026-06-16', ps_id:H.PS_ADARSH,     district_id:H.DIST_NWD, sub_div_id:H.SUB_NWD_0, creator:'U_HC002', di:41 },
  { id:'R_NWD_A01', type:'ARREST',  status:'HQ_RECEIVED',   level:'HQ',       date:'2026-05-05', ps_id:H.PS_ADARSH,     district_id:H.DIST_NWD, sub_div_id:H.SUB_NWD_0, creator:'U_HC002', di:42 },
  { id:'R_NWD_A02', type:'ARREST',  status:'PENDING_SHO',   level:'PS',       date:'2026-06-12', ps_id:H.PS_ADARSH,     district_id:H.DIST_NWD, sub_div_id:H.SUB_NWD_0, creator:'U_HC002', di:43 },
  { id:'R_NWD_A03', type:'ARREST',  status:'SENT_BACK',     level:'PS',       date:'2026-05-29', ps_id:H.PS_ADARSH,     district_id:H.DIST_NWD, sub_div_id:H.SUB_NWD_0, creator:'U_HC002', di:44 },
  { id:'R_NWD_P01', type:'PCR_CALL',status:'HQ_RECEIVED',   level:'HQ',       date:'2026-05-11', ps_id:H.PS_ADARSH,     district_id:H.DIST_NWD, sub_div_id:H.SUB_NWD_0, creator:'U_HC002', di:45 },
  { id:'R_NWD_P02', type:'PCR_CALL',status:'HQ_RECEIVED',   level:'HQ',       date:'2026-05-17', ps_id:H.PS_ADARSH,     district_id:H.DIST_NWD, sub_div_id:H.SUB_NWD_0, creator:'U_HC002', di:46 },
  { id:'R_NWD_P03', type:'PCR_CALL',status:'DRAFT',         level:'PS',       date:'2026-06-17', ps_id:H.PS_ADARSH,     district_id:H.DIST_NWD, sub_div_id:H.SUB_NWD_0, creator:'U_HC002', di:47 },
  { id:'R_NWD_M01', type:'MISSING', status:'HQ_RECEIVED',   level:'HQ',       date:'2026-05-13', ps_id:H.PS_ADARSH,     district_id:H.DIST_NWD, sub_div_id:H.SUB_NWD_0, creator:'U_HC002', di:48 },
  { id:'R_NWD_M02', type:'MISSING', status:'PENDING_SHO',   level:'PS',       date:'2026-06-06', ps_id:H.PS_ADARSH,     district_id:H.DIST_NWD, sub_div_id:H.SUB_NWD_0, creator:'U_HC002', di:49 },
  { id:'R_NWD_U01', type:'UIDB',    status:'HQ_RECEIVED',   level:'HQ',       date:'2026-05-20', ps_id:H.PS_ADARSH,     district_id:H.DIST_NWD, sub_div_id:H.SUB_NWD_0, creator:'U_HC002', di:50 },
];

// ── WORKFLOW HELPERS ───────────────────────────────────────────────────────────
function getSHO(ps_id) {
  if (ps_id === H.PS_PARLIAMENT) return 'U_SHO001';
  if (ps_id === H.PS_CONNAUGHT)  return 'U_SHO002';
  return 'U_SHO003';
}
function getDO(district_id) {
  return district_id === H.DIST_NDD ? 'U_DO001' : 'U_DO002';
}

function makeTransitions(rec) {
  const { id, status, creator, ps_id, district_id, date } = rec;
  const sho = getSHO(ps_id), doUser = getDO(district_id);
  const ts = [];
  let seq = 1;
  const at = new Date(date + 'T10:00:00Z').toISOString();

  const add = (from_status, to_status, from_level, to_level, action, performed_by, comment = null) =>
    ts.push({ id:`WT_${id}_${seq++}`, record_id:id, from_status, to_status, from_level, to_level,
              action, performed_by, performed_at:at, comment, target_fields:null });

  if (status === 'DRAFT') return ts;
  add('DRAFT','PENDING_SHO','PS','PS','SUBMIT',creator);
  if (status === 'SENT_BACK') {
    add('PENDING_SHO','SENT_BACK','PS','PS','SEND_BACK',sho,'Please correct IO name and section details before resubmitting.');
    return ts;
  }
  if (['DISTRICT_REVIEW','HQ_RECEIVED','ARCHIVED'].includes(status))
    add('PENDING_SHO','DISTRICT_REVIEW','PS','DISTRICT','APPROVE',sho);
  if (['HQ_RECEIVED','ARCHIVED'].includes(status))
    add('DISTRICT_REVIEW','HQ_RECEIVED','DISTRICT','HQ','APPROVE',doUser);
  if (status === 'ARCHIVED')
    add('HQ_RECEIVED','ARCHIVED','HQ','HQ','CLOSE','U_HQ002','Verified and archived after compilation.');
  return ts;
}

function makeRevisions(rec) {
  const { id, status, creator, ps_id, district_id } = rec;
  const sho = getSHO(ps_id), doUser = getDO(district_id);
  const rv = [];
  let seq = 1;

  const add = (changed_by, level, change_type, field_changes, comment = null) =>
    rv.push({ id:`RV_${id}_${seq++}`, record_id:id, revision_number:seq-1, changed_by, level,
              change_type, field_changes:JSON.stringify(field_changes), comment, reason:null, ip_address:'10.0.0.1' });

  add(creator, 'PS', 'CREATE', []);
  if (status === 'DRAFT') return rv;

  add(creator, 'PS', 'STATUS_CHANGE', [{field_key:'current_status',old_value:'DRAFT',new_value:'PENDING_SHO'}]);
  if (status === 'PENDING_SHO') return rv;

  if (status === 'SENT_BACK') {
    add(sho, 'PS', 'STATUS_CHANGE', [{field_key:'current_status',old_value:'PENDING_SHO',new_value:'SENT_BACK'}], 'Please correct IO name and section details.');
    return rv;
  }

  add(sho, 'DISTRICT', 'LEVEL_TRANSITION', [{field_key:'current_status',old_value:'PENDING_SHO',new_value:'DISTRICT_REVIEW'}]);
  if (status === 'DISTRICT_REVIEW') return rv;

  add(doUser, 'HQ', 'LEVEL_TRANSITION', [{field_key:'current_status',old_value:'DISTRICT_REVIEW',new_value:'HQ_RECEIVED'}]);
  if (status === 'HQ_RECEIVED') return rv;

  if (status === 'ARCHIVED')
    add('U_HQ002', 'HQ', 'STATUS_CHANGE', [{field_key:'current_status',old_value:'HQ_RECEIVED',new_value:'ARCHIVED'}], 'Archived after verification.');
  return rv;
}

// ── COMPILATIONS ───────────────────────────────────────────────────────────────
const HQ_REC_IDS_NDD = RECS.filter(r => r.district_id === H.DIST_NDD && r.status === 'HQ_RECEIVED').map(r => r.id);
const HQ_REC_IDS_NWD = RECS.filter(r => r.district_id === H.DIST_NWD && r.status === 'HQ_RECEIVED').map(r => r.id);

const COMPILATIONS = [
  {
    id: 'COMP_NDD_MAY26',
    source_level: 'DISTRICT', target_level: 'HQ', route: 'OPS_CHAIN',
    period: '2026-05-31', source_entity_id: H.DIST_NDD,
    status: 'SUBMITTED',
    record_ids: JSON.stringify(HQ_REC_IDS_NDD.slice(0, 8)),
    compiled_summary: JSON.stringify({
      total_records: 8, by_type: { CASE:3, ARREST:3, PCR_CALL:1, MISSING:1 },
      by_crime_head: { Theft:2, Robbery:1, Murder:1, MVCT:1, Cyber:1 },
      period: '2026-05', district: 'New Delhi District'
    }),
    submitted_by: 'U_DO001',
    submitted_at: new Date('2026-06-01T09:00:00Z').toISOString(),
  },
  {
    id: 'COMP_NWD_MAY26',
    source_level: 'DISTRICT', target_level: 'HQ', route: 'OPS_CHAIN',
    period: '2026-05-31', source_entity_id: H.DIST_NWD,
    status: 'DRAFT',
    record_ids: JSON.stringify(HQ_REC_IDS_NWD),
    compiled_summary: null,
    submitted_by: null,
    submitted_at: null,
  },
  {
    id: 'COMP_NDD_JUN26',
    source_level: 'DISTRICT', target_level: 'HQ', route: 'OPS_CHAIN',
    period: '2026-06-30', source_entity_id: H.DIST_NDD,
    status: 'DRAFT',
    record_ids: JSON.stringify([]),
    compiled_summary: null,
    submitted_by: null,
    submitted_at: null,
  },
];

const COMPILATION_RECORDS = COMPILATIONS.flatMap(c => {
  const ids = JSON.parse(c.record_ids);
  return ids.map((rid, i) => ({ id: `CR_${c.id}_${i}`, compilation_id: c.id, record_id: rid }));
});

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
const NOTIFICATIONS = [
  // HC001 — record sent back
  { id:'N01', user_id:'U_HC001', record_id:'R_NDD_C07', is_read:false,
    title_en:'Record Sent Back', title_hi:'रिकॉर्ड वापस भेजा गया',
    message_en:'Your CASE record R_NDD_C07 has been sent back by SHO. Please correct IO name.',
    message_hi:'आपका CASE रिकॉर्ड R_NDD_C07 SHO द्वारा वापस भेजा गया है।' },
  { id:'N02', user_id:'U_HC001', record_id:'R_NDD_A05', is_read:false,
    title_en:'Record Sent Back', title_hi:'रिकॉर्ड वापस भेजा गया',
    message_en:'Your ARREST record R_NDD_A05 has been sent back by SHO. Please verify sections.',
    message_hi:'आपका ARREST रिकॉर्ड R_NDD_A05 SHO द्वारा वापस भेजा गया है।' },
  { id:'N03', user_id:'U_HC001', record_id:'R_NDD_C09', is_read:true,
    title_en:'Record Approved by SHO', title_hi:'SHO द्वारा रिकॉर्ड स्वीकृत',
    message_en:'Your CASE record has been approved by SHO and forwarded to District.',
    message_hi:'आपका CASE रिकॉर्ड SHO द्वारा स्वीकृत किया गया।' },
  // SHO001 — pending approvals
  { id:'N04', user_id:'U_SHO001', record_id:'R_NDD_C06', is_read:false,
    title_en:'New Record Pending Approval', title_hi:'नया रिकॉर्ड स्वीकृति हेतु लंबित',
    message_en:'A new CASE record from HC Ramesh Kumar is awaiting your approval.',
    message_hi:'HC रमेश कुमार का नया CASE रिकॉर्ड आपकी स्वीकृति हेतु लंबित है।' },
  { id:'N05', user_id:'U_SHO001', record_id:'R_NDD_A04', is_read:false,
    title_en:'New Record Pending Approval', title_hi:'नया रिकॉर्ड स्वीकृति हेतु लंबित',
    message_en:'A new ARREST record is awaiting your approval.',
    message_hi:'एक नया ARREST रिकॉर्ड आपकी स्वीकृति हेतु लंबित है।' },
  { id:'N06', user_id:'U_SHO001', record_id:'R_NDD_M02', is_read:true,
    title_en:'Missing Person Record Submitted', title_hi:'लापता व्यक्ति रिकॉर्ड सबमिट',
    message_en:'A MISSING person record has been submitted for your review.',
    message_hi:'एक लापता व्यक्ति रिकॉर्ड आपकी समीक्षा हेतु सबमिट किया गया है।' },
  // DO001 — district-level
  { id:'N07', user_id:'U_DO001', record_id:'R_NDD_C05', is_read:false,
    title_en:'Record at District Review', title_hi:'रिकॉर्ड जिला समीक्षा में',
    message_en:'CASE record R_NDD_C05 has reached District level for review.',
    message_hi:'CASE रिकॉर्ड R_NDD_C05 जिला स्तर पर समीक्षा हेतु पहुंचा।' },
  { id:'N08', user_id:'U_DO001', record_id:null, is_read:false,
    title_en:'Compilation Ready for Submission', title_hi:'संकलन सबमिशन के लिए तैयार',
    message_en:'May 2026 compilation for New Delhi District is ready for submission to HQ.',
    message_hi:'नई दिल्ली जिले का मई 2026 संकलन HQ को सबमिट करने के लिए तैयार है।' },
  // HQ001
  { id:'N09', user_id:'U_HQ001', record_id:null, is_read:false,
    title_en:'New Compilation Received', title_hi:'नया संकलन प्राप्त',
    message_en:'Compilation from New Delhi District (May 2026) has been received at HQ.',
    message_hi:'नई दिल्ली जिले का संकलन (मई 2026) HQ में प्राप्त हुआ।' },
  // HC002 NWD
  { id:'N10', user_id:'U_HC002', record_id:'R_NWD_A03', is_read:false,
    title_en:'Record Sent Back', title_hi:'रिकॉर्ड वापस भेजा गया',
    message_en:'Your ARREST record has been sent back by SHO. Please review.',
    message_hi:'आपका ARREST रिकॉर्ड SHO द्वारा वापस भेजा गया है।' },
  // SHO003
  { id:'N11', user_id:'U_SHO003', record_id:'R_NWD_C04', is_read:false,
    title_en:'New Record Pending Approval', title_hi:'नया रिकॉर्ड स्वीकृति हेतु लंबित',
    message_en:'A new CASE record from HC Sunil Dutt is awaiting your approval.',
    message_hi:'HC सुनील दत्त का नया CASE रिकॉर्ड आपकी स्वीकृति हेतु लंबित है।' },
];

// ── AUDIT LOGS ─────────────────────────────────────────────────────────────────
function makeAuditLogs() {
  const logs = [];
  let seq = 1;
  // LOGIN events
  for (const u of ['U_HC001','U_SHO001','U_DO001','U_HQ001','U_HQ002','U_SA001','U_HC002','U_SHO003','U_DO002']) {
    logs.push({ id:`AL${seq++}`, table_name:'users', record_id:u, action:'LOGIN',
      changed_by_id:u, changed_by_role: USERS.find(x=>x.id===u)?.role, changed_at:new Date().toISOString(), ip_address:'10.0.0.1' });
  }
  // Record CREATE events (first 8 records only to keep log manageable)
  for (const r of RECS.slice(0, 8)) {
    logs.push({ id:`AL${seq++}`, table_name:'records', record_id:r.id, action:'CREATE',
      changed_by_id:r.creator, changed_by_role:'HC', changed_at:new Date(r.date+'T09:00:00Z').toISOString(), ip_address:'10.0.0.1' });
  }
  // Compilation submit event
  logs.push({ id:`AL${seq++}`, table_name:'compilations', record_id:'COMP_NDD_MAY26', action:'SUBMIT',
    changed_by_id:'U_DO001', changed_by_role:'DISTRICT_OFFICER', changed_at:new Date('2026-06-01T09:00:00Z').toISOString(), ip_address:'10.0.0.2' });
  return logs;
}

// ── WORKFLOW TRANSITIONS CONFIG (Phase 2 table) ────────────────────────────────
const WF_CONFIG = [
  { id:'WTC_01', record_type:'*', from_status:'DRAFT',           to_status:'PENDING_SHO',     action:'submit',    allowed_roles:JSON.stringify(['HC']),                         requires_comment:false, sla_hours:24,   is_active:true },
  { id:'WTC_02', record_type:'*', from_status:'PENDING_SHO',     to_status:'DISTRICT_REVIEW', action:'approve',   allowed_roles:JSON.stringify(['SHO']),                        requires_comment:false, sla_hours:48,   is_active:true },
  { id:'WTC_03', record_type:'*', from_status:'PENDING_SHO',     to_status:'SENT_BACK',       action:'send_back', allowed_roles:JSON.stringify(['SHO']),                        requires_comment:true,  sla_hours:null, is_active:true },
  { id:'WTC_04', record_type:'*', from_status:'SENT_BACK',       to_status:'PENDING_SHO',     action:'submit',    allowed_roles:JSON.stringify(['HC']),                         requires_comment:false, sla_hours:24,   is_active:true },
  { id:'WTC_05', record_type:'*', from_status:'DISTRICT_REVIEW', to_status:'HQ_RECEIVED',     action:'approve',   allowed_roles:JSON.stringify(['DISTRICT_OFFICER']),           requires_comment:false, sla_hours:48,   is_active:true },
  { id:'WTC_06', record_type:'*', from_status:'DISTRICT_REVIEW', to_status:'SENT_BACK',       action:'send_back', allowed_roles:JSON.stringify(['DISTRICT_OFFICER']),           requires_comment:true,  sla_hours:null, is_active:true },
  { id:'WTC_07', record_type:'*', from_status:'HQ_RECEIVED',     to_status:'ARCHIVED',        action:'archive',   allowed_roles:JSON.stringify(['HQ_ADMIN','SYSTEM_ADMIN']),    requires_comment:false, sla_hours:null, is_active:true },
  { id:'WTC_08', record_type:'*', from_status:'HQ_RECEIVED',     to_status:'COMPILED',        action:'compile',   allowed_roles:JSON.stringify(['DISTRICT_OFFICER','HQ_ADMIN']),requires_comment:false, sla_hours:null, is_active:true },
];

// ── LEVEL DATA CONTRACTS (Phase 2 table) ──────────────────────────────────────
const LEVEL_CONTRACTS = [
  {
    id:'LDC_PS_DIST_ALL', from_level:'PS', to_level:'DISTRICT', route:'OPS_CHAIN', record_type:'*',
    visible_field_keys: JSON.stringify(['fir_no','fir_date','local_head','occurrence_place','io_name','status','brief_facts','arrested_name','arrest_date','crime_head','pcr_no','call_head','missing_name','missing_date','status','found_date','found_place']),
    aggregate_definitions: JSON.stringify([]), is_active:true, updated_at: new Date().toISOString(),
  },
  {
    id:'LDC_DIST_HQ_ALL', from_level:'DISTRICT', to_level:'HQ', route:'OPS_CHAIN', record_type:'*',
    visible_field_keys: JSON.stringify(['fir_no','fir_date','local_head','occurrence_place','status','brief_facts','crime_head','call_head','missing_name','found_date']),
    aggregate_definitions: JSON.stringify([
      { type:'count', label_en:'Total Records',  label_hi:'कुल रिकॉर्ड' },
      { type:'count_by', field:'local_head', label_en:'By Crime Head', label_hi:'अपराध शीर्ष अनुसार' },
      { type:'count_by', field:'record_type', label_en:'By Record Type', label_hi:'रिकॉर्ड प्रकार अनुसार' },
    ]),
    is_active:true, updated_at: new Date().toISOString(),
  },
];

// ── FILTER PRESETS ─────────────────────────────────────────────────────────────
const FILTER_PRESETS = [
  {
    id:'FP_01', name_en:'Pending Records', name_hi:'लंबित रिकॉर्ड', scope:'SYSTEM', scope_id:null,
    filter_spec:JSON.stringify({ operator:'AND', conditions:[{ field:'current_status', op:'IN', value:['PENDING_SHO','DISTRICT_REVIEW'] }] }),
    applicable_record_types:JSON.stringify(['CASE','ARREST','PCR_CALL','MISSING','UIDB']),
    created_by:'U_SA001', is_active:true, created_at: new Date().toISOString(),
  },
  {
    id:'FP_02', name_en:'Murder Cases', name_hi:'हत्या के मामले', scope:'SYSTEM', scope_id:null,
    filter_spec:JSON.stringify({ operator:'AND', conditions:[{ field:'data.local_head', op:'EQ', value:'Murder' }] }),
    applicable_record_types:JSON.stringify(['CASE']),
    created_by:'U_HQ001', is_active:true, created_at: new Date().toISOString(),
  },
  {
    id:'FP_03', name_en:'June 2026 Records', name_hi:'जून 2026 रिकॉर्ड', scope:'SYSTEM', scope_id:null,
    filter_spec:JSON.stringify({ operator:'AND', conditions:[{ field:'record_date', op:'GTE', value:'2026-06-01' }] }),
    applicable_record_types:JSON.stringify(['CASE','ARREST','PCR_CALL','MISSING','UIDB']),
    created_by:'U_SA001', is_active:true, created_at: new Date().toISOString(),
  },
];

// ── REPORT TEMPLATES ───────────────────────────────────────────────────────────
const REPORT_TEMPLATES = [
  {
    id:'T_DAILY_24HR_DIARY', name_en:'24-Hour Daily Diary (Important Cases)', name_hi:'24 घंटे की दैनिक डायरी',
    applicable_record_types:JSON.stringify(['CASE']),
    applicable_levels:JSON.stringify(['DISTRICT','HQ']),
    template_definition:JSON.stringify({ layout:'A4_PORTRAIT',
      header:{ title_en:'DELHI POLICE DAILY REPORT', title_hi:'दिल्ली पुलिस दैनिक रिपोर्ट' },
      sections:[{ title_en:'Important Cases (Last 24 Hours)', title_hi:'महत्वपूर्ण मामले (पिछले 24 घंटे)', fields:['fir_no','fir_date','local_head','occurrence_place','brief_facts','io_name'] }]
    }),
    output_formats:JSON.stringify(['PDF','EXCEL']), is_active:true, created_by:'U_SA001', created_at: new Date().toISOString(),
  },
  {
    id:'T_DAILY_CRIME_STMT', name_en:'PS-wise Daily Crime Statement', name_hi:'थानेवार दैनिक अपराध विवरण',
    applicable_record_types:JSON.stringify(['CASE']),
    applicable_levels:JSON.stringify(['DISTRICT','HQ']),
    template_definition:JSON.stringify({ layout:'A4_LANDSCAPE',
      header:{ title_en:'DAILY CRIME STATEMENT', title_hi:'दैनिक अपराध विवरण' },
      sections:[{ title_en:'PS Crime Table', title_hi:'थानेवार तालिका', fields:['ps_id','local_head','status'] }]
    }),
    output_formats:JSON.stringify(['PDF','EXCEL']), is_active:true, created_by:'U_SA001', created_at: new Date().toISOString(),
  },
  {
    id:'T_ARREST_REGISTER', name_en:'Arrest Register (Proforma-2)', name_hi:'गिरफ्तारी पंजी (प्रपत्र-2)',
    applicable_record_types:JSON.stringify(['ARREST']),
    applicable_levels:JSON.stringify(['PS','DISTRICT','HQ']),
    template_definition:JSON.stringify({ layout:'A4_PORTRAIT',
      header:{ title_en:'ARREST REGISTER', title_hi:'गिरफ्तारी पंजी' },
      sections:[{ title_en:'Arrest Details', title_hi:'गिरफ्तारी विवरण', fields:['arrested_name','arrest_date','crime_head','sections','io_name','status'] }]
    }),
    output_formats:JSON.stringify(['PDF','EXCEL']), is_active:true, created_by:'U_SA001', created_at: new Date().toISOString(),
  },
  {
    id:'T_MISSING_PERSON', name_en:'Missing Persons Register', name_hi:'लापता व्यक्ति पंजी',
    applicable_record_types:JSON.stringify(['MISSING']),
    applicable_levels:JSON.stringify(['PS','DISTRICT','HQ']),
    template_definition:JSON.stringify({ layout:'A4_PORTRAIT',
      header:{ title_en:'MISSING PERSONS REGISTER', title_hi:'लापता व्यक्ति पंजी' },
      sections:[{ title_en:'Person Details', title_hi:'व्यक्ति विवरण', fields:['dd_no','missing_name','age','gender','missing_date','missing_place','status'] }]
    }),
    output_formats:JSON.stringify(['PDF','EXCEL']), is_active:true, created_by:'U_SA001', created_at: new Date().toISOString(),
  },
  {
    id:'arrest-summary', name_en:'Arrest Summary Report', name_hi:'गिरफ्तारी सारांश रिपोर्ट',
    applicable_record_types:JSON.stringify(['ARREST']),
    applicable_levels:JSON.stringify(['PS','DISTRICT','HQ']),
    template_definition:JSON.stringify({}),
    output_formats:JSON.stringify(['PDF','CSV','EXCEL']), is_active:true, created_by:'U_SA001', created_at: new Date().toISOString(),
  },
  {
    id:'pcr-call-log', name_en:'PCR Call Log', name_hi:'पीसीआर कॉल लॉग',
    applicable_record_types:JSON.stringify(['PCR_CALL']),
    applicable_levels:JSON.stringify(['PS','DISTRICT','HQ']),
    template_definition:JSON.stringify({}),
    output_formats:JSON.stringify(['PDF','CSV','EXCEL']), is_active:true, created_by:'U_SA001', created_at: new Date().toISOString(),
  },
  {
    id:'cases-register', name_en:'Cases Register', name_hi:'मामले रजिस्टर',
    applicable_record_types:JSON.stringify(['CASE']),
    applicable_levels:JSON.stringify(['PS','DISTRICT','HQ']),
    template_definition:JSON.stringify({}),
    output_formats:JSON.stringify(['PDF','CSV','EXCEL']), is_active:true, created_by:'U_SA001', created_at: new Date().toISOString(),
  },
  {
    id:'daily-status', name_en:'Daily Status Report', name_hi:'दैनिक स्थिति रिपोर्ट',
    applicable_record_types:JSON.stringify(['ARREST','PCR_CALL','CASE']),
    applicable_levels:JSON.stringify(['PS','DISTRICT','HQ']),
    template_definition:JSON.stringify({}),
    output_formats:JSON.stringify(['PDF','EXCEL']), is_active:true, created_by:'U_SA001', created_at: new Date().toISOString(),
  },
  {
    id:'district-compilation', name_en:'District Compilation Report', name_hi:'जिला संकलन रिपोर्ट',
    applicable_record_types:JSON.stringify(['COMPILATION']),
    applicable_levels:JSON.stringify(['PS','DISTRICT','HQ']),
    template_definition:JSON.stringify({}),
    output_formats:JSON.stringify(['PDF','EXCEL']), is_active:true, created_by:'U_SA001', created_at: new Date().toISOString(),
  },
  {
    id:'io-performance', name_en:'IO Investigation Performance', name_hi:'जांच अधिकारी जांच प्रदर्शन',
    applicable_record_types:JSON.stringify(['CASE']),
    applicable_levels:JSON.stringify(['PS','DISTRICT','HQ']),
    template_definition:JSON.stringify({}),
    output_formats:JSON.stringify(['PDF','EXCEL']), is_active:true, created_by:'U_SA001', created_at: new Date().toISOString(),
  },
  {
    id:'beat-incidents', name_en:'Beat Incident Summary', name_hi:'बीट घटना सारांश',
    applicable_record_types:JSON.stringify(['CASE','PCR_CALL']),
    applicable_levels:JSON.stringify(['PS','DISTRICT','HQ']),
    template_definition:JSON.stringify({}),
    output_formats:JSON.stringify(['PDF','EXCEL']), is_active:true, created_by:'U_SA001', created_at: new Date().toISOString(),
  },
  {
    id:'legacy-summary', name_en:'Legacy Data Summary', name_hi:'विरासत डेटा सारांश',
    applicable_record_types:JSON.stringify(['CASE','ARREST']),
    applicable_levels:JSON.stringify(['PS','DISTRICT','HQ']),
    template_definition:JSON.stringify({}),
    output_formats:JSON.stringify(['PDF','EXCEL']), is_active:true, created_by:'U_SA001', created_at: new Date().toISOString(),
  },
  {
    id:'sla-breaches', name_en:'SLA Breaches Audit Log', name_hi:'समय सीमा उल्लंघन ऑडिट लॉग',
    applicable_record_types:JSON.stringify(['CASE','ARREST','PCR_CALL']),
    applicable_levels:JSON.stringify(['PS','DISTRICT','HQ']),
    template_definition:JSON.stringify({}),
    output_formats:JSON.stringify(['PDF','CSV','EXCEL']), is_active:true, created_by:'U_SA001', created_at: new Date().toISOString(),
  },
  {
    id:'ops-compilation', name_en:'Ops Chain Compilation', name_hi:'संचालन श्रृंखला संकलन',
    applicable_record_types:JSON.stringify(['COMPILATION']),
    applicable_levels:JSON.stringify(['PS','DISTRICT','HQ']),
    template_definition:JSON.stringify({}),
    output_formats:JSON.stringify(['PDF','EXCEL']), is_active:true, created_by:'U_SA001', created_at: new Date().toISOString(),
  },
];

// ── FIELD REGISTRY (same as seeds/seed.js — included here for standalone run) ──
function buildFields() {
  const L = JSON.stringify(['PS','DISTRICT','HQ']);
  const E = JSON.stringify(['PS']);
  return [
    { id:'C_1',  field_key:'fir_no',              field_type:'TEXT',     applicable_record_types:JSON.stringify(['CASE']),     label_en:'FIR Number',              label_hi:'प्राथमिकी (FIR) संख्या',       visible_to_levels:L, editable_by_levels:E, section:'general_info',             sort_order:1,  validation_rules:JSON.stringify({required:true}) },
    { id:'C_2',  field_key:'fir_date',             field_type:'DATE',     applicable_record_types:JSON.stringify(['CASE']),     label_en:'FIR Date',                label_hi:'एफआईआर तिथि',                 visible_to_levels:L, editable_by_levels:E, section:'general_info',             sort_order:2,  validation_rules:JSON.stringify({required:true}) },
    { id:'C_3',  field_key:'gd_no',               field_type:'TEXT',     applicable_record_types:JSON.stringify(['CASE']),     label_en:'GD Number',               label_hi:'जीडी नंबर',                   visible_to_levels:L, editable_by_levels:E, section:'general_info',             sort_order:3,  validation_rules:JSON.stringify({required:true}) },
    { id:'C_4',  field_key:'gd_date',              field_type:'DATE',     applicable_record_types:JSON.stringify(['CASE']),     label_en:'GD Date',                 label_hi:'जीडी दिनांक',                  visible_to_levels:L, editable_by_levels:E, section:'general_info',             sort_order:4 },
    { id:'C_5',  field_key:'gd_time',              field_type:'TIME',     applicable_record_types:JSON.stringify(['CASE']),     label_en:'GD Time',                 label_hi:'जीडी समय',                     visible_to_levels:L, editable_by_levels:E, section:'general_info',             sort_order:5 },
    { id:'C_6',  field_key:'beat_no',              field_type:'TEXT',     applicable_record_types:JSON.stringify(['CASE']),     label_en:'Beat No.',                label_hi:'बीट नंबर',                     visible_to_levels:L, editable_by_levels:E, section:'general_info',             sort_order:6 },
    { id:'C_7',  field_key:'occurrence_date',      field_type:'DATE',     applicable_record_types:JSON.stringify(['CASE']),     label_en:'Date of Occurrence',      label_hi:'घटना की तिथि',                 visible_to_levels:L, editable_by_levels:E, section:'incident_details',         sort_order:7,  validation_rules:JSON.stringify({required:true}) },
    { id:'C_8',  field_key:'occurrence_place',     field_type:'TEXT',     applicable_record_types:JSON.stringify(['CASE']),     label_en:'Place of Occurrence',     label_hi:'घटना का स्थान',                visible_to_levels:L, editable_by_levels:E, section:'incident_details',         sort_order:8,  validation_rules:JSON.stringify({required:true}) },
    { id:'C_9',  field_key:'local_head',           field_type:'SELECT',   applicable_record_types:JSON.stringify(['CASE']),     label_en:'Local Head (Crime)',      label_hi:'स्थानीय अपराध शीर्ष',          visible_to_levels:L, editable_by_levels:E, section:'incident_details',         sort_order:9,  validation_rules:JSON.stringify({required:true}), is_active:true, scope_level:'global', options:JSON.stringify(["Simple Hurt","Other IPC","Other SLL","Kidnapping","Pick Pocketing","Gambling Act","Cruelty by Husband","Simple Accident","Narcotics Drugs & Psychotropic Substances Act","Robbery","Snatching","Murder","Delhi Excise Act","Att. to Murder","Burglary","Arms Act","Other Theft","House Theft","Night Burglary","Rape","Copyright Act","Cheating","Fatal Accident","Child Labour Act 1986","Att. to Culpable Homicide not Amounting to Murder","Dowry Prohibition Act 1961","Electricity Theft","Information Technology Act 2000","Grievous Hurt","Electricity Act 2003","Other Act","Eve Teasing","Trade & Merchandise Marks Act, 1958","Mobile Phone Theft","M.O. Women","Theft In Shop","POCSO Act 2012","Wild Life (Protection) Act 1972","Mischief","Day Burglary","Encroachment on Govt. Land","Servant Theft","Ext. For Ransom","Extortion","Counterfeiting","Criminal Breach of Trust","Criminal Intimidation","Threatening","Environment (Protection) Act 1986","Affray","Arson","Abetment of Suicide","Juvenile Justice Act 2015","Adultery","The Delhi Prevention of Touting and Malpractices Against Tourists Ordinance Act 2010","Att. to Commit Suicide","Acid Attack","Explosive Act 1884","Acid Attack Attempt","Immoral Traffic(Prev.) Act, 1956 (SIT Act (Immoral))","Trespass","Delhi Police Act 1978","Culpable Homicide not Amounting to Murder","Fire Incident","Dowry Death","Organised Crime","Maharashtra Control of Organised Crime Act 1999","Misappropriation of property & cruelty by inlaws","Forgery","Receiver of Stolen Property","Explosive Substances Act 1908","Foreigners Act 1946","Juvenile Justice Act 2000","Miscarriage Etc.","Prevention of Atrocities SC/ST Act 1989","House/Criminal Trespass","Abduction","Protection of Women Domestic Violence Act 2005","Dacoity","Concealment of birth","Riot","Offence against Public Servant","Stereo Theft","wrongful Confinement/restraint","Public Nuisance","National Security Act 1980","Impersonation","Assault on Public Servant","Passport Act 1967","Terrorist Act","Prevention of Damage of Public Property Act 1984","M.V. Theft","Drugging/ Poisoning","Escape from Police Custody","Civil Rights Act","Election Offences","Drugs and Cosmetics Act 1940","Offences Relating to religion","Essential Commodities Act 1955","Central Motor Vehicles Rules 1989","Motor Vehicle Act,1988","Delhi Control of vehicular and Other Traffic on Road Act","Prevention of Corruption Act 1988","Delhi Preservation of Trees Act, 1994","Juvenile Justice Act 2010","Pre-conception and pre-natal diagnostic [pndt]","Protection of human rights Act 1993","Cycle Theft","Sedition or Offences against State","Poisons Act 1919","Bombay Prevention of Begging Act 1959","Child Marriage Restraint Act 1929","Official Secrets Act,1923","Un-Natural Death / Inquest Report","Cattle Theft","M.V. Accessories Theft","Unlawful Activities (Prevention) Act 1967","Personating public servant","Unnatural Offences(SODOMY)"].map(h=>({value:h,label_en:h,label_hi:h}))) },
    { id:'C_10', field_key:'act_name',             field_type:'TEXT',     applicable_record_types:JSON.stringify(['CASE']),     label_en:'Act / Law Name',          label_hi:'अधिनियम / कानून का नाम',      visible_to_levels:L, editable_by_levels:E, section:'incident_details',         sort_order:10 },
    { id:'C_11', field_key:'sections',             field_type:'TEXT',     applicable_record_types:JSON.stringify(['CASE']),     label_en:'Sections',                label_hi:'धाराएं',                        visible_to_levels:L, editable_by_levels:E, section:'incident_details',         sort_order:11 },
    { id:'C_12', field_key:'brief_facts',          field_type:'TEXTAREA', applicable_record_types:JSON.stringify(['CASE']),     label_en:'Brief Facts of the Case', label_hi:'मामले का संक्षिप्त विवरण',     visible_to_levels:L, editable_by_levels:E, section:'incident_details',         sort_order:12, validation_rules:JSON.stringify({required:true}), full_width:true },
    { id:'C_13', field_key:'complainant_name',     field_type:'TEXT',     applicable_record_types:JSON.stringify(['CASE']),     label_en:'Complainant Name',        label_hi:'शिकायतकर्ता का नाम',          visible_to_levels:L, editable_by_levels:E, section:'complainant_accused_info', sort_order:13, validation_rules:JSON.stringify({required:true}) },
    { id:'C_14', field_key:'complainant_address',  field_type:'TEXT',     applicable_record_types:JSON.stringify(['CASE']),     label_en:'Complainant Address',     label_hi:'शिकायतकर्ता का पता',           visible_to_levels:L, editable_by_levels:E, section:'complainant_accused_info', sort_order:14 },
    { id:'C_15', field_key:'accused_name',         field_type:'TEXT',     applicable_record_types:JSON.stringify(['CASE']),     label_en:'Accused Name',            label_hi:'आरोपी का नाम',                 visible_to_levels:L, editable_by_levels:E, section:'complainant_accused_info', sort_order:15 },
    { id:'C_16', field_key:'accused_address',      field_type:'TEXT',     applicable_record_types:JSON.stringify(['CASE']),     label_en:'Accused Address',         label_hi:'आरोपी का पता',                 visible_to_levels:L, editable_by_levels:E, section:'complainant_accused_info', sort_order:16 },
    { id:'C_17', field_key:'io_name',              field_type:'TEXT',     applicable_record_types:JSON.stringify(['CASE']),     label_en:'Name of IO',              label_hi:'जांच अधिकारी का नाम',         visible_to_levels:L, editable_by_levels:E, section:'investigation_officer',    sort_order:17, validation_rules:JSON.stringify({required:true}) },
    { id:'C_18', field_key:'io_pis',               field_type:'TEXT',     applicable_record_types:JSON.stringify(['CASE']),     label_en:'PIS No. of IO',           label_hi:'जांच अधिकारी का पीआईएस नंबर', visible_to_levels:L, editable_by_levels:E, section:'investigation_officer',    sort_order:18 },
    { id:'C_19', field_key:'io_mobile',            field_type:'TEXT',     applicable_record_types:JSON.stringify(['CASE']),     label_en:'IO Mobile No.',           label_hi:'जांच अधिकारी का मोबाइल',     visible_to_levels:L, editable_by_levels:E, section:'investigation_officer',    sort_order:19 },
    { id:'C_20', field_key:'property_description', field_type:'TEXTAREA', applicable_record_types:JSON.stringify(['CASE']),     label_en:'Property Description',    label_hi:'संपत्ति का विवरण',             show_when:JSON.stringify({field:'local_head',value:['Theft', 'Robbery', 'Burglary', 'House Theft', 'Other Theft', 'Night Burglary', 'Day Burglary', 'Mobile Phone Theft', 'Cycle Theft', 'M.V. Theft', 'Snatching']}), visible_to_levels:L, editable_by_levels:E, section:'property_status',          sort_order:20, full_width:true },
    { id:'C_21', field_key:'property_status',      field_type:'SELECT',   applicable_record_types:JSON.stringify(['CASE']),     label_en:'Property Status',         label_hi:'संपत्ति की स्थिति',            show_when:JSON.stringify({field:'local_head',value:['Theft', 'Robbery', 'Burglary', 'House Theft', 'Other Theft', 'Night Burglary', 'Day Burglary', 'Mobile Phone Theft', 'Cycle Theft', 'M.V. Theft', 'Snatching']}), visible_to_levels:L, editable_by_levels:E, section:'property_status',          sort_order:21, options:JSON.stringify([{value:'Stolen',label_en:'Stolen',label_hi:'चोरी हुई'},{value:'Recovered',label_en:'Recovered',label_hi:'बरामद'},{value:'NA',label_en:'N/A',label_hi:'लागू नहीं'}]) },
    { id:'C_22', field_key:'status',               field_type:'SELECT',   applicable_record_types:JSON.stringify(['CASE']),     label_en:'Case Status',             label_hi:'मामले की स्थिति',              visible_to_levels:L, editable_by_levels:E, section:'property_status',          sort_order:22, validation_rules:JSON.stringify({required:true}), options:JSON.stringify([{value:'Open',label_en:'Open',label_hi:'लंबित'},{value:'Chargesheeted',label_en:'Chargesheeted',label_hi:'चार्जशीट'},{value:'Closed',label_en:'Closed',label_hi:'बंद'}]) },
    { id:'C_23', field_key:'remarks',              field_type:'TEXTAREA', applicable_record_types:JSON.stringify(['CASE']),     label_en:'Remarks',                 label_hi:'टिप्पणियां',                   visible_to_levels:L, editable_by_levels:E, section:'property_status',          sort_order:23, full_width:true },
    { id:'C_24', field_key:'cctns_flag',           field_type:'BOOLEAN',  applicable_record_types:JSON.stringify(['CASE']),     label_en:'CCTNS Flag',              label_hi:'सीसीटीएनएस झंडा',              visible_to_levels:L, editable_by_levels:E, section:'intranet_flags',           sort_order:24 },
    { id:'C_25', field_key:'zero_fir_flag',        field_type:'BOOLEAN',  applicable_record_types:JSON.stringify(['CASE']),     label_en:'Zero FIR',                label_hi:'जीरो एफआईआर',                  visible_to_levels:L, editable_by_levels:E, section:'intranet_flags',           sort_order:25 },
    { id:'A_1',  field_key:'linked_fir_dd_no',     field_type:'TEXT',     applicable_record_types:JSON.stringify(['ARREST']),   label_en:'Linked FIR / DD No.',     label_hi:'संबंधित एफआईआर / डीडी संख्या', visible_to_levels:L, editable_by_levels:E, section:'general_info',   sort_order:1 },
    { id:'A_2',  field_key:'act_name',             field_type:'TEXT',     applicable_record_types:JSON.stringify(['ARREST']),   label_en:'Act / Law Name',          label_hi:'अधिनियम का नाम',               visible_to_levels:L, editable_by_levels:E, section:'offence_info',   sort_order:2 },
    { id:'A_3',  field_key:'sections',             field_type:'TEXT',     applicable_record_types:JSON.stringify(['ARREST']),   label_en:'Sections',                label_hi:'धाराएं',                        visible_to_levels:L, editable_by_levels:E, section:'offence_info',   sort_order:3 },
    { id:'A_4',  field_key:'arrested_name',        field_type:'TEXT',     applicable_record_types:JSON.stringify(['ARREST']),   label_en:'Name of Arrested Person', label_hi:'गिरफ्तार व्यक्ति का नाम',      visible_to_levels:L, editable_by_levels:E, section:'arrestee_info',  sort_order:4, validation_rules:JSON.stringify({required:true}) },
    { id:'A_5',  field_key:'arrested_address',     field_type:'TEXT',     applicable_record_types:JSON.stringify(['ARREST']),   label_en:'Address of Arrested',     label_hi:'गिरफ्तार का पता',               visible_to_levels:L, editable_by_levels:E, section:'arrestee_info',  sort_order:5 },
    { id:'A_6',  field_key:'arrest_date',          field_type:'DATE',     applicable_record_types:JSON.stringify(['ARREST']),   label_en:'Date of Arrest',          label_hi:'गिरफ्तारी की तिथि',            visible_to_levels:L, editable_by_levels:E, section:'arrestee_info',  sort_order:6, validation_rules:JSON.stringify({required:true}) },
    { id:'A_7',  field_key:'arrest_place',         field_type:'TEXT',     applicable_record_types:JSON.stringify(['ARREST']),   label_en:'Place of Arrest',         label_hi:'गिरफ्तारी का स्थान',           visible_to_levels:L, editable_by_levels:E, section:'arrestee_info',  sort_order:7 },
    { id:'A_8',  field_key:'crime_head',           field_type:'SELECT',   applicable_record_types:JSON.stringify(['ARREST']),   label_en:'Crime Head',              label_hi:'अपराध शीर्ष',                  visible_to_levels:L, editable_by_levels:E, section:'offence_info',   sort_order:8, validation_rules:JSON.stringify({required:true}), is_active:true, scope_level:'global', options:JSON.stringify(["Simple Hurt","Other IPC","Other SLL","Kidnapping","Pick Pocketing","Gambling Act","Cruelty by Husband","Simple Accident","Narcotics Drugs & Psychotropic Substances Act","Robbery","Snatching","Murder","Delhi Excise Act","Att. to Murder","Burglary","Arms Act","Other Theft","House Theft","Night Burglary","Rape","Copyright Act","Cheating","Fatal Accident","Child Labour Act 1986","Att. to Culpable Homicide not Amounting to Murder","Dowry Prohibition Act 1961","Electricity Theft","Information Technology Act 2000","Grievous Hurt","Electricity Act 2003","Other Act","Eve Teasing","Trade & Merchandise Marks Act, 1958","Mobile Phone Theft","M.O. Women","Theft In Shop","POCSO Act 2012","Wild Life (Protection) Act 1972","Mischief","Day Burglary","Encroachment on Govt. Land","Servant Theft","Ext. For Ransom","Extortion","Counterfeiting","Criminal Breach of Trust","Criminal Intimidation","Threatening","Environment (Protection) Act 1986","Affray","Arson","Abetment of Suicide","Juvenile Justice Act 2015","Adultery","The Delhi Prevention of Touting and Malpractices Against Tourists Ordinance Act 2010","Att. to Commit Suicide","Acid Attack","Explosive Act 1884","Acid Attack Attempt","Immoral Traffic(Prev.) Act, 1956 (SIT Act (Immoral))","Trespass","Delhi Police Act 1978","Culpable Homicide not Amounting to Murder","Fire Incident","Dowry Death","Organised Crime","Maharashtra Control of Organised Crime Act 1999","Misappropriation of property & cruelty by inlaws","Forgery","Receiver of Stolen Property","Explosive Substances Act 1908","Foreigners Act 1946","Juvenile Justice Act 2000","Miscarriage Etc.","Prevention of Atrocities SC/ST Act 1989","House/Criminal Trespass","Abduction","Protection of Women Domestic Violence Act 2005","Dacoity","Concealment of birth","Riot","Offence against Public Servant","Stereo Theft","wrongful Confinement/restraint","Public Nuisance","National Security Act 1980","Impersonation","Assault on Public Servant","Passport Act 1967","Terrorist Act","Prevention of Damage of Public Property Act 1984","M.V. Theft","Drugging/ Poisoning","Escape from Police Custody","Civil Rights Act","Election Offences","Drugs and Cosmetics Act 1940","Offences Relating to religion","Essential Commodities Act 1955","Central Motor Vehicles Rules 1989","Motor Vehicle Act,1988","Delhi Control of vehicular and Other Traffic on Road Act","Prevention of Corruption Act 1988","Delhi Preservation of Trees Act, 1994","Juvenile Justice Act 2010","Pre-conception and pre-natal diagnostic [pndt]","Protection of human rights Act 1993","Cycle Theft","Sedition or Offences against State","Poisons Act 1919","Bombay Prevention of Begging Act 1959","Child Marriage Restraint Act 1929","Official Secrets Act,1923","Un-Natural Death / Inquest Report","Cattle Theft","M.V. Accessories Theft","Unlawful Activities (Prevention) Act 1967","Personating public servant","Unnatural Offences(SODOMY)"].map(h=>({value:h,label_en:h,label_hi:h}))) },
    { id:'A_9',  field_key:'status',               field_type:'SELECT',   applicable_record_types:JSON.stringify(['ARREST']),   label_en:'Custody Status',          label_hi:'हिरासत की स्थिति',              visible_to_levels:L, editable_by_levels:E, section:'custody_status', sort_order:9, options:JSON.stringify([{value:'judicial_custody',label_en:'Judicial Custody',label_hi:'न्यायिक हिरासत'},{value:'police_custody',label_en:'Police Custody',label_hi:'पुलिस हिरासत'},{value:'bail',label_en:'Bail Granted',label_hi:'जमानत मिली'},{value:'released',label_en:'Released',label_hi:'रिहा'},{value:'others',label_en:'Others',label_hi:'अन्य'}]) },
    { id:'A_10', field_key:'other_status_reason',  field_type:'TEXT',     applicable_record_types:JSON.stringify(['ARREST']),   label_en:'Other Status Reason',     label_hi:'अन्य स्थिति का कारण',          visible_to_levels:L, editable_by_levels:E, section:'custody_status', sort_order:10, show_when:JSON.stringify({field:'status',value:'others'}) },
    { id:'A_11', field_key:'io_name',              field_type:'TEXT',     applicable_record_types:JSON.stringify(['ARREST']),   label_en:'Arresting Officer',       label_hi:'गिरफ्तार करने वाले अधिकारी',  visible_to_levels:L, editable_by_levels:E, section:'procedure_slips',sort_order:11 },
    { id:'A_12', field_key:'nafis_prepared',       field_type:'BOOLEAN',  applicable_record_types:JSON.stringify(['ARREST']),   label_en:'NAFIS Prepared',          label_hi:'नाफिस तैयार किया गया',         visible_to_levels:L, editable_by_levels:E, section:'procedure_slips',sort_order:12 },
    { id:'A_13', field_key:'dossier_prepared',     field_type:'BOOLEAN',  applicable_record_types:JSON.stringify(['ARREST']),   label_en:'Dossier Prepared',        label_hi:'डोजियर तैयार किया गया',        visible_to_levels:L, editable_by_levels:E, section:'procedure_slips',sort_order:13 },
    { id:'P_1',  field_key:'pcr_no',               field_type:'TEXT',     applicable_record_types:JSON.stringify(['PCR_CALL']), label_en:'PCR Number',              label_hi:'पीसीआर नंबर',                  visible_to_levels:L, editable_by_levels:E, section:'informant_contact', sort_order:1 },
    { id:'P_2',  field_key:'gd_no',                field_type:'TEXT',     applicable_record_types:JSON.stringify(['PCR_CALL']), label_en:'GD Number',               label_hi:'जीडी नंबर',                    visible_to_levels:L, editable_by_levels:E, section:'informant_contact', sort_order:2, validation_rules:JSON.stringify({required:true}) },
    { id:'P_3',  field_key:'gd_date',              field_type:'DATE',     applicable_record_types:JSON.stringify(['PCR_CALL']), label_en:'GD Date',                 label_hi:'जीडी दिनांक',                  visible_to_levels:L, editable_by_levels:E, section:'informant_contact', sort_order:3 },
    { id:'P_4',  field_key:'gd_time',              field_type:'TIME',     applicable_record_types:JSON.stringify(['PCR_CALL']), label_en:'GD Time',                 label_hi:'जीडी समय',                     visible_to_levels:L, editable_by_levels:E, section:'informant_contact', sort_order:4 },
    { id:'P_5',  field_key:'call_head',            field_type:'SELECT',   applicable_record_types:JSON.stringify(['PCR_CALL']), label_en:'Call Category (Head)',     label_hi:'कॉल श्रेणी',                   visible_to_levels:L, editable_by_levels:E, section:'complaint_details', sort_order:5, validation_rules:JSON.stringify({required:true}), is_active:true, scope_level:'global', options:JSON.stringify(["Simple Hurt","Other IPC","Other SLL","Kidnapping","Pick Pocketing","Gambling Act","Cruelty by Husband","Simple Accident","Narcotics Drugs & Psychotropic Substances Act","Robbery","Snatching","Murder","Delhi Excise Act","Att. to Murder","Burglary","Arms Act","Other Theft","House Theft","Night Burglary","Rape","Copyright Act","Cheating","Fatal Accident","Child Labour Act 1986","Att. to Culpable Homicide not Amounting to Murder","Dowry Prohibition Act 1961","Electricity Theft","Information Technology Act 2000","Grievous Hurt","Electricity Act 2003","Other Act","Eve Teasing","Trade & Merchandise Marks Act, 1958","Mobile Phone Theft","M.O. Women","Theft In Shop","POCSO Act 2012","Wild Life (Protection) Act 1972","Mischief","Day Burglary","Encroachment on Govt. Land","Servant Theft","Ext. For Ransom","Extortion","Counterfeiting","Criminal Breach of Trust","Criminal Intimidation","Threatening","Environment (Protection) Act 1986","Affray","Arson","Abetment of Suicide","Juvenile Justice Act 2015","Adultery","The Delhi Prevention of Touting and Malpractices Against Tourists Ordinance Act 2010","Att. to Commit Suicide","Acid Attack","Explosive Act 1884","Acid Attack Attempt","Immoral Traffic(Prev.) Act, 1956 (SIT Act (Immoral))","Trespass","Delhi Police Act 1978","Culpable Homicide not Amounting to Murder","Fire Incident","Dowry Death","Organised Crime","Maharashtra Control of Organised Crime Act 1999","Misappropriation of property & cruelty by inlaws","Forgery","Receiver of Stolen Property","Explosive Substances Act 1908","Foreigners Act 1946","Juvenile Justice Act 2000","Miscarriage Etc.","Prevention of Atrocities SC/ST Act 1989","House/Criminal Trespass","Abduction","Protection of Women Domestic Violence Act 2005","Dacoity","Concealment of birth","Riot","Offence against Public Servant","Stereo Theft","wrongful Confinement/restraint","Public Nuisance","National Security Act 1980","Impersonation","Assault on Public Servant","Passport Act 1967","Terrorist Act","Prevention of Damage of Public Property Act 1984","M.V. Theft","Drugging/ Poisoning","Escape from Police Custody","Civil Rights Act","Election Offences","Drugs and Cosmetics Act 1940","Offences Relating to religion","Essential Commodities Act 1955","Central Motor Vehicles Rules 1989","Motor Vehicle Act,1988","Delhi Control of vehicular and Other Traffic on Road Act","Prevention of Corruption Act 1988","Delhi Preservation of Trees Act, 1994","Juvenile Justice Act 2010","Pre-conception and pre-natal diagnostic [pndt]","Protection of human rights Act 1993","Cycle Theft","Sedition or Offences against State","Poisons Act 1919","Bombay Prevention of Begging Act 1959","Child Marriage Restraint Act 1929","Official Secrets Act,1923","Un-Natural Death / Inquest Report","Cattle Theft","M.V. Accessories Theft","Unlawful Activities (Prevention) Act 1967","Personating public servant","Unnatural Offences(SODOMY)"].map(h=>({value:h,label_en:h,label_hi:h}))) },
    { id:'P_6',  field_key:'call_gist',            field_type:'TEXTAREA', applicable_record_types:JSON.stringify(['PCR_CALL']), label_en:'PCR Call Gist',           label_hi:'पीसीआर कॉल का विवरण',          visible_to_levels:L, editable_by_levels:E, section:'complaint_details', sort_order:6, validation_rules:JSON.stringify({required:true}), full_width:true },
    { id:'P_7',  field_key:'caller_name',          field_type:'TEXT',     applicable_record_types:JSON.stringify(['PCR_CALL']), label_en:'Caller Name',             label_hi:'कॉलर का नाम',                  visible_to_levels:L, editable_by_levels:E, section:'informant_contact', sort_order:7 },
    { id:'P_8',  field_key:'caller_mobile',        field_type:'TEXT',     applicable_record_types:JSON.stringify(['PCR_CALL']), label_en:'Caller Mobile',           label_hi:'कॉलर का मोबाइल',               visible_to_levels:L, editable_by_levels:E, section:'informant_contact', sort_order:8 },
    { id:'P_9',  field_key:'io_name',              field_type:'TEXT',     applicable_record_types:JSON.stringify(['PCR_CALL']), label_en:'IO / EO Name',            label_hi:'जांच / पूछताछ अधिकारी का नाम', visible_to_levels:L, editable_by_levels:E, section:'response_io',       sort_order:9 },
    { id:'P_10', field_key:'arrival_time',         field_type:'TIME',     applicable_record_types:JSON.stringify(['PCR_CALL']), label_en:'Arrival Time',            label_hi:'पहुंचने का समय',                visible_to_levels:L, editable_by_levels:E, section:'arrival_geo',       sort_order:10 },
    { id:'P_11', field_key:'status',               field_type:'SELECT',   applicable_record_types:JSON.stringify(['PCR_CALL']), label_en:'Status',                  label_hi:'स्थिति',                        visible_to_levels:L, editable_by_levels:E, section:'response_io',       sort_order:11, validation_rules:JSON.stringify({required:true}), options:JSON.stringify([{value:'attended',label_en:'Attended',label_hi:'उपस्थित'},{value:'pending',label_en:'Pending',label_hi:'लंबित'},{value:'fir_registered',label_en:'FIR Registered',label_hi:'एफआईआर दर्ज'},{value:'no_cognizable',label_en:'No Cognizable Offence',label_hi:'संज्ञेय अपराध नहीं'}]) },
    { id:'MS_1', field_key:'dd_no',                field_type:'TEXT',     applicable_record_types:JSON.stringify(['MISSING']),  label_en:'DD Number',               label_hi:'डीडी संख्या',                  visible_to_levels:L, editable_by_levels:E, section:'general_info',          sort_order:1 },
    { id:'MS_2', field_key:'dd_date',              field_type:'DATE',     applicable_record_types:JSON.stringify(['MISSING']),  label_en:'DD Date',                 label_hi:'डीडी दिनांक',                  visible_to_levels:L, editable_by_levels:E, section:'general_info',          sort_order:2 },
    { id:'MS_3', field_key:'missing_name',         field_type:'TEXT',     applicable_record_types:JSON.stringify(['MISSING']),  label_en:'Name of Missing Person',  label_hi:'लापता व्यक्ति का नाम',         visible_to_levels:L, editable_by_levels:E, section:'person_details',        sort_order:3, validation_rules:JSON.stringify({required:true}) },
    { id:'MS_4', field_key:'age',                  field_type:'NUMBER',   applicable_record_types:JSON.stringify(['MISSING']),  label_en:'Age',                     label_hi:'उम्र',                          visible_to_levels:L, editable_by_levels:E, section:'person_details',        sort_order:4 },
    { id:'MS_5', field_key:'gender',               field_type:'SELECT',   applicable_record_types:JSON.stringify(['MISSING']),  label_en:'Gender',                  label_hi:'लिंग',                          visible_to_levels:L, editable_by_levels:E, section:'person_details',        sort_order:5, validation_rules:JSON.stringify({required:true}), options:JSON.stringify([{value:'Male',label_en:'Male',label_hi:'पुरुष'},{value:'Female',label_en:'Female',label_hi:'महिला'},{value:'Other',label_en:'Other',label_hi:'अन्य'}]) },
    { id:'MS_6', field_key:'major_minor',          field_type:'RADIO',    applicable_record_types:JSON.stringify(['MISSING']),  label_en:'Major / Minor',           label_hi:'वयस्क / नाबालिग',              visible_to_levels:L, editable_by_levels:E, section:'person_details',        sort_order:6, options:JSON.stringify([{value:'Major',label_en:'Major (18+)',label_hi:'वयस्क (18+)'},{value:'Minor',label_en:'Minor (Below 18)',label_hi:'नाबालिग (18 से कम)'}]) },
    { id:'MS_7', field_key:'missing_date',         field_type:'DATE',     applicable_record_types:JSON.stringify(['MISSING']),  label_en:'Date Missing Since',      label_hi:'लापता होने की तिथि',           visible_to_levels:L, editable_by_levels:E, section:'location_particulars',  sort_order:7, validation_rules:JSON.stringify({required:true}) },
    { id:'MS_8', field_key:'missing_place',        field_type:'TEXT',     applicable_record_types:JSON.stringify(['MISSING']),  label_en:'Last Seen Place',         label_hi:'अंतिम बार देखा गया स्थान',     visible_to_levels:L, editable_by_levels:E, section:'location_particulars',  sort_order:8 },
    { id:'MS_9', field_key:'physical_description', field_type:'TEXTAREA', applicable_record_types:JSON.stringify(['MISSING']),  label_en:'Physical Description',    label_hi:'शारीरिक हुलिया',               visible_to_levels:L, editable_by_levels:E, section:'physical_bio',          sort_order:9, full_width:true },
    { id:'MS_10',field_key:'informant_name',       field_type:'TEXT',     applicable_record_types:JSON.stringify(['MISSING']),  label_en:'Informant Name',          label_hi:'सूचना देने वाले का नाम',       visible_to_levels:L, editable_by_levels:E, section:'contacts_assigned',     sort_order:10 },
    { id:'MS_11',field_key:'informant_mobile',     field_type:'TEXT',     applicable_record_types:JSON.stringify(['MISSING']),  label_en:'Informant Mobile',        label_hi:'सूचना देने वाले का मोबाइल',   visible_to_levels:L, editable_by_levels:E, section:'contacts_assigned',     sort_order:11 },
    { id:'MS_12',field_key:'io_name',              field_type:'TEXT',     applicable_record_types:JSON.stringify(['MISSING']),  label_en:'Assigned IO',             label_hi:'आवंटित जांच अधिकारी',         visible_to_levels:L, editable_by_levels:E, section:'contacts_assigned',     sort_order:12 },
    { id:'MS_13',field_key:'zipnet_no',            field_type:'TEXT',     applicable_record_types:JSON.stringify(['MISSING']),  label_en:'ZIPNET No.',              label_hi:'जिपनेट संख्या',                visible_to_levels:L, editable_by_levels:E, section:'contacts_assigned',     sort_order:13 },
    { id:'MS_14',field_key:'status',               field_type:'SELECT',   applicable_record_types:JSON.stringify(['MISSING']),  label_en:'Current Status',          label_hi:'वर्तमान स्थिति',               visible_to_levels:L, editable_by_levels:E, section:'contacts_assigned',     sort_order:14, validation_rules:JSON.stringify({required:true}), options:JSON.stringify([{value:'Missing',label_en:'Missing',label_hi:'लापता'},{value:'Traced',label_en:'Traced',label_hi:'मिल गया'},{value:'Closed',label_en:'Closed',label_hi:'बंद'}]) },
    { id:'U_1',  field_key:'dd_no',                field_type:'TEXT',     applicable_record_types:JSON.stringify(['UIDB']),     label_en:'DD Number',               label_hi:'डीडी संख्या',                  visible_to_levels:L, editable_by_levels:E, section:'general_info',       sort_order:1 },
    { id:'U_2',  field_key:'found_date',           field_type:'DATE',     applicable_record_types:JSON.stringify(['UIDB']),     label_en:'Date Body Found',         label_hi:'शव मिलने की तिथि',             visible_to_levels:L, editable_by_levels:E, section:'discovery_details',  sort_order:2, validation_rules:JSON.stringify({required:true}) },
    { id:'U_3',  field_key:'found_place',          field_type:'TEXT',     applicable_record_types:JSON.stringify(['UIDB']),     label_en:'Place Body Found',        label_hi:'शव मिलने का स्थान',            visible_to_levels:L, editable_by_levels:E, section:'discovery_details',  sort_order:3, validation_rules:JSON.stringify({required:true}) },
    { id:'U_4',  field_key:'gender',               field_type:'SELECT',   applicable_record_types:JSON.stringify(['UIDB']),     label_en:'Apparent Gender',         label_hi:'अनुमानित लिंग',                visible_to_levels:L, editable_by_levels:E, section:'corpse_desc',        sort_order:4, validation_rules:JSON.stringify({required:true}), options:JSON.stringify([{value:'Male',label_en:'Male',label_hi:'पुरुष'},{value:'Female',label_en:'Female',label_hi:'महिला'},{value:'Unknown',label_en:'Unknown',label_hi:'अज्ञात'}]) },
    { id:'U_5',  field_key:'approx_age',           field_type:'TEXT',     applicable_record_types:JSON.stringify(['UIDB']),     label_en:'Approximate Age',         label_hi:'अनुमानित उम्र',                visible_to_levels:L, editable_by_levels:E, section:'corpse_desc',        sort_order:5 },
    { id:'U_6',  field_key:'description',          field_type:'TEXTAREA', applicable_record_types:JSON.stringify(['UIDB']),     label_en:'Physical Description',    label_hi:'शारीरिक हुलिया',               visible_to_levels:L, editable_by_levels:E, section:'corpse_desc',        sort_order:6, full_width:true },
    { id:'U_7',  field_key:'io_name',              field_type:'TEXT',     applicable_record_types:JSON.stringify(['UIDB']),     label_en:'Assigned IO',             label_hi:'आवंटित जांच अधिकारी',         visible_to_levels:L, editable_by_levels:E, section:'officer_informant',  sort_order:7 },
    { id:'U_8',  field_key:'informant_name',       field_type:'TEXT',     applicable_record_types:JSON.stringify(['UIDB']),     label_en:'Informant Name',          label_hi:'सूचना देने वाले का नाम',       visible_to_levels:L, editable_by_levels:E, section:'officer_informant',  sort_order:8 },
    { id:'U_9',  field_key:'zipnet_no',            field_type:'TEXT',     applicable_record_types:JSON.stringify(['UIDB']),     label_en:'ZIPNET No.',              label_hi:'जिपनेट संख्या',                visible_to_levels:L, editable_by_levels:E, section:'zipnet_status',      sort_order:9 },
    { id:'U_10', field_key:'identified',           field_type:'BOOLEAN',  applicable_record_types:JSON.stringify(['UIDB']),     label_en:'Body Identified',         label_hi:'शव की पहचान हुई',              visible_to_levels:L, editable_by_levels:E, section:'zipnet_status',      sort_order:10 },
    { id:'U_11', field_key:'status',               field_type:'TEXT',     applicable_record_types:JSON.stringify(['UIDB']),     label_en:'Current Status / Mortuary Remarks', label_hi:'वर्तमान स्थिति / शवगृह टिप्पणी', visible_to_levels:L, editable_by_levels:E, section:'zipnet_status', sort_order:11 },
  ];
}

// ── MAIN SEED FUNCTION ─────────────────────────────────────────────────────────
async function seed() {
  await connectDB();
  console.log('🗑  Clearing existing data...');

  await db('audit_logs').del();
  await db('custom_field_values').del();
  await db('custom_field_definitions').del();
  await db('notifications').del();
  await db('compilation_records').del();
  await db('compilations').del();
  await db('workflow_transitions').del();
  await db('record_revisions').del();
  await db('records').del();
  await db('report_jobs').del();
  await db('report_templates').del();
  await db('filter_presets').del();
  await db('users').del();

  // Phase-2 tables (may not exist on Phase-1 DB — safe to ignore)
  for (const t of ['level_data_contracts','workflow_transitions_config','legacy_amendments','legacy_import_batches','scheduled_reports']) {
    try { await db(t).del(); } catch (_) {}
  }

  // ── 1. Users ──────────────────────────────────────────────────────────────────
  console.log('👮 Seeding users...');
  await db('users').insert(USERS);

  // ── 2. Field registry ─────────────────────────────────────────────────────────
  // NOTE: field_registry is managed exclusively by seeds/seed.js (npm run db:seed).
  // Do NOT insert fields here — seed.js already ran before this script.
  console.log('📋 Field registry managed by seeds/seed.js — skipping.');

  // ── 3. Report templates ───────────────────────────────────────────────────────
  console.log('📄 Seeding report templates...');
  await db('report_templates').insert(REPORT_TEMPLATES);

  // ── 4. Records + revisions + transitions ──────────────────────────────────────
  console.log('📁 Seeding records...');
  const allRevisions = [];
  const allTransitions = [];

  for (const rec of RECS) {
    const updater = rec.status === 'DRAFT' ? rec.creator
      : ['PENDING_SHO','SENT_BACK'].includes(rec.status) ? rec.creator
      : ['DISTRICT_REVIEW'].includes(rec.status) ? getSHO(rec.ps_id)
      : getDO(rec.district_id);

    await db('records').insert({
      id: rec.id,
      record_type: rec.type,
      ps_id: rec.ps_id,
      district_id: rec.district_id,
      sub_div_id: rec.sub_div_id,
      data: JSON.stringify(makeData(rec.type, rec.di, rec.ps_id)),
      current_status: rec.status,
      current_level: rec.level,
      record_date: rec.date,
      created_by: rec.creator,
      updated_by: updater,
      is_legacy: false,
    });

    allRevisions.push(...makeRevisions(rec));
    allTransitions.push(...makeTransitions(rec));
  }

  console.log('📝 Seeding revisions & transitions...');
  if (allRevisions.length) await db('record_revisions').insert(allRevisions);
  if (allTransitions.length) await db('workflow_transitions').insert(allTransitions);

  // ── 5. Compilations ───────────────────────────────────────────────────────────
  console.log('📦 Seeding compilations...');
  await db('compilations').insert(COMPILATIONS);
  if (COMPILATION_RECORDS.length) await db('compilation_records').insert(COMPILATION_RECORDS);

  // ── 6. Notifications ──────────────────────────────────────────────────────────
  console.log('🔔 Seeding notifications...');
  await db('notifications').insert(NOTIFICATIONS.map(n => ({
    ...n, created_at: new Date().toISOString()
  })));

  // ── 7. Audit logs ────────────────────────────────────────────────────────────
  console.log('🔍 Seeding audit logs...');
  await db('audit_logs').insert(makeAuditLogs());

  // ── 8. Filter presets ────────────────────────────────────────────────────────
  console.log('🔎 Seeding filter presets...');
  await db('filter_presets').insert(FILTER_PRESETS);

  // ── 9. Phase-2 tables (skip gracefully if not migrated) ──────────────────────
  try {
    console.log('⚙️  Seeding workflow transitions config...');
    await db('workflow_transitions_config').insert(WF_CONFIG);
  } catch (_) { console.warn('   (skipped — run Phase 2 migration first)'); }

  try {
    console.log('📐 Seeding level data contracts...');
    await db('level_data_contracts').insert(LEVEL_CONTRACTS);
  } catch (_) { console.warn('   (skipped — run Phase 2 migration first)'); }

  console.log('\n✅ Seed complete!');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('TEST ACCOUNTS (all passwords: Test@1234)');
  console.log('─────────────────────────────────────────────────────────────');
  const summary = [
    ['HC001',  'hc_parliament_street',  'HC',               'PS Parliament Street, NDD'],
    ['HC003',  'hc_parliament_2',       'HC',               'PS Parliament Street, NDD (2nd HC)'],
    ['HC004',  'hc_connaught_place',    'HC',               'PS Connaught Place, NDD'],
    ['SHO001', 'sho_parliament_street', 'SHO',              'PS Parliament Street, NDD'],
    ['SHO002', 'sho_connaught_place',   'SHO',              'PS Connaught Place, NDD'],
    ['ACP001', 'acp_ndd_subdiv1',       'ACP',              'Sub-Div 1, NDD'],
    ['DO001',  'dcp_ndd',               'DISTRICT_OFFICER', 'New Delhi District'],
    ['JCP001', 'jcp_new_delhi_range',   'JCP',              'New Delhi Range'],
    ['SCP001', 'scp_zone_2',            'SCP',              'Zone 2'],
    ['HC002',  'hc_adarsh_nagar',       'HC',               'PS Adarsh Nagar, NWD'],
    ['SHO003', 'sho_adarsh_nagar',      'SHO',              'PS Adarsh Nagar, NWD'],
    ['ACP002', 'acp_nwd_subdiv0',       'ACP',              'Sub-Div 0, NWD'],
    ['DO002',  'dcp_nwd',               'DISTRICT_OFFICER', 'North West District'],
    ['HQ001',  'hq_analyst',            'HQ_ANALYST',       'HQ'],
    ['HQ002',  'hq_admin',              'HQ_ADMIN',         'HQ'],
    ['SA001',  'system_admin',          'SYSTEM_ADMIN',     'HQ'],
  ];
  for (const [badge, user, role, scope] of summary)
    console.log(`  ${badge.padEnd(7)} | ${user.padEnd(26)} | ${role.padEnd(20)} | ${scope}`);

  console.log('\nRECORDS SEEDED:', RECS.length, '| COMPILATIONS:', COMPILATIONS.length);
  console.log('─────────────────────────────────────────────────────────────');

  await db.destroy();
}

seed().catch(err => { console.error('❌ Seed failed:', err.message); process.exit(1); });
