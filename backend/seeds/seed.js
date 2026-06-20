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

  // 1. Hierarchy nodes are now seeded via migrations (20260620000000_full_delhi_hierarchy.js)

  // 2. Seed users
  const passwordHash = bcrypt.hashSync('test123', 10);
  const users = [
    { id: 'U_HC001', username: 'hc_parliament_street', badge_no: 'HC001', name_en: 'Ramesh Kumar', name_hi: 'रमेश कुमार', password_hash: passwordHash, role: 'HC', station_id: 'PS_NDD_PARLIAMENTSTREET', district_id: 'DIST_NDD', sub_div_id: 'SUBDIV_DIST_NDD_1', is_active: true },
    { id: 'U_SHO001', username: 'sho_parliament_street', badge_no: 'SHO001', name_en: 'Vikram Singh', name_hi: 'विक्रम सिंह', password_hash: passwordHash, role: 'SHO', station_id: 'PS_NDD_PARLIAMENTSTREET', district_id: 'DIST_NDD', sub_div_id: 'SUBDIV_DIST_NDD_1', is_active: true },
    { id: 'U_ACP001', username: 'acp_parliament_street', badge_no: 'ACP001', name_en: 'Rakesh Yadav', name_hi: 'राकेश यादव', password_hash: passwordHash, role: 'ACP', district_id: 'DIST_NDD', sub_div_id: 'SUBDIV_DIST_NDD_1', is_active: true },
    { id: 'U_DO001', username: 'dcp_ndd', badge_no: 'DO001', name_en: 'Priya Sharma', name_hi: 'प्रिया शर्मा', password_hash: passwordHash, role: 'DISTRICT_OFFICER', district_id: 'DIST_NDD', is_active: true },
    { id: 'U_HQ001', username: 'hq_analyst', badge_no: 'HQ001', name_en: 'Anita Verma', name_hi: 'अनिता वर्मा', password_hash: passwordHash, role: 'HQ_ANALYST', is_active: true },
    { id: 'U_HQ002', username: 'hq_admin', badge_no: 'HQ002', name_en: 'Suresh Gupta', name_hi: 'सुरेश गुप्ता', password_hash: passwordHash, role: 'HQ_ADMIN', is_active: true },
    { id: 'U_SA001', username: 'system_admin', badge_no: 'SA001', name_en: 'System Admin', name_hi: 'सिस्टम व्यवस्थापक', password_hash: passwordHash, role: 'SYSTEM_ADMIN', is_active: true },
    { id: 'U_HC002', username: 'hc_adarsh_nagar', badge_no: 'HC002', name_en: 'Sunil Dutt', name_hi: 'सुनील दत्त', password_hash: passwordHash, role: 'HC', station_id: 'PS_NWD_ADARSHNAGAR', district_id: 'DIST_NWD', sub_div_id: 'SUBDIV_DIST_NWD_0', is_active: true },
    { id: 'U_DO002', username: 'dcp_nwd', badge_no: 'DO002', name_en: 'North West DCP', name_hi: 'उत्तर पश्चिम डीसीपी', password_hash: passwordHash, role: 'DISTRICT_OFFICER', district_id: 'DIST_NWD', is_active: true }
  ];


  await knex('users').insert(users);

  // 3. Seed report_templates
  const templates = [
    {
      id: 'T_DAILY_24HR_DIARY',
      name_en: '24-Hour Daily Diary (Important Cases)',
      name_hi: '24 घंटे की दैनिक डायरी (महत्वपूर्ण मामले)',
      applicable_record_types: JSON.stringify(['CASE']),
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
      applicable_record_types: JSON.stringify(['CASE']),
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

  const L = JSON.stringify(['PS', 'DISTRICT', 'HQ']);
  const E = JSON.stringify(['PS']);

  const fields = [
    // ── CASE (FIR) MODULE ────────────────────────────────────────────────────────
    { id: 'C_29', field_key: 'case_type',          field_type: 'SELECT',   applicable_record_types: JSON.stringify(['CASE']), label_en: 'Case Registration Type',  label_hi: 'मामला पंजीकरण प्रकार',          visible_to_levels: L, editable_by_levels: E, section: 'general_info',            sort_order: 0,  validation_rules: JSON.stringify({ required: true }), options: JSON.stringify([{ value: 'cctns(manual FIR)', label_en: 'cctns(manual FIR)', label_hi: 'सीसीटीएनएस (मैनुअल एफआईआर)' }, { value: 'eTheft', label_en: 'eTheft', label_hi: 'ई-चोरी' }, { value: 'eMVT', label_en: 'eMVT', label_hi: 'ई-एमवीटी' }, { value: 'NCRP', label_en: 'NCRP', label_hi: 'एनसीआरपी' }, { value: 'zero FIR', label_en: 'zero FIR', label_hi: 'जीरो एफआईआर' }]) },
    { id: 'C_1',  field_key: 'fir_no',             field_type: 'TEXT',     applicable_record_types: JSON.stringify(['CASE']), label_en: 'FIR Number',              label_hi: 'प्राथमिकी (FIR) संख्या',         visible_to_levels: L, editable_by_levels: E, section: 'general_info',            sort_order: 1,  validation_rules: JSON.stringify({ required: true }) },
    { id: 'C_2',  field_key: 'fir_date',            field_type: 'DATE',     applicable_record_types: JSON.stringify(['CASE']), label_en: 'FIR Date',                label_hi: 'एफआईआर तिथि',                   visible_to_levels: L, editable_by_levels: E, section: 'general_info',            sort_order: 2,  validation_rules: JSON.stringify({ required: true }) },
    { id: 'C_3',  field_key: 'gd_no',              field_type: 'TEXT',     applicable_record_types: JSON.stringify(['CASE']), label_en: 'GD Number',               label_hi: 'जीडी नंबर',                      visible_to_levels: L, editable_by_levels: E, section: 'general_info',            sort_order: 3,  validation_rules: JSON.stringify({ required: true }) },
    { id: 'C_4',  field_key: 'gd_date',             field_type: 'DATE',     applicable_record_types: JSON.stringify(['CASE']), label_en: 'GD Date',                 label_hi: 'जीडी दिनांक',                    visible_to_levels: L, editable_by_levels: E, section: 'general_info',            sort_order: 4 },
    { id: 'C_5',  field_key: 'gd_time',             field_type: 'TIME',     applicable_record_types: JSON.stringify(['CASE']), label_en: 'GD Time',                 label_hi: 'जीडी समय',                       visible_to_levels: L, editable_by_levels: E, section: 'general_info',            sort_order: 5 },
    { id: 'C_6',  field_key: 'beat_no',             field_type: 'TEXT',     applicable_record_types: JSON.stringify(['CASE']), label_en: 'Beat No.',                label_hi: 'बीट नंबर',                       visible_to_levels: L, editable_by_levels: E, section: 'general_info',            sort_order: 6 },
    { id: 'C_7',  field_key: 'occurrence_date',     field_type: 'DATE',     applicable_record_types: JSON.stringify(['CASE']), label_en: 'Date of Occurrence',      label_hi: 'घटना की तिथि',                   visible_to_levels: L, editable_by_levels: E, section: 'incident_details',        sort_order: 7,  validation_rules: JSON.stringify({ required: true }) },
    { id: 'C_8',  field_key: 'occurrence_place',    field_type: 'TEXT',     applicable_record_types: JSON.stringify(['CASE']), label_en: 'Place of Occurrence',     label_hi: 'घटना का स्थान',                  visible_to_levels: L, editable_by_levels: E, section: 'incident_details',        sort_order: 8,  validation_rules: JSON.stringify({ required: true }) },
    { id: 'C_9',  field_key: 'local_head',          field_type: 'SELECT',   applicable_record_types: JSON.stringify(['CASE']), label_en: 'Local Head (Crime)',       label_hi: 'स्थानीय अपराध शीर्ष',            visible_to_levels: L, editable_by_levels: E, section: 'incident_details',        sort_order: 9,  validation_rules: JSON.stringify({ required: true }), options: JSON.stringify([{ value: 'Theft', label_en: 'Theft', label_hi: 'चोरी' }, { value: 'Robbery', label_en: 'Robbery', label_hi: 'लूट' }, { value: 'Murder', label_en: 'Murder', label_hi: 'हत्या' }, { value: 'MVCT', label_en: 'Motor Vehicle Theft', label_hi: 'वाहन चोरी' }, { value: 'Cyber', label_en: 'Cyber Crime', label_hi: 'साइबर अपराध' }]) },
    { id: 'C_10', field_key: 'act_name',            field_type: 'TEXT',     applicable_record_types: JSON.stringify(['CASE']), label_en: 'Act / Law Name',          label_hi: 'अधिनियम / कानून का नाम',         visible_to_levels: L, editable_by_levels: E, section: 'incident_details',        sort_order: 10 },
    { id: 'C_11', field_key: 'sections',            field_type: 'TEXT',     applicable_record_types: JSON.stringify(['CASE']), label_en: 'Sections',                label_hi: 'धाराएं',                          visible_to_levels: L, editable_by_levels: E, section: 'incident_details',        sort_order: 11 },
    { id: 'C_12', field_key: 'brief_facts',         field_type: 'TEXTAREA', applicable_record_types: JSON.stringify(['CASE']), label_en: 'Brief Facts of the Case', label_hi: 'मामले का संक्षिप्त विवरण',       visible_to_levels: L, editable_by_levels: E, section: 'incident_details',        sort_order: 12, validation_rules: JSON.stringify({ required: true }), full_width: true },
    { id: 'C_13', field_key: 'complainant_name',    field_type: 'TEXT',     applicable_record_types: JSON.stringify(['CASE']), label_en: 'Complainant Name',        label_hi: 'शिकायतकर्ता का नाम',             visible_to_levels: L, editable_by_levels: E, section: 'complainant_accused_info', sort_order: 13, validation_rules: JSON.stringify({ required: true }) },
    { id: 'C_14', field_key: 'complainant_address', field_type: 'TEXT',     applicable_record_types: JSON.stringify(['CASE']), label_en: 'Complainant Address',     label_hi: 'शिकायतकर्ता का पता',             visible_to_levels: L, editable_by_levels: E, section: 'complainant_accused_info', sort_order: 14 },
    { id: 'C_15', field_key: 'accused_name',        field_type: 'TEXT',     applicable_record_types: JSON.stringify(['CASE']), label_en: 'Accused Name',            label_hi: 'आरोपी का नाम',                   visible_to_levels: L, editable_by_levels: E, section: 'complainant_accused_info', sort_order: 15 },
    { id: 'C_16', field_key: 'accused_address',     field_type: 'TEXT',     applicable_record_types: JSON.stringify(['CASE']), label_en: 'Accused Address',         label_hi: 'आरोपी का पता',                   visible_to_levels: L, editable_by_levels: E, section: 'complainant_accused_info', sort_order: 16 },
    { id: 'C_17', field_key: 'io_name',             field_type: 'TEXT',     applicable_record_types: JSON.stringify(['CASE']), label_en: 'Name of IO',              label_hi: 'जांच अधिकारी का नाम',            visible_to_levels: L, editable_by_levels: E, section: 'investigation_officer',   sort_order: 17, validation_rules: JSON.stringify({ required: true }) },
    { id: 'C_18', field_key: 'io_pis',              field_type: 'TEXT',     applicable_record_types: JSON.stringify(['CASE']), label_en: 'PIS No. of IO',           label_hi: 'जांच अधिकारी का पीआईएस नंबर',   visible_to_levels: L, editable_by_levels: E, section: 'investigation_officer',   sort_order: 18 },
    { id: 'C_19', field_key: 'io_mobile',           field_type: 'TEXT',     applicable_record_types: JSON.stringify(['CASE']), label_en: 'IO Mobile No.',           label_hi: 'जांच अधिकारी का मोबाइल',        visible_to_levels: L, editable_by_levels: E, section: 'investigation_officer',   sort_order: 19 },
    { id: 'C_20', field_key: 'property_description',field_type: 'TEXTAREA', applicable_record_types: JSON.stringify(['CASE']), label_en: 'Property Description',    label_hi: 'संपत्ति का विवरण',               visible_to_levels: L, editable_by_levels: E, section: 'property_status',         sort_order: 20, full_width: true },
    { id: 'C_21', field_key: 'property_status',     field_type: 'SELECT',   applicable_record_types: JSON.stringify(['CASE']), label_en: 'Property Status',         label_hi: 'संपत्ति की स्थिति',              visible_to_levels: L, editable_by_levels: E, section: 'property_status',         sort_order: 21, options: JSON.stringify([{ value: 'Stolen', label_en: 'Stolen', label_hi: 'चोरी हुई' }, { value: 'Recovered', label_en: 'Recovered', label_hi: 'बरामद' }, { value: 'NA', label_en: 'N/A', label_hi: 'लागू नहीं' }]) },
    { id: 'C_22', field_key: 'status',              field_type: 'SELECT',   applicable_record_types: JSON.stringify(['CASE']), label_en: 'Case Status',             label_hi: 'मामले की स्थिति',                visible_to_levels: L, editable_by_levels: E, section: 'property_status',         sort_order: 22, validation_rules: JSON.stringify({ required: true }), options: JSON.stringify([{ value: 'Open', label_en: 'Open', label_hi: 'लंबित' }, { value: 'Chargesheeted', label_en: 'Chargesheeted', label_hi: 'चार्जशीट' }, { value: 'Closed', label_en: 'Closed', label_hi: 'बंद' }]) },
    { id: 'C_23', field_key: 'remarks',             field_type: 'TEXTAREA', applicable_record_types: JSON.stringify(['CASE']), label_en: 'Remarks',                 label_hi: 'टिप्पणियां',                     visible_to_levels: L, editable_by_levels: E, section: 'property_status',         sort_order: 23, full_width: true },
    { id: 'C_24', field_key: 'cctns_flag',          field_type: 'BOOLEAN',  applicable_record_types: JSON.stringify(['CASE']), label_en: 'CCTNS Flag',              label_hi: 'सीसीटीएनएस झंडा',               visible_to_levels: L, editable_by_levels: E, section: 'intranet_flags',          sort_order: 24 },
    { id: 'C_25', field_key: 'zero_fir_flag',       field_type: 'BOOLEAN',  applicable_record_types: JSON.stringify(['CASE']), label_en: 'Zero FIR',                label_hi: 'जीरो एफआईआर',                    visible_to_levels: L, editable_by_levels: E, section: 'intranet_flags',          sort_order: 25 },

    // ── ARREST MODULE ────────────────────────────────────────────────────────────
    { id: 'A_1',  field_key: 'linked_fir_dd_no',   field_type: 'TEXT',     applicable_record_types: JSON.stringify(['ARREST']), label_en: 'Linked FIR / DD No.',     label_hi: 'संबंधित एफआईआर / डीडी संख्या',  visible_to_levels: L, editable_by_levels: E, section: 'general_info',   sort_order: 1 },
    { id: 'A_2',  field_key: 'act_name',            field_type: 'TEXT',     applicable_record_types: JSON.stringify(['ARREST']), label_en: 'Act / Law Name',          label_hi: 'अधिनियम का नाम',                 visible_to_levels: L, editable_by_levels: E, section: 'offence_info',   sort_order: 2 },
    { id: 'A_3',  field_key: 'sections',            field_type: 'TEXT',     applicable_record_types: JSON.stringify(['ARREST']), label_en: 'Sections',                label_hi: 'धाराएं',                          visible_to_levels: L, editable_by_levels: E, section: 'offence_info',   sort_order: 3 },
    { id: 'A_4',  field_key: 'arrested_name',       field_type: 'TEXT',     applicable_record_types: JSON.stringify(['ARREST']), label_en: 'Name of Arrested Person', label_hi: 'गिरफ्तार व्यक्ति का नाम',        visible_to_levels: L, editable_by_levels: E, section: 'arrestee_info',  sort_order: 4, validation_rules: JSON.stringify({ required: true }) },
    { id: 'A_5',  field_key: 'arrested_address',    field_type: 'TEXT',     applicable_record_types: JSON.stringify(['ARREST']), label_en: 'Address of Arrested',     label_hi: 'गिरफ्तार का पता',                 visible_to_levels: L, editable_by_levels: E, section: 'arrestee_info',  sort_order: 5 },
    { id: 'A_6',  field_key: 'arrest_date',         field_type: 'DATE',     applicable_record_types: JSON.stringify(['ARREST']), label_en: 'Date of Arrest',          label_hi: 'गिरफ्तारी की तिथि',              visible_to_levels: L, editable_by_levels: E, section: 'arrestee_info',  sort_order: 6, validation_rules: JSON.stringify({ required: true }) },
    { id: 'A_7',  field_key: 'arrest_place',        field_type: 'TEXT',     applicable_record_types: JSON.stringify(['ARREST']), label_en: 'Place of Arrest',         label_hi: 'गिरफ्तारी का स्थान',             visible_to_levels: L, editable_by_levels: E, section: 'arrestee_info',  sort_order: 7 },
    { id: 'A_8',  field_key: 'crime_head',          field_type: 'SELECT',   applicable_record_types: JSON.stringify(['ARREST']), label_en: 'Crime Head',              label_hi: 'अपराध शीर्ष',                    visible_to_levels: L, editable_by_levels: E, section: 'offence_info',   sort_order: 8, validation_rules: JSON.stringify({ required: true }), options: JSON.stringify([{ value: 'IPC', label_en: 'IPC / BNS Sections', label_hi: 'आईपीसी / बीएनएस धाराएं' }, { value: 'LOCAL', label_en: 'Special/Local Laws', label_hi: 'विशेष/स्थानीय कानून' }, { value: 'PREVENTIVE', label_en: 'Preventive Detention', label_hi: 'निवारक नजरबंदी' }]) },
    { id: 'A_9',  field_key: 'status',              field_type: 'SELECT',   applicable_record_types: JSON.stringify(['ARREST']), label_en: 'Custody Status',          label_hi: 'हिरासत की स्थिति',               visible_to_levels: L, editable_by_levels: E, section: 'custody_status', sort_order: 9, options: JSON.stringify([{ value: 'judicial_custody', label_en: 'Judicial Custody', label_hi: 'न्यायिक हिरासत' }, { value: 'police_custody', label_en: 'Police Custody', label_hi: 'पुलिस हिरासत' }, { value: 'bail', label_en: 'Bail Granted', label_hi: 'जमानत मिली' }, { value: 'released', label_en: 'Released', label_hi: 'रिहा' }, { value: 'others', label_en: 'Others', label_hi: 'अन्य' }]) },
    { id: 'A_10', field_key: 'other_status_reason', field_type: 'TEXT',     applicable_record_types: JSON.stringify(['ARREST']), label_en: 'Other Status Reason',     label_hi: 'अन्य स्थिति का कारण',            visible_to_levels: L, editable_by_levels: E, section: 'custody_status', sort_order: 10, show_when: JSON.stringify({ field: 'status', value: 'others' }) },
    { id: 'A_11', field_key: 'io_name',             field_type: 'TEXT',     applicable_record_types: JSON.stringify(['ARREST']), label_en: 'Arresting Officer',       label_hi: 'गिरफ्तार करने वाले अधिकारी',    visible_to_levels: L, editable_by_levels: E, section: 'procedure_slips', sort_order: 11 },
    { id: 'A_12', field_key: 'nafis_prepared',      field_type: 'BOOLEAN',  applicable_record_types: JSON.stringify(['ARREST']), label_en: 'NAFIS Prepared',          label_hi: 'नाफिस तैयार किया गया',           visible_to_levels: L, editable_by_levels: E, section: 'procedure_slips', sort_order: 12 },
    { id: 'A_13', field_key: 'dossier_prepared',    field_type: 'BOOLEAN',  applicable_record_types: JSON.stringify(['ARREST']), label_en: 'Dossier Prepared',        label_hi: 'डोजियर तैयार किया गया',          visible_to_levels: L, editable_by_levels: E, section: 'procedure_slips', sort_order: 13 },

    // ── PCR / KALANDRA MODULE ────────────────────────────────────────────────────
    { id: 'P_1',  field_key: 'pcr_no',              field_type: 'TEXT',     applicable_record_types: JSON.stringify(['PCR_CALL']), label_en: 'PCR Number',              label_hi: 'पीसीआर नंबर',                   visible_to_levels: L, editable_by_levels: E, section: 'informant_contact',  sort_order: 1 },
    { id: 'P_2',  field_key: 'gd_no',               field_type: 'TEXT',     applicable_record_types: JSON.stringify(['PCR_CALL']), label_en: 'GD Number',               label_hi: 'जीडी नंबर',                     visible_to_levels: L, editable_by_levels: E, section: 'informant_contact',  sort_order: 2, validation_rules: JSON.stringify({ required: true }) },
    { id: 'P_3',  field_key: 'gd_date',             field_type: 'DATE',     applicable_record_types: JSON.stringify(['PCR_CALL']), label_en: 'GD Date',                 label_hi: 'जीडी दिनांक',                   visible_to_levels: L, editable_by_levels: E, section: 'informant_contact',  sort_order: 3 },
    { id: 'P_4',  field_key: 'gd_time',             field_type: 'TIME',     applicable_record_types: JSON.stringify(['PCR_CALL']), label_en: 'GD Time',                 label_hi: 'जीडी समय',                      visible_to_levels: L, editable_by_levels: E, section: 'informant_contact',  sort_order: 4 },
    { id: 'P_5',  field_key: 'call_head',           field_type: 'SELECT',   applicable_record_types: JSON.stringify(['PCR_CALL']), label_en: 'Call Category (Head)',     label_hi: 'कॉल श्रेणी',                    visible_to_levels: L, editable_by_levels: E, section: 'complaint_details',  sort_order: 5, validation_rules: JSON.stringify({ required: true }), options: JSON.stringify([{ value: 'QUARREL', label_en: 'Quarrel / Dispute', label_hi: 'झगड़ा / विवाद' }, { value: 'ACCIDENT', label_en: 'Road Accident', label_hi: 'सड़क दुर्घटना' }, { value: 'THEFT_ALARM', label_en: 'Theft Alarm', label_hi: 'चोरी का अलार्म' }, { value: 'DOMESTIC', label_en: 'Domestic Violence', label_hi: 'घरेलू हिंसा' }, { value: 'MEDICAL', label_en: 'Medical Emergency', label_hi: 'चिकित्सा आपातकाल' }, { value: 'OTHER', label_en: 'Other', label_hi: 'अन्य' }]) },
    { id: 'P_6',  field_key: 'call_gist',           field_type: 'TEXTAREA', applicable_record_types: JSON.stringify(['PCR_CALL']), label_en: 'PCR Call Gist',           label_hi: 'पीसीआर कॉल का विवरण',           visible_to_levels: L, editable_by_levels: E, section: 'complaint_details',  sort_order: 6, validation_rules: JSON.stringify({ required: true }), full_width: true },
    { id: 'P_7',  field_key: 'caller_name',         field_type: 'TEXT',     applicable_record_types: JSON.stringify(['PCR_CALL']), label_en: 'Caller Name',             label_hi: 'कॉलर का नाम',                   visible_to_levels: L, editable_by_levels: E, section: 'informant_contact',  sort_order: 7 },
    { id: 'P_8',  field_key: 'caller_mobile',       field_type: 'TEXT',     applicable_record_types: JSON.stringify(['PCR_CALL']), label_en: 'Caller Mobile',           label_hi: 'कॉलर का मोबाइल',                visible_to_levels: L, editable_by_levels: E, section: 'informant_contact',  sort_order: 8 },
    { id: 'P_9',  field_key: 'io_name',             field_type: 'TEXT',     applicable_record_types: JSON.stringify(['PCR_CALL']), label_en: 'IO / EO Name',            label_hi: 'जांच / पूछताछ अधिकारी का नाम',  visible_to_levels: L, editable_by_levels: E, section: 'response_io',        sort_order: 9 },
    { id: 'P_10', field_key: 'arrival_time',        field_type: 'TIME',     applicable_record_types: JSON.stringify(['PCR_CALL']), label_en: 'Arrival Time',            label_hi: 'पहुंचने का समय',                  visible_to_levels: L, editable_by_levels: E, section: 'arrival_geo',        sort_order: 10 },
    { id: 'P_11', field_key: 'status',              field_type: 'SELECT',   applicable_record_types: JSON.stringify(['PCR_CALL']), label_en: 'Status',                  label_hi: 'स्थिति',                          visible_to_levels: L, editable_by_levels: E, section: 'response_io',        sort_order: 11, validation_rules: JSON.stringify({ required: true }), options: JSON.stringify([{ value: 'attended', label_en: 'Attended', label_hi: 'उपस्थित' }, { value: 'pending', label_en: 'Pending', label_hi: 'लंबित' }, { value: 'fir_registered', label_en: 'FIR Registered', label_hi: 'एफआईआर दर्ज' }, { value: 'no_cognizable', label_en: 'No Cognizable Offence', label_hi: 'संज्ञेय अपराध नहीं' }]) },

    // ── MISSING PERSON MODULE ────────────────────────────────────────────────────
    { id: 'MS_1', field_key: 'dd_no',               field_type: 'TEXT',     applicable_record_types: JSON.stringify(['MISSING']), label_en: 'DD Number',               label_hi: 'डीडी संख्या',                   visible_to_levels: L, editable_by_levels: E, section: 'general_info',            sort_order: 1 },
    { id: 'MS_2', field_key: 'dd_date',             field_type: 'DATE',     applicable_record_types: JSON.stringify(['MISSING']), label_en: 'DD Date',                 label_hi: 'डीडी दिनांक',                   visible_to_levels: L, editable_by_levels: E, section: 'general_info',            sort_order: 2 },
    { id: 'MS_3', field_key: 'missing_name',        field_type: 'TEXT',     applicable_record_types: JSON.stringify(['MISSING']), label_en: 'Name of Missing Person',  label_hi: 'लापता व्यक्ति का नाम',           visible_to_levels: L, editable_by_levels: E, section: 'person_details',          sort_order: 3, validation_rules: JSON.stringify({ required: true }) },
    { id: 'MS_4', field_key: 'age',                 field_type: 'NUMBER',   applicable_record_types: JSON.stringify(['MISSING']), label_en: 'Age',                     label_hi: 'उम्र',                            visible_to_levels: L, editable_by_levels: E, section: 'person_details',          sort_order: 4 },
    { id: 'MS_5', field_key: 'gender',              field_type: 'SELECT',   applicable_record_types: JSON.stringify(['MISSING']), label_en: 'Gender',                  label_hi: 'लिंग',                            visible_to_levels: L, editable_by_levels: E, section: 'person_details',          sort_order: 5, validation_rules: JSON.stringify({ required: true }), options: JSON.stringify([{ value: 'Male', label_en: 'Male', label_hi: 'पुरुष' }, { value: 'Female', label_en: 'Female', label_hi: 'महिला' }, { value: 'Other', label_en: 'Other', label_hi: 'अन्य' }]) },
    { id: 'MS_6', field_key: 'major_minor',         field_type: 'RADIO',    applicable_record_types: JSON.stringify(['MISSING']), label_en: 'Major / Minor',           label_hi: 'वयस्क / नाबालिग',                visible_to_levels: L, editable_by_levels: E, section: 'person_details',          sort_order: 6, options: JSON.stringify([{ value: 'Major', label_en: 'Major (18+)', label_hi: 'वयस्क (18+)' }, { value: 'Minor', label_en: 'Minor (Below 18)', label_hi: 'नाबालिग (18 से कम)' }]) },
    { id: 'MS_7', field_key: 'missing_date',        field_type: 'DATE',     applicable_record_types: JSON.stringify(['MISSING']), label_en: 'Date Missing Since',      label_hi: 'लापता होने की तिथि',             visible_to_levels: L, editable_by_levels: E, section: 'location_particulars',    sort_order: 7, validation_rules: JSON.stringify({ required: true }) },
    { id: 'MS_8', field_key: 'missing_place',       field_type: 'TEXT',     applicable_record_types: JSON.stringify(['MISSING']), label_en: 'Last Seen Place',         label_hi: 'अंतिम बार देखा गया स्थान',       visible_to_levels: L, editable_by_levels: E, section: 'location_particulars',    sort_order: 8 },
    { id: 'MS_9', field_key: 'physical_description',field_type: 'TEXTAREA', applicable_record_types: JSON.stringify(['MISSING']), label_en: 'Physical Description',    label_hi: 'शारीरिक हुलिया',                 visible_to_levels: L, editable_by_levels: E, section: 'physical_bio',            sort_order: 9, full_width: true },
    { id: 'MS_10',field_key: 'informant_name',      field_type: 'TEXT',     applicable_record_types: JSON.stringify(['MISSING']), label_en: 'Informant Name',          label_hi: 'सूचना देने वाले का नाम',         visible_to_levels: L, editable_by_levels: E, section: 'contacts_assigned',       sort_order: 10 },
    { id: 'MS_11',field_key: 'informant_mobile',    field_type: 'TEXT',     applicable_record_types: JSON.stringify(['MISSING']), label_en: 'Informant Mobile',        label_hi: 'सूचना देने वाले का मोबाइल',     visible_to_levels: L, editable_by_levels: E, section: 'contacts_assigned',       sort_order: 11 },
    { id: 'MS_12',field_key: 'io_name',             field_type: 'TEXT',     applicable_record_types: JSON.stringify(['MISSING']), label_en: 'Assigned IO',             label_hi: 'आवंटित जांच अधिकारी',           visible_to_levels: L, editable_by_levels: E, section: 'contacts_assigned',       sort_order: 12 },
    { id: 'MS_13',field_key: 'zipnet_no',           field_type: 'TEXT',     applicable_record_types: JSON.stringify(['MISSING']), label_en: 'ZIPNET No.',              label_hi: 'जिपनेट संख्या',                  visible_to_levels: L, editable_by_levels: E, section: 'contacts_assigned',       sort_order: 13 },
    { id: 'MS_14',field_key: 'status',              field_type: 'SELECT',   applicable_record_types: JSON.stringify(['MISSING']), label_en: 'Current Status',          label_hi: 'वर्तमान स्थिति',                 visible_to_levels: L, editable_by_levels: E, section: 'contacts_assigned',       sort_order: 14, validation_rules: JSON.stringify({ required: true }), options: JSON.stringify([{ value: 'Missing', label_en: 'Missing', label_hi: 'लापता' }, { value: 'Traced', label_en: 'Traced', label_hi: 'मिल गया' }, { value: 'Closed', label_en: 'Closed', label_hi: 'बंद' }]) },

    // ── UIDB (Unidentified Bodies) MODULE ────────────────────────────────────────
    { id: 'U_1',  field_key: 'dd_no',               field_type: 'TEXT',     applicable_record_types: JSON.stringify(['UIDB']), label_en: 'DD Number',               label_hi: 'डीडी संख्या',                   visible_to_levels: L, editable_by_levels: E, section: 'general_info',     sort_order: 1 },
    { id: 'U_2',  field_key: 'found_date',          field_type: 'DATE',     applicable_record_types: JSON.stringify(['UIDB']), label_en: 'Date Body Found',         label_hi: 'शव मिलने की तिथि',               visible_to_levels: L, editable_by_levels: E, section: 'discovery_details', sort_order: 2, validation_rules: JSON.stringify({ required: true }) },
    { id: 'U_3',  field_key: 'found_place',         field_type: 'TEXT',     applicable_record_types: JSON.stringify(['UIDB']), label_en: 'Place Body Found',        label_hi: 'शव मिलने का स्थान',              visible_to_levels: L, editable_by_levels: E, section: 'discovery_details', sort_order: 3, validation_rules: JSON.stringify({ required: true }) },
    { id: 'U_4',  field_key: 'gender',              field_type: 'SELECT',   applicable_record_types: JSON.stringify(['UIDB']), label_en: 'Apparent Gender',         label_hi: 'अनुमानित लिंग',                  visible_to_levels: L, editable_by_levels: E, section: 'corpse_desc',       sort_order: 4, validation_rules: JSON.stringify({ required: true }), options: JSON.stringify([{ value: 'Male', label_en: 'Male', label_hi: 'पुरुष' }, { value: 'Female', label_en: 'Female', label_hi: 'महिला' }, { value: 'Unknown', label_en: 'Unknown', label_hi: 'अज्ञात' }]) },
    { id: 'U_5',  field_key: 'approx_age',          field_type: 'TEXT',     applicable_record_types: JSON.stringify(['UIDB']), label_en: 'Approximate Age',         label_hi: 'अनुमानित उम्र',                  visible_to_levels: L, editable_by_levels: E, section: 'corpse_desc',       sort_order: 5 },
    { id: 'U_6',  field_key: 'description',         field_type: 'TEXTAREA', applicable_record_types: JSON.stringify(['UIDB']), label_en: 'Physical Description',    label_hi: 'शारीरिक हुलिया',                 visible_to_levels: L, editable_by_levels: E, section: 'corpse_desc',       sort_order: 6, full_width: true },
    { id: 'U_7',  field_key: 'io_name',             field_type: 'TEXT',     applicable_record_types: JSON.stringify(['UIDB']), label_en: 'Assigned IO',             label_hi: 'आवंटित जांच अधिकारी',           visible_to_levels: L, editable_by_levels: E, section: 'officer_informant',  sort_order: 7 },
    { id: 'U_8',  field_key: 'informant_name',      field_type: 'TEXT',     applicable_record_types: JSON.stringify(['UIDB']), label_en: 'Informant Name',          label_hi: 'सूचना देने वाले का नाम',         visible_to_levels: L, editable_by_levels: E, section: 'officer_informant',  sort_order: 8 },
    { id: 'U_9',  field_key: 'zipnet_no',           field_type: 'TEXT',     applicable_record_types: JSON.stringify(['UIDB']), label_en: 'ZIPNET No.',              label_hi: 'जिपनेट संख्या',                  visible_to_levels: L, editable_by_levels: E, section: 'zipnet_status',     sort_order: 9 },
    { id: 'U_10', field_key: 'identified',          field_type: 'BOOLEAN',  applicable_record_types: JSON.stringify(['UIDB']), label_en: 'Body Identified',         label_hi: 'शव की पहचान हुई',                visible_to_levels: L, editable_by_levels: E, section: 'zipnet_status',     sort_order: 10 },
    { id: 'U_11', field_key: 'status',              field_type: 'TEXT',     applicable_record_types: JSON.stringify(['UIDB']), label_en: 'Current Status / Mortuary Remarks', label_hi: 'वर्तमान स्थिति / शवगृह टिप्पणी', visible_to_levels: L, editable_by_levels: E, section: 'zipnet_status', sort_order: 11 },
  ];

  await knex('field_registry').insert(fields);
}
