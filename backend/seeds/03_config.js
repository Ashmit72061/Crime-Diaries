// backend/seeds/03_config.js
// System configuration data — report templates and record link types.
//
// Strategy: ON CONFLICT DO NOTHING — safe to re-run indefinitely.
// Adding a new report template? Add a row here and run npm run db:seed.

export async function seed(knex) {
  // ── Report Templates ──────────────────────────────────────────────────────────
  const templates = [
    {
      id:                    'T_DAILY_24HR_DIARY',
      name_en:               '24-Hour Daily Diary (Important Cases)',
      name_hi:               '24 घंटे की दैनिक डायरी (महत्वपूर्ण मामले)',
      applicable_record_types: JSON.stringify(['CASE']),
      applicable_levels:     JSON.stringify(['DISTRICT', 'HQ']),
      template_definition:   JSON.stringify({
        layout: 'A4_PORTRAIT',
        header: { title_en: 'DELHI POLICE DAILY REPORT', title_hi: 'दिल्ली पुलिस दैनिक रिपोर्ट' },
        sections: [
          {
            title_en: 'Details of Important Cases Registered During Last 24 Hours',
            title_hi: 'पिछले 24 घंटों के दौरान पंजीकृत महत्वपूर्ण मामलों का विवरण',
            fields: ['fir_no', 'fir_date', 'gd_no', 'occurrence_place', 'brief_facts'],
          },
        ],
      }),
      output_formats: JSON.stringify(['PDF', 'EXCEL']),
      is_active:      true,
      created_by:     'U_SA001',
    },
    {
      id:                    'T_DAILY_CRIME_STATEMENT',
      name_en:               'PS-wise Daily Crime Statement',
      name_hi:               'थानेवार दैनिक अपराध विवरण',
      applicable_record_types: JSON.stringify(['CASE']),
      applicable_levels:     JSON.stringify(['DISTRICT', 'HQ']),
      template_definition:   JSON.stringify({
        layout: 'A4_LANDSCAPE',
        header: { title_en: 'DAILY CRIME STATEMENT', title_hi: 'दैनिक अपराध विवरण' },
        sections: [
          {
            title_en: 'Police Station Crime Distribution Table',
            title_hi: 'थानेवार अपराध वितरण तालिका',
            fields: ['ps_id', 'case_head', 'status'],
          },
        ],
      }),
      output_formats: JSON.stringify(['PDF', 'EXCEL']),
      is_active:      true,
      created_by:     'U_SA001',
    },
    {
      id:                    'T_DAILY_CRIME_STMT',
      name_en:               'PS-wise Daily Crime Statement (Short)',
      name_hi:               'थानेवार दैनिक अपराध विवरण (संक्षिप्त)',
      applicable_record_types: JSON.stringify(['CASE']),
      applicable_levels:     JSON.stringify(['DISTRICT', 'HQ']),
      template_definition:   JSON.stringify({
        layout: 'A4_LANDSCAPE',
        header: { title_en: 'DAILY CRIME STATEMENT', title_hi: 'दैनिक अपराध विवरण' },
        sections: [{ title_en: 'PS Crime Table', title_hi: 'थानेवार तालिका', fields: ['ps_id', 'local_head', 'status'] }],
      }),
      output_formats: JSON.stringify(['PDF', 'EXCEL']),
      is_active:      true,
      created_by:     'U_SA001',
    },
    {
      id:                    'T_ARREST_REGISTER',
      name_en:               'Arrest Register (Proforma-2)',
      name_hi:               'गिरफ्तारी पंजी (प्रपत्र-2)',
      applicable_record_types: JSON.stringify(['ARREST']),
      applicable_levels:     JSON.stringify(['PS', 'DISTRICT', 'HQ']),
      template_definition:   JSON.stringify({
        layout: 'A4_PORTRAIT',
        header: { title_en: 'ARREST REGISTER', title_hi: 'गिरफ्तारी पंजी' },
        sections: [{ title_en: 'Arrest Details', title_hi: 'गिरफ्तारी विवरण', fields: ['arrested_name', 'arrest_date', 'crime_head', 'sections', 'io_name', 'status'] }],
      }),
      output_formats: JSON.stringify(['PDF', 'EXCEL']),
      is_active:      true,
      created_by:     'U_SA001',
    },
    {
      id:                    'T_MISSING_PERSON',
      name_en:               'Missing Persons Register',
      name_hi:               'लापता व्यक्ति पंजी',
      applicable_record_types: JSON.stringify(['MISSING']),
      applicable_levels:     JSON.stringify(['PS', 'DISTRICT', 'HQ']),
      template_definition:   JSON.stringify({
        layout: 'A4_PORTRAIT',
        header: { title_en: 'MISSING PERSONS REGISTER', title_hi: 'लापता व्यक्ति पंजी' },
        sections: [{ title_en: 'Person Details', title_hi: 'व्यक्ति विवरण', fields: ['dd_no', 'missing_name', 'age', 'gender', 'missing_date', 'missing_place', 'status'] }],
      }),
      output_formats: JSON.stringify(['PDF', 'EXCEL']),
      is_active:      true,
      created_by:     'U_SA001',
    },
  ];

  await knex('report_templates').insert(templates).onConflict('id').ignore();
  console.log(`[03_config] Upserted ${templates.length} report templates`);

  // ── Link Type Registry ────────────────────────────────────────────────────────
  // These also exist in migration 20260621000000_record_linkage.js via raw SQL.
  // ON CONFLICT (code) DO NOTHING makes this safe to run even when migration already ran.
  const hasTable = await knex.schema.hasTable('link_type_registry');
  if (hasTable) {
    const linkTypes = [
      { code: 'CASE_ARREST',  source_record_type: 'CASE', target_record_type: 'ARREST',   label_en: 'Case → Arrest',         label_hi: 'मामला → गिरफ्तारी',       cardinality: 'ONE_TO_MANY', is_active: true },
      { code: 'CASE_MISSING', source_record_type: 'CASE', target_record_type: 'MISSING',  label_en: 'Case → Missing Person', label_hi: 'मामला → लापता व्यक्ति',   cardinality: 'ONE_TO_MANY', is_active: false },
      { code: 'CASE_PCR',     source_record_type: 'CASE', target_record_type: 'PCR_CALL', label_en: 'Case → PCR Call',       label_hi: 'मामला → पीसीआर कॉल',      cardinality: 'ONE_TO_MANY', is_active: false },
      { code: 'CASE_UIDB',    source_record_type: 'CASE', target_record_type: 'UIDB',     label_en: 'Case → UIDB Record',    label_hi: 'मामला → यूआईडीबी रिकॉर्ड', cardinality: 'ONE_TO_MANY', is_active: false },
    ];
    await knex('link_type_registry').insert(linkTypes).onConflict('code').ignore();
    console.log(`[03_config] Upserted ${linkTypes.length} link types`);
  }
}
