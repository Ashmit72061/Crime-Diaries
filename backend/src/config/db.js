import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const dbPath = process.env.DB_PATH || path.resolve('database.sqlite');
let dbConnection = null;

export const getDB = async () => {
  if (dbConnection) return dbConnection;

  dbConnection = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  return dbConnection;
};

export const initDB = async () => {
  const db = await getDB();

  // Enable foreign keys
  await db.run('PRAGMA foreign_keys = ON');

  // 1. Create Reference / Master Tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS districts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sub_divisions (
      id TEXT PRIMARY KEY,
      district_id TEXT NOT NULL,
      name TEXT NOT NULL,
      acp_name TEXT NOT NULL,
      FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS police_stations (
      id TEXT PRIMARY KEY,
      sub_division_id TEXT NOT NULL,
      district_id TEXT NOT NULL,
      name TEXT NOT NULL,
      ps_code TEXT NOT NULL UNIQUE,
      beat_list TEXT NOT NULL, -- JSON array of beat strings
      FOREIGN KEY (sub_division_id) REFERENCES sub_divisions(id) ON DELETE CASCADE,
      FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('ps', 'acp', 'dcp', 'hq', 'admin')),
      district_id TEXT,
      sub_division_id TEXT,
      station_id TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (district_id) REFERENCES districts(id),
      FOREIGN KEY (sub_division_id) REFERENCES sub_divisions(id),
      FOREIGN KEY (station_id) REFERENCES police_stations(id)
    );

    CREATE TABLE IF NOT EXISTS case_heads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('Cases', 'Arrests', 'PCR', 'Missing')),
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS act_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      act_name TEXT NOT NULL,
      section_code TEXT NOT NULL,
      description TEXT NOT NULL
    );
  `);

  // 2. Create Transaction Tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS daily_records_meta (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_date TEXT NOT NULL, -- YYYY-MM-DD format
      ps_id TEXT NOT NULL,
      district_id TEXT NOT NULL,
      submission_status TEXT NOT NULL DEFAULT 'draft' CHECK (submission_status IN ('draft', 'submitted')),
      created_by INTEGER NOT NULL,
      updated_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ps_id) REFERENCES police_stations(id) ON DELETE CASCADE,
      FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (updated_by) REFERENCES users(id),
      UNIQUE(record_date, ps_id)
    );

    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meta_id INTEGER NOT NULL,
      uid TEXT NOT NULL UNIQUE,
      fir_no TEXT DEFAULT '',
      fir_date TEXT,
      gd_no TEXT NOT NULL,
      gd_date TEXT NOT NULL,
      gd_time TEXT NOT NULL,
      occurrence_date TEXT NOT NULL,
      occurrence_place TEXT NOT NULL,
      occurrence_time TEXT,
      brief_facts TEXT NOT NULL,
      case_head_id INTEGER NOT NULL,
      case_head_dcp_override INTEGER,
      act_name TEXT NOT NULL,
      section_text TEXT NOT NULL,
      complainant_name TEXT NOT NULL,
      complainant_address TEXT NOT NULL,
      accused_name TEXT NOT NULL,
      accused_address TEXT NOT NULL,
      arrest_date TEXT,
      io_name TEXT NOT NULL,
      io_pis TEXT NOT NULL,
      io_mobile TEXT NOT NULL,
      property_description TEXT DEFAULT '',
      property_status TEXT NOT NULL CHECK (property_status IN ('Stolen', 'Recovered', 'Partly Recovered', 'Not Applicable')),
      stolen_property TEXT,
      recovered_property TEXT,
      status TEXT NOT NULL CHECK (status IN ('Open', 'Chargesheeted', 'Closed', 'Cancelled', 'Other')),
      status_other TEXT,
      remarks TEXT DEFAULT '',
      cctns_flag INTEGER NOT NULL DEFAULT 0,
      etheft_flag INTEGER NOT NULL DEFAULT 0,
      emvt_flag INTEGER NOT NULL DEFAULT 0,
      ncrp_flag INTEGER NOT NULL DEFAULT 0,
      zero_fir_flag INTEGER NOT NULL DEFAULT 0,
      case_type TEXT,
      case_type_other TEXT,
      sid_no TEXT,
      beat_no TEXT NOT NULL,
      rc_no TEXT DEFAULT '',
      theft_from TEXT DEFAULT '',
      time_of_theft TEXT DEFAULT '',
      motive TEXT DEFAULT '',
      hotspot TEXT DEFAULT '',
      agency TEXT DEFAULT '',
      agency_order_date TEXT DEFAULT '',
      pending_investigation_age TEXT DEFAULT '',
      victim_mobile TEXT DEFAULT '',
      io_position TEXT DEFAULT '',
      accused_count INTEGER DEFAULT 0,
      accused_victim_relation TEXT DEFAULT '',
      stolen_article_type TEXT DEFAULT '',
      weapon_used TEXT DEFAULT '',
      vehicle_used TEXT DEFAULT '',
      work_out TEXT DEFAULT '',
      date_of_work_out TEXT DEFAULT '',
      disposed_date TEXT DEFAULT '',
      pending_investigation_reason TEXT DEFAULT '',
      created_by INTEGER NOT NULL,
      updated_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (meta_id) REFERENCES daily_records_meta(id) ON DELETE CASCADE,
      FOREIGN KEY (case_head_id) REFERENCES case_heads(id),
      FOREIGN KEY (case_head_dcp_override) REFERENCES case_heads(id),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (updated_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS arrests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meta_id INTEGER NOT NULL,
      seq_no INTEGER NOT NULL,
      linked_case_id INTEGER,
      linked_fir_dd_no TEXT DEFAULT '',
      linked_fir_dd_date TEXT,
      linked_fir_dd_time TEXT DEFAULT '',
      act_name TEXT NOT NULL,
      act_sections TEXT NOT NULL,
      arrested_name TEXT NOT NULL,
      arrested_address TEXT NOT NULL,
      arrest_date TEXT NOT NULL,
      arrest_time TEXT NOT NULL,
      arrest_place TEXT NOT NULL,
      informant_name TEXT NOT NULL,
      informant_address TEXT NOT NULL,
      informant_tel TEXT NOT NULL,
      nafis_prepared TEXT NOT NULL CHECK (nafis_prepared IN ('Yes', 'No', 'Not Applicable')),
      dossier_prepared TEXT NOT NULL CHECK (dossier_prepared IN ('Yes', 'No', 'Not Applicable')),
      search_slip_prepared TEXT NOT NULL CHECK (search_slip_prepared IN ('Yes', 'No', 'Not Applicable')),
      address_verified TEXT NOT NULL CHECK (address_verified IN ('Verified', 'Not Verified', 'Pending')),
      verifying_officer_name TEXT DEFAULT '',
      verifying_officer_rank TEXT DEFAULT '',
      crime_head_id INTEGER NOT NULL,
      crime_head_dcp_override INTEGER,
      status TEXT NOT NULL CHECK (status IN ('bail', 'judicial custody', 'police custody', 'others')),
      status_other_text TEXT DEFAULT '',
      recovered_material TEXT DEFAULT '',
      special_scheme TEXT NOT NULL DEFAULT 'None' CHECK (special_scheme IN ('integrated patrolling', 'group patrolling', 'cycle patrolling', 'anti snatching', 'PRAHARI', 'Eye and ear scheme', 'None')),
      accused_photo TEXT,
      created_by INTEGER NOT NULL,
      updated_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (meta_id) REFERENCES daily_records_meta(id) ON DELETE CASCADE,
      FOREIGN KEY (linked_case_id) REFERENCES cases(id) ON DELETE SET NULL,
      FOREIGN KEY (crime_head_id) REFERENCES case_heads(id),
      FOREIGN KEY (crime_head_dcp_override) REFERENCES case_heads(id),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (updated_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS pcr_klandras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meta_id INTEGER NOT NULL,
      seq_no INTEGER NOT NULL,
      gd_no TEXT NOT NULL,
      gd_date TEXT NOT NULL,
      gd_time TEXT NOT NULL,
      call_head TEXT NOT NULL,
      complainant_name TEXT NOT NULL,
      complainant_address TEXT NOT NULL,
      call_gist TEXT NOT NULL,
      io_name TEXT NOT NULL,
      eo_name TEXT DEFAULT '',
      action_taken TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('Action Taken', 'Pending', 'Referred', 'Closed')),
      arrival_dd_no TEXT NOT NULL,
      arrival_date TEXT NOT NULL,
      arrival_time TEXT NOT NULL,
      latitude TEXT DEFAULT '',
      longitude TEXT DEFAULT '',
      beat_no TEXT NOT NULL,
      created_by INTEGER NOT NULL,
      updated_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (meta_id) REFERENCES daily_records_meta(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (updated_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS missing_persons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meta_id INTEGER NOT NULL,
      record_subtype TEXT NOT NULL CHECK (record_subtype IN ('Missing Person', 'Unidentified Recovered', 'Found Person')),
      dd_fir_no TEXT NOT NULL,
      dd_fir_date TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female', 'Transgender', 'Unknown')),
      physical_description TEXT NOT NULL,
      last_seen_location TEXT DEFAULT '',
      found_location TEXT DEFAULT '',
      date_missing_recovered TEXT NOT NULL,
      time_missing_recovered TEXT NOT NULL,
      informant_name TEXT NOT NULL,
      informant_contact TEXT NOT NULL,
      io_name TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('Active', 'Traced', 'Closed', 'Referred')),
      remarks TEXT DEFAULT '',
      dd_fir_time TEXT DEFAULT '',
      duty_officer TEXT DEFAULT '',
      track_child_no TEXT DEFAULT '',
      track_child_date TEXT DEFAULT '',
      major_minor TEXT CHECK(major_minor IN ('Major', 'Minor', 'Unknown')) DEFAULT 'Unknown',
      zipnet_no TEXT DEFAULT '',
      traced_dd_no TEXT DEFAULT '',
      fir_no_year TEXT DEFAULT '',
      fir_date TEXT DEFAULT '',
      is_identified TEXT CHECK(is_identified IN ('Yes', 'No', 'Pending')) DEFAULT 'No',
      created_by INTEGER NOT NULL,
      updated_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (meta_id) REFERENCES daily_records_meta(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (updated_by) REFERENCES users(id)
    );
  `);

  // 3. Create Audit and Custom Fields Tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      action TEXT NOT NULL CHECK (action IN ('create', 'update', 'override')),
      changed_by INTEGER NOT NULL,
      changed_by_role TEXT NOT NULL,
      field_name TEXT DEFAULT '',
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT NOT NULL,
      reason TEXT,
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (changed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS custom_field_definitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module TEXT NOT NULL CHECK (module IN ('cases', 'arrests', 'pcr', 'missing')),
      field_key TEXT NOT NULL,
      field_label TEXT NOT NULL,
      field_type TEXT NOT NULL CHECK (field_type IN ('text', 'long_text', 'number', 'date', 'dropdown')),
      options_json TEXT, -- JSON array of strings for dropdown type
      is_required INTEGER NOT NULL DEFAULT 0,
      scope_level TEXT NOT NULL CHECK (scope_level IN ('district', 'hq')),
      scope_id TEXT, -- District ID or NULL if HQ
      is_active INTEGER NOT NULL DEFAULT 1,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS custom_field_values (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER NOT NULL,
      record_type TEXT NOT NULL CHECK (record_type IN ('Case', 'Arrest', 'PCRKalandra', 'MissingPerson')),
      field_definition_id INTEGER NOT NULL,
      value_text TEXT NOT NULL,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (field_definition_id) REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
  `);

  // Run dynamic migrations to ensure existing database gets updated
  try {
    await db.run('ALTER TABLE arrests ADD COLUMN accused_photo TEXT');
  } catch (e) {}

  const newCasesCols = [
    ['rc_no', "TEXT DEFAULT ''"],
    ['theft_from', "TEXT DEFAULT ''"],
    ['time_of_theft', "TEXT DEFAULT ''"],
    ['motive', "TEXT DEFAULT ''"],
    ['hotspot', "TEXT DEFAULT ''"],
    ['agency', "TEXT DEFAULT ''"],
    ['agency_order_date', "TEXT DEFAULT ''"],
    ['pending_investigation_age', "TEXT DEFAULT ''"],
    ['victim_mobile', "TEXT DEFAULT ''"],
    ['io_position', "TEXT DEFAULT ''"],
    ['accused_count', "INTEGER DEFAULT 0"],
    ['accused_victim_relation', "TEXT DEFAULT ''"],
    ['stolen_article_type', "TEXT DEFAULT ''"],
    ['weapon_used', "TEXT DEFAULT ''"],
    ['vehicle_used', "TEXT DEFAULT ''"],
    ['work_out', "TEXT DEFAULT ''"],
    ['date_of_work_out', "TEXT DEFAULT ''"],
    ['disposed_date', "TEXT DEFAULT ''"],
    ['pending_investigation_reason', "TEXT DEFAULT ''"]
  ];

  for (const [colName, colType] of newCasesCols) {
    try {
      await db.run(`ALTER TABLE cases ADD COLUMN ${colName} ${colType}`);
    } catch (e) {}
  }

  const newMissingCols = [
    ['dd_fir_time', "TEXT DEFAULT ''"],
    ['duty_officer', "TEXT DEFAULT ''"],
    ['track_child_no', "TEXT DEFAULT ''"],
    ['track_child_date', "TEXT DEFAULT ''"],
    ['major_minor', "TEXT CHECK(major_minor IN ('Major', 'Minor', 'Unknown')) DEFAULT 'Unknown'"],
    ['zipnet_no', "TEXT DEFAULT ''"],
    ['traced_dd_no', "TEXT DEFAULT ''"],
    ['fir_no_year', "TEXT DEFAULT ''"],
    ['fir_date', "TEXT DEFAULT ''"],
    ['is_identified', "TEXT CHECK(is_identified IN ('Yes', 'No', 'Pending')) DEFAULT 'No'"]
  ];

  for (const [colName, colType] of newMissingCols) {
    try {
      await db.run(`ALTER TABLE missing_persons ADD COLUMN ${colName} ${colType}`);
    } catch (e) {}
  }

  // Create case_accused repeating sub-table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS case_accused (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      father_name TEXT,
      address TEXT,
      arrest_date TEXT,
      age INTEGER,
      state_origin TEXT,
      recovery_details TEXT,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );
  `);

  // 4. Seed Data
  await seedData(db);
};

const seedData = async (db) => {
  // Check if seeding is already done by querying districts
  const districtRow = await db.get('SELECT COUNT(*) as count FROM districts');
  if (districtRow.count > 0) {
    return;
  }

  console.log('[SEED] Seeding SQLite database...');

  // 1. Read Police Station Mapping
  const mappingPath = path.resolve('..', 'police_station_mapping.json');
  let mappingData = {};
  if (fs.existsSync(mappingPath)) {
    mappingData = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
  } else {
    // Fallback static structure for local runs
    mappingData = {
      NWD: ['Adarsh Nagar', 'Ashok Vihar', 'Bharat Nagar', 'Jahangir Puri', 'PS Cyber Crime'],
      CD: ['Anand Parbat', 'Chandni Mahal', 'Karol Bagh', 'Pahar Ganj', 'PS Cyber Crime']
    };
  }

  // Seed Districts, Sub-Divisions and Police Stations
  for (const [distCode, psNames] of Object.entries(mappingData)) {
    await db.run('INSERT INTO districts (id, name) VALUES (?, ?)', [distCode, `${distCode} District`]);

    // Create 3 sub-divisions for each district
    const subDivs = [];
    for (let i = 1; i <= 3; i++) {
      const subDivId = `${distCode}_SUBDIV_${i}`;
      const subDivName = `${distCode} Sub-Division ${i}`;
      await db.run(
        'INSERT INTO sub_divisions (id, district_id, name, acp_name) VALUES (?, ?, ?, ?)',
        [subDivId, distCode, subDivName, `ACP Assistant Commissioner ${i} [${distCode}]`]
      );
      subDivs.push(subDivId);
    }

    // Distribute police stations
    for (let idx = 0; idx < psNames.length; idx++) {
      const psName = psNames[idx];
      const subDivId = subDivs[idx % 3];
      const psId = `PS_${distCode}_${psName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
      const beatList = JSON.stringify(['Beat 1', 'Beat 2', 'Beat 3', 'Beat 4', 'Beat 5']);

      await db.run(
        'INSERT INTO police_stations (id, sub_division_id, district_id, name, ps_code, beat_list) VALUES (?, ?, ?, ?, ?, ?)',
        [psId, subDivId, distCode, `PS ${psName}`, `PS-${distCode}-${idx + 100}`, beatList]
      );
    }
  }

  // Seed Case Heads
  const caseHeads = [
    { code: 'MURDER', description: 'Murder (Sec 302 IPC)', category: 'Cases' },
    { code: 'ATTEMPT_TO_MURDER', description: 'Attempt to Murder (Sec 307 IPC)', category: 'Cases' },
    { code: 'ROBBERY', description: 'Robbery (Sec 392 IPC)', category: 'Cases' },
    { code: 'BURGLARY', description: 'Burglary (Sec 457 IPC)', category: 'Cases' },
    { code: 'THEFT', description: 'Theft (Sec 379 IPC)', category: 'Cases' },
    { code: 'MOTOR_VEHICLE_THEFT', description: 'Motor Vehicle Theft (Sec 379 IPC - MV)', category: 'Cases' },
    { code: 'CYBER_CRIME', description: 'Cyber Crime Cases (IT Act)', category: 'Cases' },
    { code: 'ACCIDENT', description: 'Fatal Road Accident (Sec 304A IPC)', category: 'Cases' },
    { code: 'OTHER_IPC', description: 'Other IPC Cases', category: 'Cases' },

    { code: 'ARREST_IPC', description: 'Arrests under IPC sections', category: 'Arrests' },
    { code: 'ARREST_LOCAL_SPECIAL', description: 'Arrests under Special/Local Laws', category: 'Arrests' },
    { code: 'PREVENTIVE_DETENTION', description: 'Preventive Detention (Sec 107/151 CrPC)', category: 'Arrests' },

    { code: 'QUARREL', description: 'Quarrel / Physical Dispute Call', category: 'PCR' },
    { code: 'ACCIDENT_PCR', description: 'Road Accident / Hospital Info', category: 'PCR' },
    { code: 'THEFT_ALARM', description: 'Theft / Burglary Call', category: 'PCR' },
    { code: 'DOMESTIC_VIOLENCE', description: 'Domestic Violence Complaint', category: 'PCR' },
    { code: 'SUSPICIOUS_PERSON', description: 'Suspicious Activity / Person Call', category: 'PCR' },

    { code: 'MISSING_PERSON', description: 'Missing Person Reports', category: 'Missing' },
    { code: 'UNIDENTIFIED_BODY', description: 'Unidentified Recovered Bodies', category: 'Missing' },
    { code: 'FOUND_PERSON', description: 'Found / Traced Persons', category: 'Missing' },
  ];

  for (const ch of caseHeads) {
    await db.run(
      'INSERT INTO case_heads (code, description, category) VALUES (?, ?, ?)',
      [ch.code, ch.description, ch.category]
    );
  }

  // Seed Act Sections
  const actSections = [
    { actName: 'IPC', sectionCode: '302', description: 'Punishment for murder' },
    { actName: 'IPC', sectionCode: '307', description: 'Attempt to murder' },
    { actName: 'IPC', sectionCode: '392', description: 'Punishment for robbery' },
    { actName: 'IPC', sectionCode: '457', description: 'Lurking house-trespass or house-breaking by night' },
    { actName: 'IPC', sectionCode: '379', description: 'Punishment for theft' },
    { actName: 'IPC', sectionCode: '304A', description: 'Causing death by negligence' },
    { actName: 'IT_ACT', sectionCode: '66', description: 'Computer related offences' },
    { actName: 'IT_ACT', sectionCode: '66D', description: 'Cheating by personation by using computer resource' },
    { actName: 'NDPS_ACT', sectionCode: '20', description: 'Punishment for cannabis' },
    { actName: 'POCSO_ACT', sectionCode: '4', description: 'Punishment for penetrative sexual assault' }
  ];

  for (const as of actSections) {
    await db.run(
      'INSERT INTO act_sections (act_name, section_code, description) VALUES (?, ?, ?)',
      [as.actName, as.sectionCode, as.description]
    );
  }

  // Seed Users
  const passwordHash = await bcrypt.hash('password123', 12);
  const users = [
    { username: 'admin_user', email: 'admin@delhipolice.gov.in', role: 'admin', district: null, subdivision: null, station: null },
    { username: 'hq_user', email: 'hq@delhipolice.gov.in', role: 'hq', district: null, subdivision: null, station: null },
    { username: 'dcp_nwd', email: 'dcp.nwd@delhipolice.gov.in', role: 'dcp', district: 'NWD', subdivision: null, station: null },
    { username: 'acp_nwd_1', email: 'acp.nwd1@delhipolice.gov.in', role: 'acp', district: 'NWD', subdivision: 'NWD_SUBDIV_1', station: null },
    { username: 'ps_adarsh_nagar', email: 'ps.adarshnagar@delhipolice.gov.in', role: 'ps', district: 'NWD', subdivision: 'NWD_SUBDIV_1', station: 'PS_NWD_ADARSH_NAGAR' },
  ];

  for (const u of users) {
    await db.run(
      'INSERT INTO users (username, email, password_hash, role, district_id, sub_division_id, station_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [u.username, u.email, passwordHash, u.role, u.district, u.subdivision, u.station]
    );
  }

  console.log('[SEED] Seeding complete successfully!');
};
