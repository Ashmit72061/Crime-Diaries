/**
 * Migration: Daily Diary Report Views & Aggregate Functions
 *
 * Creates public-schema views that the parallel report engine queries.
 * All SQL is inlined here — no external .sql file dependencies.
 *
 * Layers:
 *   1. Reference views  (ref_district, ref_police_station, ref_crime_head, ...)
 *   2. Master views     (fir_master, arrest_master, pcr_kalandra_master, missing_master, uidb_master)
 *   3. Report views     (rpt_NN_* — one per daily-diary sheet)
 *   4. Aggregate funcs  (rpt_06_arrested_all_heads_fn, rpt_28_fir_goswara_summary_fn)
 *
 * Depends on: 20260620200000_warehouse_schema.js (rpt.* tables)
 * PostgreSQL only — skips SQLite.
 */

export async function up(knex) {
  if (knex.client.config.client === 'sqlite3') return;

  // ── ENUM types ──────────────────────────────────────────────────────────────
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE gender_type AS ENUM ('Male','Female','Transgender','Unknown');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE yes_no_type AS ENUM ('Yes','No');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);

  // ── Drop all dependent views first (CASCADE handles ordering) ──────────────
  const reportViews = [
    'rpt_27_important_cases',
    'rpt_26_inquest_acp_sdm_disposal',
    'rpt_25_inquest_registered',
    'rpt_21_traced_persons',
    'rpt_20_abandoned_persons',
    'rpt_19_uidb',
    'rpt_18_missing_persons',
    'rpt_13_arrested_24hrs_list',
    'rpt_11_proclaimed_offenders',
    'rpt_10_arrested_efir_mv_theft',
    'rpt_09_arrested_efir_theft',
    'rpt_08_arrested_kalandara',
    'rpt_07_arrested_east_district',
    'rpt_05_mvt_cases',
    'rpt_04_e_other_theft_cases',
    'rpt_03_e_house_theft_cases',
    'rpt_02_e_burglary_cases',
    'rpt_01_manual_fir',
    'uidb_master',
    'missing_master',
    'pcr_kalandra_master',
    'arrest_master',
    'fir_master',
    'ref_missing_category',
    'ref_arrest_section_category',
    'ref_special_scheme',
    'ref_arrest_status',
    'ref_case_status',
    'ref_act_law',
    'ref_crime_head',
    'ref_case_reg_type',
    'ref_police_station',
    'ref_district',
  ];
  for (const v of reportViews) {
    await knex.raw(`DROP VIEW IF EXISTS ?? CASCADE`, [v]);
  }
  await knex.raw(`DROP FUNCTION IF EXISTS rpt_06_arrested_all_heads_fn(date) CASCADE`);
  await knex.raw(`DROP FUNCTION IF EXISTS rpt_28_fir_goswara_summary_fn(date) CASCADE`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. REFERENCE VIEWS
  // ═══════════════════════════════════════════════════════════════════════════

  await knex.raw(`
    CREATE VIEW ref_district AS
    SELECT sk AS district_id, name_en::varchar(100) AS district_name
    FROM rpt.dim_district;
  `);

  await knex.raw(`
    CREATE VIEW ref_police_station AS
    SELECT sk AS ps_id, district_sk AS district_id, name_en::varchar(150) AS ps_name
    FROM rpt.dim_police_station;
  `);

  await knex.raw(`
    CREATE VIEW ref_case_reg_type AS
    SELECT 1 AS case_reg_type_id, 'MANUAL_FIR'::varchar(30) AS code, 'Manual FIR'::varchar(100) AS label
    UNION ALL
    SELECT 2, 'E_THEFT'::varchar(30), 'E-FIR Theft'::varchar(100)
    UNION ALL
    SELECT 3, 'E_MVT'::varchar(30), 'E-FIR MVT'::varchar(100);
  `);

  await knex.raw(`
    CREATE VIEW ref_crime_head AS
    SELECT
      sk AS crime_head_id,
      value_normalized::varchar(50) AS crime_head_code,
      value_raw::varchar(150) AS crime_head_name,
      CASE
        WHEN value_raw IN ('Burglary', 'Night Burglary', 'Day Burglary') THEN 'BURGLARY'
        WHEN value_raw IN ('House Theft') THEN 'HOUSE_THEFT'
        WHEN value_raw IN ('Other Theft','Theft In Shop','Servant Theft','Stereo Theft','Cattle Theft','M.V. Accessories Theft') THEN 'OTHER_THEFT'
        WHEN value_raw IN ('M.V. Theft') THEN 'MVT'
        ELSE NULL
      END::varchar(20) AS theft_category
    FROM rpt.dim_crime_head;
  `);

  await knex.raw(`
    CREATE VIEW ref_act_law AS
    SELECT sk AS act_law_id, value_normalized::varchar(50) AS act_code, value_raw::varchar(150) AS act_name
    FROM rpt.dim_act_law;
  `);

  await knex.raw(`
    CREATE VIEW ref_case_status AS
    SELECT
      sk AS case_status_id,
      value_normalized::varchar(40) AS code,
      value_raw::varchar(100) AS label,
      CASE WHEN value_raw IN ('Closed','Chargesheeted') THEN TRUE ELSE FALSE END AS is_disposed
    FROM rpt.dim_case_status WHERE record_type = 'CASE';
  `);

  await knex.raw(`
    CREATE VIEW ref_arrest_status AS
    SELECT
      sk AS arrest_status_id,
      value_normalized::varchar(30) AS code,
      value_raw::varchar(80) AS label
    FROM rpt.dim_case_status WHERE record_type = 'ARREST';
  `);

  await knex.raw(`
    CREATE VIEW ref_special_scheme AS
    SELECT 1 AS scheme_id, 'INTEGRATED_PI'::varchar(40) AS code, 'INTEGRATED PI'::varchar(100) AS label
    UNION ALL SELECT 2, 'GROUP_PATROLLING'::varchar(40), 'GROUP PATROLLING'::varchar(100)
    UNION ALL SELECT 3, 'CYCLE_PATROLLING'::varchar(40), 'CYCLE PATROLLING'::varchar(100)
    UNION ALL SELECT 4, 'ANTI_SNATCHING'::varchar(40), 'ANTI SNATCHING'::varchar(100)
    UNION ALL SELECT 5, 'PRAHARI'::varchar(40), 'PRAHARI'::varchar(100)
    UNION ALL SELECT 6, 'EYES_EARS'::varchar(40), 'EYES EARS'::varchar(100);
  `);

  await knex.raw(`
    CREATE VIEW ref_arrest_section_category AS
    SELECT 1 AS section_category_id, 'S_126_170_BNSS'::varchar(40) AS code, 'Preventive BNSS'::varchar(100) AS label
    UNION ALL SELECT 2, 'S_40_EX'::varchar(40), 'Excise'::varchar(100)
    UNION ALL SELECT 3, 'S_92_93_97_DP'::varchar(40), 'DP Act'::varchar(100);
  `);

  await knex.raw(`
    CREATE VIEW ref_missing_category AS
    SELECT 1 AS category_id, 'MISSING'::varchar(30) AS code, 'Missing Person'::varchar(100) AS label
    UNION ALL SELECT 2, 'ABANDONED_UNCONSCIOUS'::varchar(30), 'Abandoned / Unconscious'::varchar(100);
  `);

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. MASTER VIEWS
  // ═══════════════════════════════════════════════════════════════════════════

  await knex.raw(`
    CREATE VIEW fir_master AS
    SELECT
      f.source_record_id::varchar(36) AS record_uid,
      f.district_sk AS district_id,
      f.ps_sk AS ps_id,
      'Submitted'::varchar AS submission_status,
      CASE
        WHEN f.local_head = 'M.V. Theft' THEN 3
        WHEN f.local_head IN ('Theft','Robbery','Burglary','House Theft','Other Theft','Night Burglary','Day Burglary','Mobile Phone Theft','Cycle Theft','Snatching') THEN 2
        ELSE 1
      END AS case_reg_type_id,
      f.fir_no AS fir_number,
      f.fir_date,
      f.gd_no AS dd_number,
      f.gd_date AS dd_date,
      COALESCE(f.gd_time,'12:00:00')::time AS dd_time,
      f.crime_head_sk AS crime_head_id,
      f.act_law_sk AS act_law_id,
      f.sections,
      f.beat_no,
      f.occurrence_date AS date_of_occurrence,
      COALESCE((r.data::jsonb->>'occurrence_time'),'12:00:00')::time AS time_of_occurrence,
      f.occurrence_place AS place_of_occurrence,
      f.brief_facts,
      f.complainant_name,
      (r.data::jsonb->>'complainant_parent_name')::varchar AS complainant_parent_name,
      f.complainant_address,
      f.accused_name,
      (r.data::jsonb->>'accused_parent_name')::varchar AS accused_parent_name,
      f.accused_address,
      CASE WHEN EXISTS (SELECT 1 FROM rpt.bridge_fir_arrest b WHERE b.fir_sk = f.sk) THEN 'Yes'::yes_no_type ELSE 'No'::yes_no_type END AS has_arrested_person,
      f.property_description AS stolen_property_desc,
      (r.data::jsonb->>'stolen_property_value')::numeric AS stolen_property_value,
      (r.data::jsonb->>'recovered_property_desc')::text AS recovered_property_desc,
      (r.data::jsonb->>'vehicle_no')::varchar AS vehicle_no,
      (r.data::jsonb->>'vehicle_type')::varchar AS vehicle_type,
      CASE WHEN (r.data::jsonb->>'cd_uploaded_24hrs') = 'true' THEN 'Yes'::yes_no_type ELSE 'No'::yes_no_type END AS cd_uploaded_24hrs,
      CASE WHEN (r.data::jsonb->>'footage_collected') = 'true' THEN 'Yes'::yes_no_type ELSE 'No'::yes_no_type END AS footage_collected,
      f.status_sk AS case_status_id,
      f.officer_name AS io_name,
      f.officer_pis AS io_pis_no,
      f.officer_mobile AS io_mobile_no,
      CASE WHEN f.cctns_flag = TRUE THEN 'Yes'::yes_no_type ELSE 'No'::yes_no_type END AS cctns_flag,
      CASE WHEN f.zero_fir_flag = TRUE THEN 'Yes'::yes_no_type ELSE 'No'::yes_no_type END AS zero_fir_flag,
      f.local_head,
      f.remarks,
      f.record_date AS diary_record_date,
      f.warehouse_loaded_at AS created_at,
      f.warehouse_updated_at AS updated_at
    FROM rpt.fact_fir f
    JOIN public.records r ON f.source_record_id = r.id;
  `);

  await knex.raw(`
    CREATE VIEW arrest_master AS
    SELECT
      a.source_record_id::varchar(36) AS record_uid,
      a.district_sk AS district_id,
      a.ps_sk AS ps_id,
      'Submitted'::varchar AS submission_status,
      f.source_record_id::varchar(36) AS linked_fir_record_uid,
      a.linked_fir_dd_no AS fir_dd_no,
      CASE WHEN (r.data::jsonb->>'is_dd_based') = 'true' THEN 'Yes'::yes_no_type ELSE 'No'::yes_no_type END AS is_dd_based,
      a.crime_head_sk AS crime_head_id,
      a.act_law_sk AS act_law_id,
      a.sections,
      CASE
        WHEN a.sections LIKE '%126%' OR a.sections LIKE '%170%' THEN 1
        WHEN a.sections LIKE '%Excise%' THEN 2
        WHEN a.sections LIKE '%DP Act%' THEN 3
        ELSE 1
      END AS section_category_id,
      a.arrested_name AS arrestee_name,
      (r.data::jsonb->>'arrested_parent_name')::varchar AS arrestee_parent_name,
      a.arrested_address AS arrestee_address,
      (r.data::jsonb->>'arrested_age')::integer AS arrestee_age,
      a.arrest_date AS date_of_arrest,
      COALESCE((r.data::jsonb->>'arrest_time'),'12:00:00')::time AS time_of_arrest,
      a.arrest_place AS place_of_arrest,
      a.officer_name AS io_name,
      (r.data::jsonb->>'io_mobile')::varchar AS io_mobile_no,
      (r.data::jsonb->>'io_rank')::varchar AS io_rank,
      a.status_sk AS arrest_status_id,
      COALESCE((r.data::jsonb->>'prev_involvement_count')::integer, 0) AS prev_involvement_count,
      CASE WHEN (r.data::jsonb->>'is_po') = 'true' THEN 'Yes'::yes_no_type ELSE 'No'::yes_no_type END AS is_po,
      (r.data::jsonb->>'po_declared_court')::varchar AS po_declared_court,
      (r.data::jsonb->>'po_case_reference')::varchar AS po_case_reference,
      (r.data::jsonb->>'seizure_desc')::text AS seizure_desc,
      CASE WHEN (r.data::jsonb->>'is_bc') = 'true' THEN 'Yes'::yes_no_type ELSE 'No'::yes_no_type END AS is_bc,
      CASE WHEN a.nafis_prepared = TRUE THEN 'Yes'::yes_no_type ELSE 'No'::yes_no_type END AS nafis_prepared,
      CASE WHEN a.dossier_prepared = TRUE THEN 'Yes'::yes_no_type ELSE 'No'::yes_no_type END AS dossier_prepared,
      CASE
        WHEN (r.data::jsonb->>'special_scheme') = 'INTEGRATED_PI' THEN 1
        WHEN (r.data::jsonb->>'special_scheme') = 'GROUP_PATROLLING' THEN 2
        WHEN (r.data::jsonb->>'special_scheme') = 'CYCLE_PATROLLING' THEN 3
        WHEN (r.data::jsonb->>'special_scheme') = 'ANTI_SNATCHING' THEN 4
        WHEN (r.data::jsonb->>'special_scheme') = 'PRAHARI' THEN 5
        WHEN (r.data::jsonb->>'special_scheme') = 'EYES_EARS' THEN 6
        ELSE NULL
      END AS special_scheme_id,
      (r.data::jsonb->>'arresting_officer_name')::varchar AS arresting_officer_name,
      (r.data::jsonb->>'arresting_officer_mobile')::varchar AS arresting_officer_mobile,
      (r.data::jsonb->>'beat_no')::varchar AS beat_no,
      a.custody_status,
      a.record_date AS diary_record_date,
      a.warehouse_loaded_at AS created_at,
      a.warehouse_updated_at AS updated_at
    FROM rpt.fact_arrest a
    JOIN public.records r ON a.source_record_id = r.id
    LEFT JOIN rpt.bridge_fir_arrest br ON br.arrest_sk = a.sk
    LEFT JOIN rpt.fact_fir f ON br.fir_sk = f.sk;
  `);

  await knex.raw(`
    CREATE VIEW pcr_kalandra_master AS
    SELECT
      p.source_record_id::varchar(36) AS record_uid,
      p.district_sk AS district_id,
      p.ps_sk AS ps_id,
      'Submitted'::varchar AS submission_status,
      p.gd_no AS gd_entry_number,
      p.gd_date AS gd_entry_date,
      COALESCE(p.gd_time,'12:00:00')::time AS gd_entry_time,
      p.call_head AS pcr_call_category,
      p.caller_name AS complainant_caller_name,
      (r.data::jsonb->>'caller_address')::varchar AS caller_address,
      p.call_gist AS pcr_dispatch_gist,
      p.officer_name AS responding_officer_name,
      p.officer_name AS enquiry_officer_name,
      (r.data::jsonb->>'action_taken')::text AS action_taken_report,
      p.call_status AS final_call_status,
      p.record_date AS diary_record_date,
      p.warehouse_loaded_at AS created_at,
      p.warehouse_updated_at AS updated_at
    FROM rpt.fact_pcr p
    JOIN public.records r ON p.source_record_id = r.id;
  `);

  await knex.raw(`
    CREATE VIEW missing_master AS
    SELECT
      m.source_record_id::varchar(36) AS record_uid,
      m.district_sk AS district_id,
      m.ps_sk AS ps_id,
      'Submitted'::varchar AS submission_status,
      CASE WHEN m.missing_status = 'Abandoned' OR (r.data::jsonb->>'abandoned') = 'true' THEN 2 ELSE 1 END AS category_id,
      m.dd_no AS dd_fir_ref_number,
      m.dd_date AS reference_entry_date,
      m.missing_name AS missing_person_name,
      (r.data::jsonb->>'missing_parent_name')::varchar AS missing_person_parent_name,
      m.age AS age_approx,
      CASE
        WHEN m.gender = 'Male' THEN 'Male'::gender_type
        WHEN m.gender = 'Female' THEN 'Female'::gender_type
        WHEN m.gender = 'Transgender' THEN 'Transgender'::gender_type
        ELSE 'Unknown'::gender_type
      END AS gender,
      (r.data::jsonb->>'last_seen_address')::varchar AS last_seen_address,
      (r.data::jsonb->>'found_place')::varchar AS found_recovery_address,
      m.missing_date AS date_missing,
      (r.data::jsonb->>'found_date')::date AS date_recovered,
      m.informant_name AS complainant_informant_name,
      m.informant_mobile AS informant_mobile,
      m.officer_name AS io_name,
      CASE WHEN (r.data::jsonb->>'source') = 'PCR' OR (r.data::jsonb->>'pcr_call') = 'true' THEN 'Yes'::yes_no_type ELSE 'No'::yes_no_type END AS pcr_call,
      (r.data::jsonb->>'height')::varchar AS height,
      (r.data::jsonb->>'built')::varchar AS built,
      (r.data::jsonb->>'complexion')::varchar AS complexion,
      (r.data::jsonb->>'face')::varchar AS face,
      (r.data::jsonb->>'hair')::varchar AS hair,
      (r.data::jsonb->>'beard')::varchar AS beard,
      (r.data::jsonb->>'mustaches')::varchar AS mustaches,
      (r.data::jsonb->>'upper_dress_color')::varchar AS upper_dress_color,
      (r.data::jsonb->>'lower_dress_color')::varchar AS lower_dress_color,
      m.missing_status AS current_status,
      CASE WHEN (r.data::jsonb->>'case_registered') = 'true' THEN 'Yes'::yes_no_type ELSE 'No'::yes_no_type END AS case_registered,
      (r.data::jsonb->>'remarks')::text AS remarks,
      m.record_date AS diary_record_date,
      m.warehouse_loaded_at AS created_at,
      m.warehouse_updated_at AS updated_at
    FROM rpt.fact_missing m
    JOIN public.records r ON m.source_record_id = r.id;
  `);

  await knex.raw(`
    CREATE VIEW uidb_master AS
    SELECT
      u.source_record_id::varchar(36) AS record_uid,
      u.district_sk AS district_id,
      u.ps_sk AS ps_id,
      'Submitted'::varchar AS submission_status,
      (r.data::jsonb->>'uidb_gazette_number')::varchar AS uidb_gazette_number,
      u.dd_no AS dd_number,
      COALESCE((r.data::jsonb->>'dd_date')::date, u.found_date) AS dd_date,
      (r.data::jsonb->>'inquest_sections')::varchar AS inquest_sections,
      (r.data::jsonb->>'name_of_deceased')::varchar AS name_of_deceased,
      (r.data::jsonb->>'deceased_parent_name')::varchar AS deceased_parent_name,
      (r.data::jsonb->>'address_of_deceased')::varchar AS address_of_deceased,
      u.found_place,
      u.found_date AS discovery_date,
      (r.data::jsonb->>'duty_officer')::varchar AS duty_officer,
      u.officer_name AS io_name,
      (r.data::jsonb->>'io_mobile')::varchar AS io_mobile_no,
      u.informant_name,
      (r.data::jsonb->>'informant_mobile')::varchar AS informant_mobile,
      CASE
        WHEN u.gender = 'Male' THEN 'Male'::gender_type
        WHEN u.gender = 'Female' THEN 'Female'::gender_type
        WHEN u.gender = 'Transgender' THEN 'Transgender'::gender_type
        ELSE 'Unknown'::gender_type
      END AS gender,
      u.approx_age_num AS estimated_age,
      (r.data::jsonb->>'height')::varchar AS height,
      (r.data::jsonb->>'built')::varchar AS built,
      (r.data::jsonb->>'complexion')::varchar AS complexion,
      (r.data::jsonb->>'face')::varchar AS face,
      (r.data::jsonb->>'hair')::varchar AS hair,
      (r.data::jsonb->>'beard')::varchar AS beard,
      (r.data::jsonb->>'mustaches')::varchar AS mustaches,
      (r.data::jsonb->>'upper_dress_color')::varchar AS upper_dress_color,
      (r.data::jsonb->>'lower_dress_color')::varchar AS lower_dress_color,
      (r.data::jsonb->>'identification_marks')::text AS identification_marks,
      u.zipnet_no,
      CASE WHEN u.identified = TRUE THEN 'Yes'::yes_no_type ELSE 'No'::yes_no_type END AS body_identified,
      (r.data::jsonb->>'cause_of_death')::varchar AS cause_of_death,
      CASE WHEN (r.data::jsonb->>'filed_by_acp_sdm') = 'true' THEN 'Yes'::yes_no_type ELSE 'No'::yes_no_type END AS filed_by_acp_sdm,
      (r.data::jsonb->>'date_filed_acp_sdm')::date AS date_filed_acp_sdm,
      (r.data::jsonb->>'current_status_mortuary_remarks')::text AS current_status_mortuary_remarks,
      u.record_date AS diary_record_date,
      u.warehouse_loaded_at AS created_at,
      u.warehouse_updated_at AS updated_at
    FROM rpt.fact_uidb u
    JOIN public.records r ON u.source_record_id = r.id;
  `);

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. REPORT VIEWS  (rpt_NN_*)
  // Column names must exactly match the parallel service's colMapping accessors.
  // All views expose ps_id, district_id (integers), diary_record_date for scope filtering.
  // ═══════════════════════════════════════════════════════════════════════════

  // rpt_01_manual_fir — raw FIR rows (Manual FIR sheet uses custom populator, this is for completeness)
  await knex.raw(`
    CREATE VIEW rpt_01_manual_fir AS
    SELECT
      ROW_NUMBER() OVER (PARTITION BY f.diary_record_date, f.ps_id ORDER BY f.fir_number) AS "S.N.",
      ps.ps_name AS "P.S.",
      f.fir_number AS "FIR NO.",
      f.sections AS "U/S",
      f.complainant_name AS "NAME OF COMPLAINANT",
      f.complainant_parent_name AS "FATHER/ HUSBAND NAME OF COMPLAINANT",
      f.complainant_address AS "ADDRESS OF COMPLAINANT",
      f.date_of_occurrence,
      f.time_of_occurrence::text AS "TIME OF OCCURRENCE",
      f.place_of_occurrence AS "PLACE OF OCCURRENCE",
      f.brief_facts AS "GIST",
      f.io_name AS "IO NAME",
      f.ps_id,
      f.district_id,
      f.diary_record_date
    FROM fir_master f
    JOIN ref_police_station ps ON ps.ps_id = f.ps_id
    WHERE f.case_reg_type_id = 1;
  `);

  // rpt_02_e_burglary_cases — E-FIR Burglary
  await knex.raw(`
    CREATE VIEW rpt_02_e_burglary_cases AS
    SELECT
      ROW_NUMBER() OVER (PARTITION BY f.diary_record_date, f.ps_id ORDER BY f.fir_number) AS "SR. NO.",
      ps.ps_name AS "P.S.",
      f.fir_number AS "E-FIR NO.",
      f.sections AS "U/S",
      f.complainant_name AS "NAME OF COMPLAINANT",
      f.complainant_parent_name AS "FATHER/ HUSBAND NAME OF COMPLAINANT",
      f.complainant_address AS "ADDRESS OF COMPLAINANT",
      f.date_of_occurrence,
      f.time_of_occurrence::text AS "TIME OF OCCURRENCE",
      f.stolen_property_desc AS "STOLEN ITEMS",
      f.place_of_occurrence AS "PLACE OF OCCURRENCE",
      f.io_name AS "IO NAME",
      f.io_mobile_no AS "IO MOBILE NO.",
      f.beat_no AS "BEAT NO.",
      f.ps_id,
      f.district_id,
      f.diary_record_date
    FROM fir_master f
    JOIN ref_police_station ps ON ps.ps_id = f.ps_id
    JOIN ref_crime_head ch ON ch.crime_head_id = f.crime_head_id
    WHERE ch.theft_category = 'BURGLARY';
  `);

  // rpt_03_e_house_theft_cases
  await knex.raw(`
    CREATE VIEW rpt_03_e_house_theft_cases AS
    SELECT
      ROW_NUMBER() OVER (PARTITION BY f.diary_record_date, f.ps_id ORDER BY f.fir_number) AS "SR. NO.",
      ps.ps_name AS "P.S.",
      f.fir_number AS "E-FIR NO.",
      f.sections AS "U/S",
      f.complainant_name AS "NAME OF COMPLAINANT",
      f.complainant_parent_name AS "FATHER/ HUSBAND NAME OF COMPLAINANT",
      f.complainant_address AS "ADDRESS OF COMPLAINANT",
      f.date_of_occurrence,
      f.time_of_occurrence::text AS "TIME OF OCCURRENCE",
      f.stolen_property_desc AS "STOLEN ITEMS",
      f.place_of_occurrence AS "PLACE OF OCCURRENCE",
      f.io_name AS "IO NAME",
      f.io_mobile_no AS "IO MOBILE NO.",
      f.beat_no AS "BEAT NO.",
      f.ps_id,
      f.district_id,
      f.diary_record_date
    FROM fir_master f
    JOIN ref_police_station ps ON ps.ps_id = f.ps_id
    JOIN ref_crime_head ch ON ch.crime_head_id = f.crime_head_id
    WHERE ch.theft_category = 'HOUSE_THEFT';
  `);

  // rpt_04_e_other_theft_cases
  await knex.raw(`
    CREATE VIEW rpt_04_e_other_theft_cases AS
    SELECT
      ROW_NUMBER() OVER (PARTITION BY f.diary_record_date, f.ps_id ORDER BY f.fir_number) AS "SR. NO.",
      ps.ps_name AS "P.S.",
      f.fir_number AS "E-FIR NO.",
      f.sections AS "U/S",
      f.complainant_name AS "NAME OF COMPLAINANT",
      f.complainant_parent_name AS "FATHER/ HUSBAND NAME OF COMPLAINANT",
      f.complainant_address AS "ADDRESS OF COMPLAINANT",
      f.date_of_occurrence,
      f.time_of_occurrence::text AS "TIME OF OCCURRENCE",
      f.stolen_property_desc AS "STOLEN ITEMS",
      f.place_of_occurrence AS "PLACE OF OCCURRENCE",
      f.io_name AS "IO NAME",
      f.io_mobile_no AS "IO MOBILE NO.",
      f.beat_no AS "BEAT NO.",
      f.ps_id,
      f.district_id,
      f.diary_record_date
    FROM fir_master f
    JOIN ref_police_station ps ON ps.ps_id = f.ps_id
    JOIN ref_crime_head ch ON ch.crime_head_id = f.crime_head_id
    WHERE ch.theft_category = 'OTHER_THEFT';
  `);

  // rpt_05_mvt_cases — Motor Vehicle Theft
  await knex.raw(`
    CREATE VIEW rpt_05_mvt_cases AS
    SELECT
      ROW_NUMBER() OVER (PARTITION BY f.diary_record_date, f.ps_id ORDER BY f.fir_number) AS "SR.",
      ps.ps_name AS "P.S.",
      f.fir_number AS "FIR NO.",
      f.sections AS "U/S",
      f.complainant_name AS "NAME OF COMPLAINANT",
      f.complainant_parent_name AS "FATHER/ HUSBAND NAME OF COMPLAINANT",
      f.complainant_address AS "ADDRESS OF COMPLAINANT",
      f.date_of_occurrence AS "DATE OF OCCURRENCE",
      f.time_of_occurrence::text AS "TIME OF OCCURRENCE",
      f.vehicle_no AS "VEHICLE NO.",
      f.vehicle_type AS "VEHICLE TYPE",
      f.place_of_occurrence AS "PLACE OF OCCURRENCE",
      f.io_name AS "IO NAME",
      f.io_mobile_no AS "IO MOBILE NO.",
      f.beat_no AS "BEAT NO.",
      f.ps_id,
      f.district_id,
      f.diary_record_date
    FROM fir_master f
    JOIN ref_police_station ps ON ps.ps_id = f.ps_id
    JOIN ref_crime_head ch ON ch.crime_head_id = f.crime_head_id
    WHERE ch.theft_category = 'MVT';
  `);

  // rpt_07_arrested_east_district — arrests from East District only
  await knex.raw(`
    CREATE VIEW rpt_07_arrested_east_district AS
    SELECT
      ROW_NUMBER() OVER (PARTITION BY a.diary_record_date ORDER BY a.fir_dd_no, a.arrestee_name) AS "S.N.",
      a.fir_dd_no AS "FIR NO.",
      a.sections AS "U/S",
      a.arrestee_name AS "NAME ",
      a.arrestee_parent_name AS "FATHER/ HUSBAND NAME ",
      a.arrestee_address AS "ADDRESS ",
      a.arrestee_age AS "AGE",
      a.io_name AS "NAME OF IO",
      a.custody_status AS "PC/JC/BAIL",
      a.prev_involvement_count AS "PREV. INVOLVEMENT (NO. OF CASES)",
      a.seizure_desc AS "RECOVERY",
      a.is_bc AS "WHETHER ACCUSED IS BC OR NOT",
      CASE WHEN a.special_scheme_id = 1 THEN 'Yes' ELSE 'No' END AS "INTEGRATED PI",
      CASE WHEN a.special_scheme_id = 2 THEN 'Yes' ELSE 'No' END AS "GROUP PATROLLING",
      CASE WHEN a.special_scheme_id = 3 THEN 'Yes' ELSE 'No' END AS "CYCLE PATROLLING",
      CASE WHEN a.special_scheme_id = 4 THEN 'Yes' ELSE 'No' END AS "BY ANTI-SNATCHING TEAM",
      CASE WHEN a.special_scheme_id = 5 THEN 'Yes' ELSE 'No' END AS "BY PRAHARI",
      CASE WHEN a.special_scheme_id = 6 THEN 'Yes' ELSE 'No' END AS "BY EYES & EARS SCHEME MEMBERS",
      a.ps_id,
      a.district_id,
      a.diary_record_date
    FROM arrest_master a
    JOIN ref_police_station ps ON ps.ps_id = a.ps_id
    JOIN ref_district d ON d.district_id = ps.district_id;
  `);

  // rpt_08_arrested_kalandara — preventive section arrests (BNSS 126/170)
  await knex.raw(`
    CREATE VIEW rpt_08_arrested_kalandara AS
    SELECT
      ROW_NUMBER() OVER (PARTITION BY a.diary_record_date, a.ps_id ORDER BY a.fir_dd_no) AS "S.N.",
      a.fir_dd_no AS "FIR/DD NO.",
      a.sections AS "Under section (U/S)",
      a.arrestee_name AS "NAME ",
      a.arrestee_parent_name AS "FATHER/ HUSBAND NAME ",
      a.arrestee_address AS "ADDRESS ",
      a.arrestee_age AS "AGE",
      a.place_of_arrest AS "PLACE OF OCCURRENCE",
      a.io_name AS "IO",
      a.custody_status AS "BAIL",
      a.prev_involvement_count AS "PREV. INVOLVEMENT",
      a.seizure_desc AS "RECOVERY",
      a.is_bc AS "WHETHER ACCUSED IS BC OR NOT",
      CASE WHEN a.special_scheme_id = 1 THEN 'Yes' ELSE 'No' END AS "INTEGRATED PICK",
      CASE WHEN a.special_scheme_id = 2 THEN 'Yes' ELSE 'No' END AS "GROUP PATROLLING",
      CASE WHEN a.special_scheme_id = 3 THEN 'Yes' ELSE 'No' END AS "CYCLE PATROLLING",
      CASE WHEN a.special_scheme_id = 4 THEN 'Yes' ELSE 'No' END AS "BY ANTI-SNATCHING TEAM",
      CASE WHEN a.special_scheme_id = 5 THEN 'Yes' ELSE 'No' END AS "BY PRAHARI",
      CASE WHEN a.special_scheme_id = 6 THEN 'Yes' ELSE 'No' END AS "BY EYES & EARS SCHEME MEMBERS",
      a.ps_id,
      a.district_id,
      a.diary_record_date
    FROM arrest_master a
    WHERE a.section_category_id = 1;
  `);

  // rpt_09_arrested_efir_theft — arrests linked to E-FIR theft cases
  await knex.raw(`
    CREATE VIEW rpt_09_arrested_efir_theft AS
    SELECT
      ROW_NUMBER() OVER (PARTITION BY a.diary_record_date, a.ps_id ORDER BY a.fir_dd_no) AS "S.N.",
      COALESCE(a.fir_dd_no, fm.fir_number) AS "FIR/DD NO.",
      a.sections AS "U/S",
      a.arrestee_name AS "NAME ",
      a.arrestee_parent_name AS "FATHER/ HUSBAND NAME ",
      a.arrestee_address AS "ADDRESS ",
      a.arrestee_age AS "AGE",
      a.io_name AS "NAME OF IO",
      a.custody_status AS "PC/JC/BAIL",
      a.prev_involvement_count AS "PREV. INVOLVEMENT (NO. OF CASES) HEAD",
      a.seizure_desc AS "RECOVERY",
      a.is_bc AS "WHETHER ACCUSED IS BC OR NOT",
      CASE WHEN a.special_scheme_id = 2 THEN 'Yes' ELSE 'No' END AS "GROUP ROLLING",
      CASE WHEN a.special_scheme_id = 3 THEN 'Yes' ELSE 'No' END AS "CYCLE PATROLLING",
      CASE WHEN a.special_scheme_id = 4 THEN 'Yes' ELSE 'No' END AS "BY ANTI-SNATCHING TEAM",
      CASE WHEN a.special_scheme_id = 5 THEN 'Yes' ELSE 'No' END AS "BY PRAHARI",
      CASE WHEN a.special_scheme_id = 6 THEN 'Yes' ELSE 'No' END AS "BY EYES & EARS SCHEME MEMBERS",
      a.ps_id,
      a.district_id,
      a.diary_record_date
    FROM arrest_master a
    LEFT JOIN fir_master fm ON fm.record_uid = a.linked_fir_record_uid
    WHERE fm.case_reg_type_id = 2;
  `);

  // rpt_10_arrested_efir_mv_theft — arrests linked to E-FIR MVT cases
  await knex.raw(`
    CREATE VIEW rpt_10_arrested_efir_mv_theft AS
    SELECT
      COALESCE(a.fir_dd_no, fm.fir_number) AS "FIR NO.",
      a.sections AS "U/S",
      a.arrestee_name AS "NAME ",
      a.arrestee_parent_name AS "FATHER/ HUSBAND NAME ",
      a.arrestee_address AS "ADDRESS ",
      a.arrestee_age AS "AGE",
      a.io_name AS "NAME OF IO",
      a.custody_status AS "PC/JC/BAIL",
      a.prev_involvement_count AS "PREV. INVOLVEMENT",
      a.seizure_desc AS "RECOVERY",
      a.is_bc AS "WHETHER ACCUSED IS BC OR NOT",
      CASE WHEN a.special_scheme_id = 2 THEN 'Yes' ELSE 'No' END AS "GROUP PATROLLING",
      CASE WHEN a.special_scheme_id = 3 THEN 'Yes' ELSE 'No' END AS "CYCLE PATROLLING",
      CASE WHEN a.special_scheme_id = 4 THEN 'Yes' ELSE 'No' END AS "BY ANTI-SNATCHING TEAM",
      CASE WHEN a.special_scheme_id = 5 THEN 'Yes' ELSE 'No' END AS "BY PRAHARI",
      CASE WHEN a.special_scheme_id = 6 THEN 'Yes' ELSE 'No' END AS "BY EYES & EARS SCHEME MEMBERS",
      a.ps_id,
      a.district_id,
      a.diary_record_date
    FROM arrest_master a
    LEFT JOIN fir_master fm ON fm.record_uid = a.linked_fir_record_uid
    WHERE fm.case_reg_type_id = 3;
  `);

  // rpt_11_proclaimed_offenders
  await knex.raw(`
    CREATE VIEW rpt_11_proclaimed_offenders AS
    SELECT
      ROW_NUMBER() OVER (PARTITION BY a.diary_record_date, a.ps_id ORDER BY a.arrestee_name) AS "S.N.",
      ps.ps_name AS "P.S.",
      a.fir_dd_no AS "DD NO./FIR NO.",
      a.sections AS "U/S",
      a.arrestee_name AS "DETAILS OF PO – NAME",
      a.arrestee_parent_name AS "DETAILS OF PO – PARENTAL",
      a.arrestee_address AS "DETAILS OF PO –  ADDRESS",
      a.po_case_reference AS "CASE IN WHICH DECLARED PO",
      a.po_declared_court AS "NAME OF COURT WHICH DECLARED PO",
      a.ps_id,
      a.district_id,
      a.diary_record_date
    FROM arrest_master a
    JOIN ref_police_station ps ON ps.ps_id = a.ps_id
    WHERE a.is_po = 'Yes';
  `);

  // rpt_13_arrested_24hrs_list — all arrests for the date (24-hour list)
  await knex.raw(`
    CREATE VIEW rpt_13_arrested_24hrs_list AS
    SELECT
      ROW_NUMBER() OVER (PARTITION BY a.diary_record_date, a.ps_id ORDER BY a.date_of_arrest, a.arrestee_name) AS "S. NO.",
      a.arrestee_name AS "NAME / NICK NAME",
      a.arrestee_parent_name AS "FATHER NAME/HUSBAND NAME",
      a.arrestee_address AS "ADDRESS",
      a.arrestee_age AS "AGE",
      a.fir_dd_no AS "FIR/DD NO.",
      a.date_of_arrest,
      a.sections AS "U/S",
      ps.ps_name AS "POLICE STATION",
      a.io_name AS "NAME OF IO",
      a.io_rank AS "RANK OF IO",
      a.io_mobile_no AS "MOBILE NO. OF IO",
      a.custody_status AS "REMARKS (PC REMAND / FORMAL ARREST / BAIL ETC.)",
      a.ps_id,
      a.district_id,
      a.diary_record_date
    FROM arrest_master a
    JOIN ref_police_station ps ON ps.ps_id = a.ps_id;
  `);

  // rpt_18_missing_persons
  await knex.raw(`
    CREATE VIEW rpt_18_missing_persons AS
    SELECT
      ROW_NUMBER() OVER (PARTITION BY m.diary_record_date, m.ps_id ORDER BY m.reference_entry_date) AS "S.NO.",
      m.dd_fir_ref_number AS "DD NO.",
      m.reference_entry_date AS "DD DATE",
      m.complainant_informant_name AS "NAME OF OPERATOR TO WHOM MPS",
      m.missing_person_name AS "NAME OF MISSING PERSON",
      m.last_seen_address AS "ADDRESS OF MISSING PERSON",
      m.date_missing AS "MISSING DATE",
      m.age_approx AS "AGE",
      m.height AS "HEIGHT",
      m.built AS "BUILT",
      m.complexion AS "COMPLEXION",
      m.face AS "FACE",
      m.hair AS "HAIR",
      m.beard AS "BEARD",
      m.mustaches AS "MUSTACHES",
      m.upper_dress_color AS "UPPER DRESS COLOR",
      m.lower_dress_color AS "LOWER DRESS COLOR",
      m.io_name AS "NAME OF I.O.",
      m.ps_id,
      m.district_id,
      m.diary_record_date
    FROM missing_master m
    WHERE m.category_id = 1;
  `);

  // rpt_19_uidb
  await knex.raw(`
    CREATE VIEW rpt_19_uidb AS
    SELECT
      ROW_NUMBER() OVER (PARTITION BY u.diary_record_date, u.ps_id ORDER BY u.discovery_date) AS "S.NO.",
      u.dd_number AS "DD NO.",
      u.dd_date AS "DD DATE",
      u.found_place AS "FOUND PLACE",
      u.discovery_date AS "FOUND DATE",
      u.gender AS "SEX",
      u.estimated_age AS "AGE",
      u.height AS "HEIGHT",
      u.built AS "BUILT",
      u.complexion AS "COMPLEXION",
      u.face AS "FACE",
      u.hair AS "HAIR",
      u.beard AS "BEARD",
      u.mustaches AS "MUSTACHES",
      u.upper_dress_color AS "UPPER DRESS COLOR",
      u.lower_dress_color AS "LOWER DRESS COLOR",
      u.io_name AS "NAME OF I.O.",
      u.ps_id,
      u.district_id,
      u.diary_record_date
    FROM uidb_master u;
  `);

  // rpt_20_abandoned_persons
  await knex.raw(`
    CREATE VIEW rpt_20_abandoned_persons AS
    SELECT
      ROW_NUMBER() OVER (PARTITION BY m.diary_record_date, m.ps_id ORDER BY m.reference_entry_date) AS "S.NO.",
      m.dd_fir_ref_number AS "DD NO.",
      m.reference_entry_date,
      m.found_recovery_address AS "FOUND PLACE",
      m.date_recovered AS "FOUND DATE",
      m.gender AS "SEX",
      m.age_approx AS "AGE",
      m.height AS "HEIGHT",
      m.built AS "BUILT",
      m.complexion AS "COMPLEXION",
      m.face AS "FACE",
      m.hair AS "HAIR",
      m.beard AS "BEARD",
      m.mustaches AS "MUSTACHES",
      m.upper_dress_color AS "UPPER DRESS COLOR",
      m.lower_dress_color AS "LOWER DRESS COLOR",
      m.io_name AS "NAME OF I.O.",
      m.ps_id,
      m.district_id,
      m.diary_record_date
    FROM missing_master m
    WHERE m.category_id = 2;
  `);

  // rpt_21_traced_persons
  await knex.raw(`
    CREATE VIEW rpt_21_traced_persons AS
    SELECT
      ROW_NUMBER() OVER (PARTITION BY m.diary_record_date, m.ps_id ORDER BY m.date_recovered) AS "S.NO.",
      m.dd_fir_ref_number AS "DD NO.",
      m.reference_entry_date AS "DD DATE",
      m.complainant_informant_name AS "NAME OF OPERATOR TO WHOM MPS",
      m.missing_person_name AS "NAME OF TRACED PERSON",
      m.missing_person_parent_name AS "FATHER/HUSBAND NAME OF TRACED PERSON",
      m.last_seen_address AS "ADDRESS OF TRACED PERSON",
      m.io_name AS "NAME OF I.O.",
      m.ps_id,
      m.district_id,
      m.diary_record_date
    FROM missing_master m
    WHERE m.current_status = 'Traced';
  `);

  // rpt_25_inquest_registered (UIDB = inquest)
  await knex.raw(`
    CREATE VIEW rpt_25_inquest_registered AS
    SELECT
      ROW_NUMBER() OVER (PARTITION BY u.diary_record_date, u.ps_id ORDER BY u.discovery_date) AS "S.N.",
      u.dd_number AS "DD NO.",
      u.dd_date AS "DATE",
      u.inquest_sections AS "U/S",
      u.name_of_deceased AS "NAME OF DECEASED",
      u.deceased_parent_name AS "FATHER/HUSBAND NAME OF DECEASED",
      u.address_of_deceased AS "ADDRESS OF DECEASED",
      u.gender AS "SEX",
      u.estimated_age AS "AGE",
      u.cause_of_death AS "CAUSE OF DEATH",
      u.found_place AS "PLACE OF OCCURRENCE",
      u.io_name AS "IO",
      u.ps_id,
      u.district_id,
      u.diary_record_date
    FROM uidb_master u;
  `);

  // rpt_26_inquest_acp_sdm_disposal
  await knex.raw(`
    CREATE VIEW rpt_26_inquest_acp_sdm_disposal AS
    SELECT
      ROW_NUMBER() OVER (PARTITION BY u.diary_record_date, u.ps_id ORDER BY u.date_filed_acp_sdm) AS "S.NO.",
      u.dd_number AS "DD NO.",
      u.dd_date AS "DATE",
      u.inquest_sections AS "U/S",
      u.name_of_deceased AS "NAME OF DECEASED",
      u.deceased_parent_name AS "FATHER/HUSBAND NAME OF DECEASED",
      u.address_of_deceased AS "ADDRESS OF DECEASED",
      u.gender AS "SEX",
      u.estimated_age AS "AGE",
      u.cause_of_death AS "CAUSE OF DEATH",
      u.date_filed_acp_sdm AS "DATE OF FILED BY ACP/SDM",
      u.ps_id,
      u.district_id,
      u.diary_record_date
    FROM uidb_master u
    WHERE u.filed_by_acp_sdm = 'Yes';
  `);

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. AGGREGATE FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  // rpt_06_arrested_all_heads_fn(date) — one row per PS with section-category counts
  // "BNS/IPC" column = ps_name (the sheet uses PS names as row labels)
  await knex.raw(`
    CREATE OR REPLACE FUNCTION rpt_06_arrested_all_heads_fn(p_date date)
    RETURNS TABLE (
      "BNS/IPC" text,
      "TOTAL NO DD – 126/170 BNSS" bigint,
      "TOTAL NO DD – 126/169 BNSS" bigint,
      "TOTAL NO DD – 109 BNSS" bigint,
      "109 G" bigint,
      "TOTAL L NO DD – 110 BNSS" bigint,
      "110 G" bigint,
      "92/93/97 DP ACT" bigint,
      "TOTAL NO DD – 40 EX." bigint,
      "40 EX." bigint,
      "35.1D" bigint,
      "A.ACT" bigint,
      "G.ACT" bigint,
      "33 EX." bigint,
      "NDPS" bigint,
      "OTHERS ACT" bigint,
      "OTHERS BNSS" bigint,
      "PO" bigint
    )
    LANGUAGE sql STABLE AS $$
      SELECT
        ps.ps_name::text AS "BNS/IPC",
        COUNT(*) FILTER (WHERE a.sections LIKE '%126/170%') AS "TOTAL NO DD – 126/170 BNSS",
        COUNT(*) FILTER (WHERE a.sections LIKE '%126/169%') AS "TOTAL NO DD – 126/169 BNSS",
        COUNT(*) FILTER (WHERE a.sections LIKE '%109%' AND a.sections NOT LIKE '%126/169%') AS "TOTAL NO DD – 109 BNSS",
        COUNT(*) FILTER (WHERE a.sections LIKE '%109 G%') AS "109 G",
        COUNT(*) FILTER (WHERE a.sections LIKE '%110%') AS "TOTAL L NO DD – 110 BNSS",
        COUNT(*) FILTER (WHERE a.sections LIKE '%110 G%') AS "110 G",
        COUNT(*) FILTER (WHERE a.sections LIKE '%92%' OR a.sections LIKE '%93%' OR a.sections LIKE '%97 DP%') AS "92/93/97 DP ACT",
        COUNT(*) FILTER (WHERE a.sections LIKE '%40 EX%' OR a.sections LIKE '%40EX%') AS "TOTAL NO DD – 40 EX.",
        COUNT(*) FILTER (WHERE a.sections LIKE '%40 EX%' OR a.sections LIKE '%40EX%') AS "40 EX.",
        COUNT(*) FILTER (WHERE a.sections LIKE '%35.1D%') AS "35.1D",
        COUNT(*) FILTER (WHERE a.sections LIKE '%Arms Act%' OR a.sections LIKE '%A.Act%') AS "A.ACT",
        COUNT(*) FILTER (WHERE a.sections LIKE '%Gambling%' OR a.sections LIKE '%G.Act%') AS "G.ACT",
        COUNT(*) FILTER (WHERE a.sections LIKE '%33 EX%') AS "33 EX.",
        COUNT(*) FILTER (WHERE a.sections LIKE '%NDPS%') AS "NDPS",
        COUNT(*) FILTER (WHERE a.sections NOT LIKE '%126%' AND a.sections NOT LIKE '%109%' AND a.sections NOT LIKE '%110%'
          AND a.sections NOT LIKE '%92%' AND a.sections NOT LIKE '%40 EX%' AND a.sections NOT LIKE '%NDPS%'
          AND a.sections NOT LIKE '%Arms%' AND a.sections NOT LIKE '%Gambling%' AND a.sections NOT LIKE '%33 EX%'
          AND a.section_category_id IS NOT NULL) AS "OTHERS ACT",
        COUNT(*) FILTER (WHERE a.section_category_id IS NULL) AS "OTHERS BNSS",
        COUNT(*) FILTER (WHERE a.is_po = 'Yes') AS "PO"
      FROM arrest_master a
      JOIN ref_police_station ps ON ps.ps_id = a.ps_id
      WHERE a.diary_record_date = p_date
      GROUP BY ps.ps_name
      ORDER BY ps.ps_name;
    $$;
  `);

  // rpt_28_fir_goswara_summary_fn(date) — FIR count by category per district
  await knex.raw(`
    CREATE OR REPLACE FUNCTION rpt_28_fir_goswara_summary_fn(p_date date)
    RETURNS TABLE (
      "DISTRICT" text,
      "MANUAL FIR" bigint,
      "Theft (E-FIR)" bigint,
      "House Theft (E-FIR)" bigint,
      "Burglary (E-FIR)" bigint,
      "MVT" bigint,
      "TOTAL" bigint
    )
    LANGUAGE sql STABLE AS $$
      SELECT
        d.district_name::text AS "DISTRICT",
        COUNT(*) FILTER (WHERE f.case_reg_type_id = 1) AS "MANUAL FIR",
        COUNT(*) FILTER (WHERE ch.theft_category = 'OTHER_THEFT') AS "Theft (E-FIR)",
        COUNT(*) FILTER (WHERE ch.theft_category = 'HOUSE_THEFT') AS "House Theft (E-FIR)",
        COUNT(*) FILTER (WHERE ch.theft_category = 'BURGLARY') AS "Burglary (E-FIR)",
        COUNT(*) FILTER (WHERE ch.theft_category = 'MVT') AS "MVT",
        COUNT(*) AS "TOTAL"
      FROM fir_master f
      JOIN ref_police_station ps ON ps.ps_id = f.ps_id
      JOIN ref_district d ON d.district_id = ps.district_id
      LEFT JOIN ref_crime_head ch ON ch.crime_head_id = f.crime_head_id
      WHERE f.diary_record_date = p_date
      GROUP BY d.district_name
      ORDER BY d.district_name;
    $$;
  `);
}

export async function down(knex) {
  if (knex.client.config.client === 'sqlite3') return;

  await knex.raw(`DROP FUNCTION IF EXISTS rpt_28_fir_goswara_summary_fn(date) CASCADE`);
  await knex.raw(`DROP FUNCTION IF EXISTS rpt_06_arrested_all_heads_fn(date) CASCADE`);

  const views = [
    'rpt_26_inquest_acp_sdm_disposal', 'rpt_25_inquest_registered',
    'rpt_21_traced_persons', 'rpt_20_abandoned_persons', 'rpt_19_uidb',
    'rpt_18_missing_persons', 'rpt_13_arrested_24hrs_list', 'rpt_11_proclaimed_offenders',
    'rpt_10_arrested_efir_mv_theft', 'rpt_09_arrested_efir_theft',
    'rpt_08_arrested_kalandara', 'rpt_07_arrested_east_district',
    'rpt_05_mvt_cases', 'rpt_04_e_other_theft_cases', 'rpt_03_e_house_theft_cases',
    'rpt_02_e_burglary_cases', 'rpt_01_manual_fir',
    'uidb_master', 'missing_master', 'pcr_kalandra_master', 'arrest_master', 'fir_master',
    'ref_missing_category', 'ref_arrest_section_category', 'ref_special_scheme',
    'ref_arrest_status', 'ref_case_status', 'ref_act_law', 'ref_crime_head',
    'ref_case_reg_type', 'ref_police_station', 'ref_district',
  ];
  for (const v of views) {
    await knex.raw(`DROP VIEW IF EXISTS ?? CASCADE`, [v]);
  }
}
