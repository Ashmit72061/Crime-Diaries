import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function up(knex) {
  // Only apply on PostgreSQL
  if (knex.client.config.client === 'sqlite3') {
    return;
  }

  // Create ENUM types if they don't exist
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE gender_type AS ENUM ('Male','Female','Transgender','Unknown');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE yes_no_type AS ENUM ('Yes','No');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // Drop conflicting views if any
  await knex.raw(`DROP VIEW IF EXISTS ref_police_station CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS ref_district CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS ref_crime_head CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS ref_case_reg_type CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS ref_act_law CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS ref_case_status CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS ref_arrest_status CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS ref_special_scheme CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS ref_arrest_section_category CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS ref_missing_category CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS fir_master CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS arrest_master CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS pcr_kalandra_master CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS missing_master CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS uidb_master CASCADE;`);

  // Create Reference Views
  await knex.raw(`
    CREATE OR REPLACE VIEW ref_district AS
    SELECT sk AS district_id, name_en::varchar(100) AS district_name
    FROM rpt.dim_district;
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW ref_police_station AS
    SELECT sk AS ps_id, district_sk AS district_id, name_en::varchar(150) AS ps_name
    FROM rpt.dim_police_station;
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW ref_case_reg_type AS
    SELECT 1 AS case_reg_type_id, 'MANUAL_FIR'::varchar(30) AS code, 'Manual FIR'::varchar(100) AS label
    UNION ALL
    SELECT 2 AS case_reg_type_id, 'E_THEFT'::varchar(30) AS code, 'E-FIR Theft'::varchar(100) AS label
    UNION ALL
    SELECT 3 AS case_reg_type_id, 'E_MVT'::varchar(30) AS code, 'E-FIR MVT'::varchar(100) AS label;
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW ref_crime_head AS
    SELECT
        sk AS crime_head_id,
        value_normalized::varchar(50) AS crime_head_code,
        value_raw::varchar(150) AS crime_head_name,
        CASE 
            WHEN value_raw IN ('Burglary', 'Night Burglary', 'Day Burglary') THEN 'BURGLARY'
            WHEN value_raw IN ('House Theft') THEN 'HOUSE_THEFT'
            WHEN value_raw IN ('Other Theft', 'Theft In Shop', 'Servant Theft', 'Stereo Theft', 'Cattle Theft', 'M.V. Accessories Theft') THEN 'OTHER_THEFT'
            WHEN value_raw IN ('M.V. Theft') THEN 'MVT'
            ELSE NULL
        END::varchar(20) AS theft_category
    FROM rpt.dim_crime_head;
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW ref_act_law AS
    SELECT sk AS act_law_id, value_normalized::varchar(50) AS act_code, value_raw::varchar(150) AS act_name
    FROM rpt.dim_act_law;
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW ref_case_status AS
    SELECT
        sk AS case_status_id,
        value_normalized::varchar(40) AS code,
        value_raw::varchar(100) AS label,
        CASE WHEN value_raw IN ('Closed', 'Chargesheeted') THEN TRUE ELSE FALSE END AS is_disposed
    FROM rpt.dim_case_status
    WHERE record_type = 'CASE';
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW ref_arrest_status AS
    SELECT
        sk AS arrest_status_id,
        value_normalized::varchar(30) AS code,
        value_raw::varchar(80) AS label
    FROM rpt.dim_case_status
    WHERE record_type = 'ARREST';
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW ref_special_scheme AS
    SELECT 1 AS scheme_id, 'INTEGRATED_PI'::varchar(40) AS code, 'INTEGRATED PI'::varchar(100) AS label
    UNION ALL
    SELECT 2 AS scheme_id, 'GROUP_PATROLLING'::varchar(40) AS code, 'GROUP PATROLLING'::varchar(100) AS label
    UNION ALL
    SELECT 3 AS scheme_id, 'CYCLE_PATROLLING'::varchar(40) AS code, 'CYCLE PATROLLING'::varchar(100) AS label
    UNION ALL
    SELECT 4 AS scheme_id, 'ANTI_SNATCHING'::varchar(40) AS code, 'ANTI SNATCHING'::varchar(100) AS label
    UNION ALL
    SELECT 5 AS scheme_id, 'PRAHARI'::varchar(40) AS code, 'PRAHARI'::varchar(100) AS label
    UNION ALL
    SELECT 6 AS scheme_id, 'EYES_EARS'::varchar(40) AS code, 'EYES EARS'::varchar(100) AS label;
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW ref_arrest_section_category AS
    SELECT 1 AS section_category_id, 'S_126_170_BNSS'::varchar(40) AS code, 'Preventive BNSS'::varchar(100) AS label
    UNION ALL
    SELECT 2 AS section_category_id, 'S_40_EX'::varchar(40) AS code, 'Excise'::varchar(100) AS label
    UNION ALL
    SELECT 3 AS section_category_id, 'S_92_93_97_DP'::varchar(40) AS code, 'DP Act'::varchar(100) AS label;
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW ref_missing_category AS
    SELECT 1 AS category_id, 'MISSING'::varchar(30) AS code, 'Missing Person'::varchar(100) AS label
    UNION ALL
    SELECT 2 AS category_id, 'ABANDONED_UNCONSCIOUS'::varchar(30) AS code, 'Abandoned / Unconscious'::varchar(100) AS label;
  `);

  // Create Master Views (fir_master, arrest_master, pcr_kalandra_master, missing_master, uidb_master)
  await knex.raw(`
    CREATE OR REPLACE VIEW fir_master AS
    SELECT
        f.source_record_id::varchar(36) AS record_uid,
        f.district_sk AS district_id,
        f.ps_sk AS ps_id,
        'Submitted'::varchar AS submission_status,
        CASE 
            WHEN f.local_head = 'M.V. Theft' THEN 3
            WHEN f.local_head IN ('Theft', 'Robbery', 'Burglary', 'House Theft', 'Other Theft', 'Night Burglary', 'Day Burglary', 'Mobile Phone Theft', 'Cycle Theft', 'Snatching') THEN 2
            ELSE 1
        END AS case_reg_type_id,
        f.fir_no AS fir_number,
        f.fir_date AS fir_date,
        f.gd_no AS dd_number,
        f.gd_date AS dd_date,
        COALESCE(f.gd_time, '12:00:00')::time AS dd_time,
        f.crime_head_sk AS crime_head_id,
        f.act_law_sk AS act_law_id,
        f.sections AS sections,
        f.beat_no AS beat_no,
        f.occurrence_date AS date_of_occurrence,
        COALESCE(r.data::jsonb->>'occurrence_time', '12:00:00')::time AS time_of_occurrence,
        f.occurrence_place AS place_of_occurrence,
        f.brief_facts AS brief_facts,
        f.complainant_name AS complainant_name,
        (r.data::jsonb->>'complainant_parent_name')::varchar AS complainant_parent_name,
        f.complainant_address AS complainant_address,
        f.accused_name AS accused_name,
        (r.data::jsonb->>'accused_parent_name')::varchar AS accused_parent_name,
        f.accused_address AS accused_address,
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
        f.remarks AS remarks,
        f.record_date AS diary_record_date,
        f.warehouse_loaded_at AS created_at,
        f.warehouse_updated_at AS updated_at
    FROM rpt.fact_fir f
    JOIN public.records r ON f.source_record_id = r.id;
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW arrest_master AS
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
        a.sections AS sections,
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
        COALESCE((r.data::jsonb->>'arrest_time'), '12:00:00')::time AS time_of_arrest,
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
        a.record_date AS diary_record_date,
        a.warehouse_loaded_at AS created_at,
        a.warehouse_updated_at AS updated_at
    FROM rpt.fact_arrest a
    JOIN public.records r ON a.source_record_id = r.id
    LEFT JOIN rpt.bridge_fir_arrest br ON br.arrest_sk = a.sk
    LEFT JOIN rpt.fact_fir f ON br.fir_sk = f.sk;
  `);

  await knex.raw(`
    CREATE OR REPLACE VIEW pcr_kalandra_master AS
    SELECT
        p.source_record_id::varchar(36) AS record_uid,
        p.district_sk AS district_id,
        p.ps_sk AS ps_id,
        'Submitted'::varchar AS submission_status,
        p.gd_no AS gd_entry_number,
        p.gd_date AS gd_entry_date,
        COALESCE(p.gd_time, '12:00:00')::time AS gd_entry_time,
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
    CREATE OR REPLACE VIEW missing_master AS
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
        '12:00:00'::time AS time_missing,
        '12:00:00'::time AS time_recovered,
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
    CREATE OR REPLACE VIEW uidb_master AS
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
        u.found_place AS found_place,
        NULL::numeric AS found_lat,
        NULL::numeric AS found_long,
        u.found_date AS discovery_date,
        (r.data::jsonb->>'duty_officer')::varchar AS duty_officer,
        u.officer_name AS io_name,
        (r.data::jsonb->>'io_mobile')::varchar AS io_mobile_no,
        u.informant_name AS informant_name,
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
        (r.data::jsonb->>'apparel_condition_desc')::text AS apparel_condition_desc,
        u.zipnet_no AS zipnet_no,
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

  // Load 03_views.sql
  const viewsPath = path.resolve(__dirname, '../../Master/files/03_views.sql');
  if (fs.existsSync(viewsPath)) {
    const viewsSql = fs.readFileSync(viewsPath, 'utf8');
    await knex.raw(viewsSql);
  } else {
    console.warn(`[Warning] SQL views file not found: ${viewsPath}`);
  }

  // Load 05_functions.sql
  const functionsPath = path.resolve(__dirname, '../../Master/files/05_functions.sql');
  if (fs.existsSync(functionsPath)) {
    const functionsSql = fs.readFileSync(functionsPath, 'utf8');
    await knex.raw(functionsSql);
  } else {
    console.warn(`[Warning] SQL functions file not found: ${functionsPath}`);
  }
}

export async function down(knex) {
  // Rollback views and types if needed
  if (knex.client.config.client === 'sqlite3') {
    return;
  }
  await knex.raw(`DROP VIEW IF EXISTS rpt_28_fir_goswara_summary CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS rpt_26_inquest_acp_sdm_disposal CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS rpt_25_inquest_registered CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS rpt_21_traced_persons CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS rpt_20_abandoned_persons CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS rpt_19_uidb CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS rpt_18_missing_persons CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS rpt_16_pi_disposal_e_mvt CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS rpt_15_pi_disposal_e_property CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS rpt_14_pi_disposal_manual CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS rpt_13_arrested_24hrs_list CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS rpt_11_proclaimed_offenders CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS rpt_10_arrested_efir_mv_theft CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS rpt_09_arrested_efir_theft CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS rpt_08_arrested_kalandara CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS rpt_07_arrested_east_district CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS rpt_05_mvt_cases CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS rpt_04_e_other_theft_cases CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS rpt_03_e_house_theft_cases CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS rpt_02_e_burglary_cases CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS rpt_01_manual_fir CASCADE;`);
  
  await knex.raw(`DROP VIEW IF EXISTS uidb_master CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS missing_master CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS pcr_kalandra_master CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS arrest_master CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS fir_master CASCADE;`);

  await knex.raw(`DROP VIEW IF EXISTS ref_missing_category CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS ref_arrest_section_category CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS ref_special_scheme CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS ref_arrest_status CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS ref_case_status CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS ref_act_law CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS ref_crime_head CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS ref_case_reg_type CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS ref_police_station CASCADE;`);
  await knex.raw(`DROP VIEW IF EXISTS ref_district CASCADE;`);
}
