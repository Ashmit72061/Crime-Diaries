import bcrypt from 'bcryptjs';

export async function seed(knex) {
  // Clear tables
  await knex('audit_logs').del();
  await knex('custom_field_values').del();
  await knex('custom_field_definitions').del();
  await knex('filter_presets').del();
  await knex('report_jobs').del();
  await knex('report_templates').del();
  await knex('notifications').del();
  await knex('compilation_records').del();
  await knex('compilations').del();
  await knex('workflow_transitions').del();
  await knex('record_revisions').del();
  await knex('records').del();
  await knex('field_registry').del();
  await knex('users').del();
  await knex('hierarchy_nodes').del();

  // 1. Seed hierarchy_nodes
  const nodes = [
    { id: 'HQ', node_type: 'HQ', name_en: 'Delhi Police HQ', name_hi: 'दिल्ली पुलिस मुख्यालय', code: 'DP_HQ', parent_id: null, is_active: true },
    { id: 'ZONE_NORTH', node_type: 'SCP', name_en: 'Northern Zone', name_hi: 'उत्तरी क्षेत्र', code: 'DP_ZN', parent_id: 'HQ', is_active: true },
    { id: 'RANGE_NORTH', node_type: 'JCP', name_en: 'Northern Range', name_hi: 'उत्तरी रेंज', code: 'DP_RN', parent_id: 'ZONE_NORTH', is_active: true },
    { id: 'DISTRICT_NWD', node_type: 'DISTRICT', name_en: 'North West District (NWD)', name_hi: 'उत्तर पश्चिम जिला (एनडब्ल्यूडी)', code: 'DP_NWD', parent_id: 'RANGE_NORTH', is_active: true },

    // Sub-divisions
    { id: 'SUBDIV_ASHOK_VIHAR', node_type: 'SUB_DIVISION', name_en: 'Ashok Vihar Sub-Division', name_hi: 'अशोक विहार सब-डिवीजन', code: 'AV_SD', parent_id: 'DISTRICT_NWD', is_active: true },
    { id: 'SUBDIV_SARASWATI_VIHAR', node_type: 'SUB_DIVISION', name_en: 'Saraswati Vihar Sub-Division', name_hi: 'सरस्वती विहार सब-डिवीजन', code: 'SV_SD', parent_id: 'DISTRICT_NWD', is_active: true },
    { id: 'SUBDIV_SHALIMAR_BAGH', node_type: 'SUB_DIVISION', name_en: 'Shalimar Bagh Sub-Division', name_hi: 'शालीमार बाग सब-डिवीजन', code: 'SB_SD', parent_id: 'DISTRICT_NWD', is_active: true },
    { id: 'SUBDIV_JAHANGIR_PURI', node_type: 'SUB_DIVISION', name_en: 'Jahangir Puri Sub-Division', name_hi: 'जहांगीर पुरी सब-डिवीजन', code: 'JP_SD', parent_id: 'DISTRICT_NWD', is_active: true },
    { id: 'SUBDIV_MODEL_TOWN', node_type: 'SUB_DIVISION', name_en: 'Model Town Sub-Division', name_hi: 'मॉडल टाउन सब-डिवीजन', code: 'MT_SD', parent_id: 'DISTRICT_NWD', is_active: true },

    // Police Stations
    { id: 'PS_ASHOK_VIHAR', node_type: 'PS', name_en: 'PS Ashok Vihar', name_hi: 'थाना अशोक विहार', code: 'PS_AV', parent_id: 'SUBDIV_ASHOK_VIHAR', is_active: true },
    { id: 'PS_BHARAT_NAGAR', node_type: 'PS', name_en: 'PS Bharat Nagar', name_hi: 'थाना भारत नगर', code: 'PS_BN', parent_id: 'SUBDIV_ASHOK_VIHAR', is_active: true },
    { id: 'PS_KESHAV_PURAM', node_type: 'PS', name_en: 'PS Keshav Puram', name_hi: 'थाना केशव पुरम', code: 'PS_KP', parent_id: 'SUBDIV_ASHOK_VIHAR', is_active: true },

    { id: 'PS_SUBHASH_PLACE', node_type: 'PS', name_en: 'PS Subhash Place', name_hi: 'थाना सुभाष प्लेस', code: 'PS_SP', parent_id: 'SUBDIV_SARASWATI_VIHAR', is_active: true },
    { id: 'PS_MAURYA_ENCLAVE', node_type: 'PS', name_en: 'PS Maurya Enclave', name_hi: 'थाना मौर्य एन्क्लेव', code: 'PS_ME', parent_id: 'SUBDIV_SARASWATI_VIHAR', is_active: true },

    { id: 'PS_SHALIMAR_BAGH', node_type: 'PS', name_en: 'PS Shalimar Bagh', name_hi: 'थाना शालीमार बाग', code: 'PS_SB', parent_id: 'SUBDIV_SHALIMAR_BAGH', is_active: true },
    { id: 'PS_MAHENDRA_PARK', node_type: 'PS', name_en: 'PS Mahendra Park', name_hi: 'थाना महेन्द्र पार्क', code: 'PS_MP', parent_id: 'SUBDIV_SHALIMAR_BAGH', is_active: true },

    { id: 'PS_JAHANGIR_PURI', node_type: 'PS', name_en: 'PS Jahangir Puri', name_hi: 'थाना जहांगीर पुरी', code: 'PS_JP', parent_id: 'SUBDIV_JAHANGIR_PURI', is_active: true },
    { id: 'PS_ADARSH_NAGAR', node_type: 'PS', name_en: 'PS Adarsh Nagar', name_hi: 'थाना आदर्श नगर', code: 'PS_AN', parent_id: 'SUBDIV_JAHANGIR_PURI', is_active: true },

    { id: 'PS_MODEL_TOWN', node_type: 'PS', name_en: 'PS Model Town', name_hi: 'थाना मॉडल टाउन', code: 'PS_MT', parent_id: 'SUBDIV_MODEL_TOWN', is_active: true },
    { id: 'PS_MUKHARJEE_NAGAR', node_type: 'PS', name_en: 'PS Mukherjee Nagar', name_hi: 'थाना मुखर्जी नगर', code: 'PS_MN', parent_id: 'SUBDIV_MODEL_TOWN', is_active: true },
    { id: 'PS_CYBER_CRIME', node_type: 'PS', name_en: 'PS Cyber Crime', name_hi: 'थाना साइबर क्राइम', code: 'PS_CC', parent_id: 'SUBDIV_MODEL_TOWN', is_active: true },
  ];

  await knex('hierarchy_nodes').insert(nodes);

  // 2. Seed users
  const passwordHash = bcrypt.hashSync('test123', 10);
  const users = [
    { id: 'U_HC001', username: 'hc_adarsh_nagar', badge_no: 'HC001', name_en: 'Ramesh Kumar', name_hi: 'रमेश कुमार', password_hash: passwordHash, role: 'HC', station_id: 'PS_ADARSH_NAGAR', district_id: 'DISTRICT_NWD', sub_div_id: 'SUBDIV_JAHANGIR_PURI', is_active: true },
    { id: 'U_SHO001', username: 'sho_adarsh_nagar', badge_no: 'SHO001', name_en: 'Vikram Singh', name_hi: 'विक्रम सिंह', password_hash: passwordHash, role: 'SHO', station_id: 'PS_ADARSH_NAGAR', district_id: 'DISTRICT_NWD', sub_div_id: 'SUBDIV_JAHANGIR_PURI', is_active: true },
    { id: 'U_JCP001', username: 'jcp_north', badge_no: 'JCP001', name_en: 'Northern JCP', name_hi: 'उत्तरी जेसीपी', password_hash: passwordHash, role: 'JCP', district_id: 'DISTRICT_NWD', is_active: true },
    { id: 'U_SCP001', username: 'scp_north', badge_no: 'SCP001', name_en: 'Northern SCP', name_hi: 'उत्तरी एससीपी', password_hash: passwordHash, role: 'SCP', district_id: 'DISTRICT_NWD', is_active: true },
    { id: 'U_DO001', username: 'dcp_nwd', badge_no: 'DO001', name_en: 'Priya Sharma', name_hi: 'प्रिया शर्मा', password_hash: passwordHash, role: 'DISTRICT_OFFICER', district_id: 'DISTRICT_NWD', is_active: true },
    { id: 'U_HQ001', username: 'hq_analyst', badge_no: 'HQ001', name_en: 'Anita Verma', name_hi: 'अनिता वर्मा', password_hash: passwordHash, role: 'HQ_ANALYST', is_active: true },
    { id: 'U_HQ002', username: 'hq_admin', badge_no: 'HQ002', name_en: 'Suresh Gupta', name_hi: 'सुरेश गुप्ता', password_hash: passwordHash, role: 'HQ_ADMIN', is_active: true },
    { id: 'U_SA001', username: 'system_admin', badge_no: 'SA001', name_en: 'System Admin', name_hi: 'सिस्टम व्यवस्थापक', password_hash: passwordHash, role: 'SYSTEM_ADMIN', is_active: true }
  ];

  await knex('users').insert(users);

  // 3. Seed report_templates
  const templates = [
    {
      id: 'T_DAILY_24HR_DIARY',
      name_en: '24-Hour Daily Diary (Important Cases)',
      name_hi: '24 घंटे की दैनिक डायरी (महत्वपूर्ण मामले)',
      applicable_record_types: JSON.stringify(['CASES']),
      applicable_levels: JSON.stringify(['DISTRICT', 'HQ']),
      template_definition: JSON.stringify({
        layout: 'A4_PORTRAIT',
        header: { title_en: 'DELHI POLICE DAILY REPORT', title_hi: 'दिल्ली पुलिस दैनिक रिपोर्ट' },
        sections: [
          {
            title_en: 'Details of Important Cases Registered During Last 24 Hours',
            title_hi: 'पिछले 24 घंटों के दौरान पंजीकृत महत्वपूर्ण मामलों का विवरण',
            fields: ['fir_no', 'fir_date', 'gd_no', 'occurrence_place', 'brief_facts']
          }
        ]
      }),
      output_formats: JSON.stringify(['PDF', 'EXCEL']),
      is_active: true,
      created_by: 'U_SA001'
    },
    {
      id: 'T_DAILY_CRIME_STATEMENT',
      name_en: 'PS-wise Daily Crime Statement',
      name_hi: 'थानेवार दैनिक अपराध विवरण',
      applicable_record_types: JSON.stringify(['CASES']),
      applicable_levels: JSON.stringify(['DISTRICT', 'HQ']),
      template_definition: JSON.stringify({
        layout: 'A4_LANDSCAPE',
        header: { title_en: 'DAILY CRIME STATEMENT', title_hi: 'दैनिक अपराध विवरण' },
        sections: [
          {
            title_en: 'Police Station Crime Distribution Table',
            title_hi: 'थानेवार अपराध वितरण तालिका',
            fields: ['ps_id', 'case_head', 'status']
          }
        ]
      }),
      output_formats: JSON.stringify(['PDF', 'EXCEL']),
      is_active: true,
      created_by: 'U_SA001'
    }
  ];

  await knex('report_templates').insert(templates);

  const fields = [
    // --- SHARED FIELDS ---
    {
      id: 'C_1', field_key: 'record_date', field_type: 'DATE',
      applicable_record_types: JSON.stringify(['CASES', 'ARREST', 'PCR']),
      label_en: 'Reporting Date', label_hi: 'रिपोर्टिंग दिनांक',
      visible_to_levels: JSON.stringify(['PS', 'DISTRICT', 'HQ']), editable_by_levels: JSON.stringify(['PS']),
      section: 'Identity', sort_order: 1, validation_rules: JSON.stringify({ required: true })
    },

    // --- CASES MODULE ---
    {
      id: 'C_2', field_key: 'fir_no', field_type: 'TEXT',
      applicable_record_types: JSON.stringify(['CASES']),
      label_en: 'FIR Number', label_hi: 'प्रथम सूचना रिपोर्ट संख्या',
      visible_to_levels: JSON.stringify(['PS', 'DISTRICT', 'HQ']), editable_by_levels: JSON.stringify(['PS']),
      section: 'Identity', sort_order: 2, validation_rules: JSON.stringify({ required: true })
    },
    {
      id: 'C_3', field_key: 'fir_date', field_type: 'DATE',
      applicable_record_types: JSON.stringify(['CASES']),
      label_en: 'FIR Date', label_hi: 'एफआईआर तिथि',
      visible_to_levels: JSON.stringify(['PS', 'DISTRICT', 'HQ']), editable_by_levels: JSON.stringify(['PS']),
      section: 'Identity', sort_order: 3, validation_rules: JSON.stringify({ required: true })
    },
    {
      id: 'C_4', field_key: 'gd_no', field_type: 'TEXT',
      applicable_record_types: JSON.stringify(['CASES']),
      label_en: 'GD Number', label_hi: 'जीडी नंबर',
      visible_to_levels: JSON.stringify(['PS', 'DISTRICT', 'HQ']), editable_by_levels: JSON.stringify(['PS']),
      section: 'Identity', sort_order: 4, validation_rules: JSON.stringify({ required: true })
    },
    {
      id: 'C_5', field_key: 'gd_date', field_type: 'DATE',
      applicable_record_types: JSON.stringify(['CASES']),
      label_en: 'GD Date', label_hi: 'जीडी दिनांक',
      visible_to_levels: JSON.stringify(['PS', 'DISTRICT', 'HQ']), editable_by_levels: JSON.stringify(['PS']),
      section: 'Identity', sort_order: 5, validation_rules: JSON.stringify({ required: true })
    },
    {
      id: 'C_6', field_key: 'gd_time', field_type: 'TEXT',
      applicable_record_types: JSON.stringify(['CASES']),
      label_en: 'GD Time', label_hi: 'जीडी समय',
      visible_to_levels: JSON.stringify(['PS', 'DISTRICT', 'HQ']), editable_by_levels: JSON.stringify(['PS']),
      section: 'Identity', sort_order: 6, validation_rules: JSON.stringify({ required: true })
    },
    {
      id: 'C_7', field_key: 'occurrence_date', field_type: 'DATE',
      applicable_record_types: JSON.stringify(['CASES']),
      label_en: 'Date of Occurrence', label_hi: 'घटना की तिथि',
      visible_to_levels: JSON.stringify(['PS', 'DISTRICT', 'HQ']), editable_by_levels: JSON.stringify(['PS']),
      section: 'Incident', sort_order: 7, validation_rules: JSON.stringify({ required: true })
    },
    {
      id: 'C_8', field_key: 'occurrence_time', field_type: 'TEXT',
      applicable_record_types: JSON.stringify(['CASES']),
      label_en: 'Time of Occurrence', label_hi: 'घटना का समय',
      visible_to_levels: JSON.stringify(['PS', 'DISTRICT', 'HQ']), editable_by_levels: JSON.stringify(['PS']),
      section: 'Incident', sort_order: 8
    },
    {
      id: 'C_9', field_key: 'occurrence_place', field_type: 'TEXT',
      applicable_record_types: JSON.stringify(['CASES']),
      label_en: 'Place of Occurrence', label_hi: 'घटना का स्थान',
      visible_to_levels: JSON.stringify(['PS', 'DISTRICT', 'HQ']), editable_by_levels: JSON.stringify(['PS']),
      section: 'Incident', sort_order: 9, validation_rules: JSON.stringify({ required: true })
    },
    {
      id: 'C_10', field_key: 'case_head', field_type: 'SELECT',
      applicable_record_types: JSON.stringify(['CASES']),
      label_en: 'Local Head (Case Head)', label_hi: 'स्थानीय अपराध शीर्ष',
      visible_to_levels: JSON.stringify(['PS', 'DISTRICT', 'HQ']), editable_by_levels: JSON.stringify(['PS']),
      options: JSON.stringify([
        { value: 'MURDER', label_en: 'Murder (Sec 302 IPC)', label_hi: 'हत्या (धारा 302 आईपीसी)' },
        { value: 'ATTEMPT_TO_MURDER', label_en: 'Attempt to Murder (Sec 307 IPC)', label_hi: 'हत्या का प्रयास (धारा 307 आईपीसी)' },
        { value: 'ROBBERY', label_en: 'Robbery (Sec 392 IPC)', label_hi: 'लूट (धारा 392 आईपीसी)' },
        { value: 'BURGLARY', label_en: 'Burglary (Sec 457 IPC)', label_hi: 'सेंधमारी (धारा 457 आईपीसी)' },
        { value: 'THEFT', label_en: 'Theft (Sec 379 IPC)', label_hi: 'चोरी (धारा 379 आईपीसी)' },
        { value: 'MOTOR_VEHICLE_THEFT', label_en: 'Motor Vehicle Theft', label_hi: 'वाहन चोरी' },
        { value: 'CYBER_CRIME', label_en: 'Cyber Crime', label_hi: 'साइबर अपराध' }
      ]),
      section: 'Incident', sort_order: 10, validation_rules: JSON.stringify({ required: true })
    },
    {
      id: 'C_11', field_key: 'brief_facts', field_type: 'TEXTAREA',
      applicable_record_types: JSON.stringify(['CASES']),
      label_en: 'Brief Facts of the Case', label_hi: 'मामले का संक्षिप्त विवरण',
      visible_to_levels: JSON.stringify(['PS', 'DISTRICT', 'HQ']), editable_by_levels: JSON.stringify(['PS']),
      section: 'Incident', sort_order: 11, validation_rules: JSON.stringify({ required: true })
    },
    {
      id: 'C_12', field_key: 'complainant_name', field_type: 'TEXT',
      applicable_record_types: JSON.stringify(['CASES']),
      label_en: 'Name of Complainant', label_hi: 'शिकायतकर्ता का नाम',
      visible_to_levels: JSON.stringify(['PS', 'DISTRICT', 'HQ']), editable_by_levels: JSON.stringify(['PS']),
      section: 'Complainant', sort_order: 12, validation_rules: JSON.stringify({ required: true })
    },
    {
      id: 'C_13', field_key: 'complainant_address', field_type: 'TEXT',
      applicable_record_types: JSON.stringify(['CASES']),
      label_en: 'Address of Complainant', label_hi: 'शिकायतकर्ता का पता',
      visible_to_levels: JSON.stringify(['PS', 'DISTRICT', 'HQ']), editable_by_levels: JSON.stringify(['PS']),
      section: 'Complainant', sort_order: 13
    },
    {
      id: 'C_14', field_key: 'accused_name', field_type: 'TEXT',
      applicable_record_types: JSON.stringify(['CASES']),
      label_en: 'Name of Accused', label_hi: 'आरोपी का नाम',
      visible_to_levels: JSON.stringify(['PS', 'DISTRICT', 'HQ']), editable_by_levels: JSON.stringify(['PS']),
      section: 'Accused', sort_order: 14
    },
    {
      id: 'C_15', field_key: 'accused_address', field_type: 'TEXT',
      applicable_record_types: JSON.stringify(['CASES']),
      label_en: 'Address of Accused', label_hi: 'आरोपी का पता',
      visible_to_levels: JSON.stringify(['PS', 'DISTRICT', 'HQ']), editable_by_levels: JSON.stringify(['PS']),
      section: 'Accused', sort_order: 15
    },
    {
      id: 'C_16', field_key: 'io_name', field_type: 'TEXT',
      applicable_record_types: JSON.stringify(['CASES']),
      label_en: 'Name of IO', label_hi: 'जांच अधिकारी का नाम',
      visible_to_levels: JSON.stringify(['PS', 'DISTRICT', 'HQ']), editable_by_levels: JSON.stringify(['PS']),
      section: 'Investigation', sort_order: 16, validation_rules: JSON.stringify({ required: true })
    },
    {
      id: 'C_17', field_key: 'io_pis', field_type: 'TEXT',
      applicable_record_types: JSON.stringify(['CASES']),
      label_en: 'PIS No. of IO', label_hi: 'जांच अधिकारी का पीआईएस नंबर',
      visible_to_levels: JSON.stringify(['PS', 'DISTRICT', 'HQ']), editable_by_levels: JSON.stringify(['PS']),
      section: 'Investigation', sort_order: 17, validation_rules: JSON.stringify({ required: true })
    },
    {
      id: 'C_18', field_key: 'status', field_type: 'SELECT',
      applicable_record_types: JSON.stringify(['CASES']),
      label_en: 'Status', label_hi: 'स्थिति',
      visible_to_levels: JSON.stringify(['PS', 'DISTRICT', 'HQ']), editable_by_levels: JSON.stringify(['PS']),
      options: JSON.stringify([
        { value: 'Open', label_en: 'Open', label_hi: 'लंबित' },
        { value: 'Chargesheeted', label_en: 'Chargesheeted', label_hi: 'चार्जशीट दायर' },
        { value: 'Closed', label_en: 'Closed', label_hi: 'बंद' },
        { value: 'Cancelled', label_en: 'Cancelled', label_hi: 'निरस्त' }
      ]),
      section: 'Status', sort_order: 18, validation_rules: JSON.stringify({ required: true })
    },

    // --- ARREST MODULE ---
    {
      id: 'A_2', field_key: 'linked_fir_no', field_type: 'TEXT',
      applicable_record_types: JSON.stringify(['ARREST']),
      label_en: 'Linked FIR / DD No.', label_hi: 'संबंधित एफआईआर / डीडी संख्या',
      visible_to_levels: JSON.stringify(['PS', 'DISTRICT', 'HQ']), editable_by_levels: JSON.stringify(['PS']),
      section: 'Linked Case', sort_order: 2
    },
    {
      id: 'A_3', field_key: 'arrested_name', field_type: 'TEXT',
      applicable_record_types: JSON.stringify(['ARREST']),
      label_en: 'Name of Arrested Person', label_hi: 'गिरफ्तार व्यक्ति का नाम',
      visible_to_levels: JSON.stringify(['PS', 'DISTRICT', 'HQ']), editable_by_levels: JSON.stringify(['PS']),
      section: 'Arrested Info', sort_order: 3, validation_rules: JSON.stringify({ required: true })
    },
    {
      id: 'A_4', field_key: 'arrest_date', field_type: 'DATE',
      applicable_record_types: JSON.stringify(['ARREST']),
      label_en: 'Date of Arrest', label_hi: 'गिरफ्तारी की तिथि',
      visible_to_levels: JSON.stringify(['PS', 'DISTRICT', 'HQ']), editable_by_levels: JSON.stringify(['PS']),
      section: 'Arrested Info', sort_order: 4, validation_rules: JSON.stringify({ required: true })
    },
    {
      id: 'A_5', field_key: 'crime_head', field_type: 'SELECT',
      applicable_record_types: JSON.stringify(['ARREST']),
      label_en: 'Crime Head', label_hi: 'अपराध शीर्ष',
      visible_to_levels: JSON.stringify(['PS', 'DISTRICT', 'HQ']), editable_by_levels: JSON.stringify(['PS']),
      options: JSON.stringify([
        { value: 'ARREST_IPC', label_en: 'Arrests under IPC sections', label_hi: 'आईपीसी के तहत गिरफ्तारियां' },
        { value: 'ARREST_LOCAL_SPECIAL', label_en: 'Special/Local Laws Arrests', label_hi: 'विशेष/स्थानीय कानून गिरफ्तारियां' },
        { value: 'PREVENTIVE_DETENTION', label_en: 'Preventive Detention (107/151 CrPC)', label_hi: 'निवारक नजरबंदी' }
      ]),
      section: 'Classification', sort_order: 5, validation_rules: JSON.stringify({ required: true })
    },

    // --- PCR MODULE ---
    {
      id: 'P_2', field_key: 'pcr_gd_no', field_type: 'TEXT',
      applicable_record_types: JSON.stringify(['PCR']),
      label_en: 'GD Number', label_hi: 'जीडी नंबर',
      visible_to_levels: JSON.stringify(['PS', 'DISTRICT', 'HQ']), editable_by_levels: JSON.stringify(['PS']),
      section: 'Identity', sort_order: 2, validation_rules: JSON.stringify({ required: true })
    },
    {
      id: 'P_3', field_key: 'pcr_head', field_type: 'SELECT',
      applicable_record_types: JSON.stringify(['PCR']),
      label_en: 'Call Category (Head)', label_hi: 'कॉल श्रेणी',
      visible_to_levels: JSON.stringify(['PS', 'DISTRICT', 'HQ']), editable_by_levels: JSON.stringify(['PS']),
      options: JSON.stringify([
        { value: 'QUARREL', label_en: 'Quarrel / Dispute', label_hi: 'झगड़ा / विवाद' },
        { value: 'ACCIDENT_PCR', label_en: 'Road Accident', label_hi: 'सड़क दुर्घटना' },
        { value: 'THEFT_ALARM', label_en: 'Theft Alarm', label_hi: 'चोरी का अलार्म' },
        { value: 'DOMESTIC_VIOLENCE', label_en: 'Domestic Violence', label_hi: 'घरेलू हिंसा' }
      ]),
      section: 'Category', sort_order: 3, validation_rules: JSON.stringify({ required: true })
    },
    {
      id: 'P_4', field_key: 'call_gist', field_type: 'TEXTAREA',
      applicable_record_types: JSON.stringify(['PCR']),
      label_en: 'PCR Call Gist', label_hi: 'पीसीआर कॉल का विवरण',
      visible_to_levels: JSON.stringify(['PS', 'DISTRICT', 'HQ']), editable_by_levels: JSON.stringify(['PS']),
      section: 'Gist', sort_order: 4, validation_rules: JSON.stringify({ required: true })
    }
  ];

  await knex('field_registry').insert(fields);
}
