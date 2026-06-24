/**
 * Migration: Reporting Data Warehouse Schema (Phase 1.5)
 * ========================================================
 * Builds the full reporting warehouse as an additive layer.
 *
 * COMPATIBILITY:
 * - PostgreSQL (production): uses a dedicated `rpt` schema so warehouse
 *   tables are cleanly separated from operational tables.
 * - SQLite (local dev): PostgreSQL schemas don't exist in SQLite, so
 *   tables are created in the default namespace using a `rpt_` prefix
 *   (e.g. `rpt_dim_district`, `rpt_fact_fir`).  The warehouse.db.js
 *   helper abstracts this transparently — application code always uses
 *   table logical names; the helper adds the prefix/schema.
 *
 * IDEMPOTENCY:
 * - All CREATE TABLE / CREATE INDEX calls use IF NOT EXISTS checks.
 * - Safe to re-run without data loss.
 *
 * LIVE SYSTEM:
 * - This migration only creates NEW tables / schema.
 * - Zero writes to existing operational tables (records, hierarchy_nodes, etc.).
 *
 * Tables created:
 * ─── Dimensions ──────────────────────────────────────────────────────────────
 *   dim_district        — canonical district rows from hierarchy_nodes
 *   dim_police_station  — canonical PS rows, FK → dim_district
 *   dim_officer         — normalized free-text IO names
 *   dim_crime_head      — normalized crime-head / call-head enum values
 *   dim_case_status     — record-type-specific status values
 *   dim_act_law         — normalized Act / law names
 * ─── Facts ───────────────────────────────────────────────────────────────────
 *   fact_fir            — FIR Master (CASE records)
 *   fact_arrest         — Arrest Master (ARREST records)
 *   fact_pcr            — PCR / Kalandra Master (PCR_CALL records)
 *   fact_missing        — Missing Person Master (MISSING records)
 *   fact_uidb           — UIDB Master (UIDB records)
 * ─── Bridges ─────────────────────────────────────────────────────────────────
 *   bridge_fir_arrest   — FIR ↔ Arrest real FK relationship
 *   bridge_fir_missing  — FIR ↔ Missing Person real FK relationship
 * ─── Sync ────────────────────────────────────────────────────────────────────
 *   sync_log            — watermark + outcome per sync run per source table
 */

export async function up(knex) {
  await knex.raw(`CREATE SCHEMA IF NOT EXISTS rpt`);

  const t = (name) => `rpt.${name}`;

  // ── dim_district ─────────────────────────────────────────────────────────
  const hasDimDistrict = await knex.schema.hasTable(t('dim_district'));
  if (!hasDimDistrict) {
    await knex.schema.createTable(t('dim_district'), (tbl) => {
      tbl.increments('sk').primary();
      tbl.string('source_district_id', 36).notNullable().unique(); // FK to hierarchy_nodes.id
      tbl.string('name_en', 120).notNullable();
      tbl.string('name_hi', 120).notNullable().defaultTo('');
      tbl.string('code', 30).nullable();
      tbl.timestamp('warehouse_loaded_at').notNullable().defaultTo(knex.fn.now());
    });
  }

  // ── dim_police_station ───────────────────────────────────────────────────
  const hasDimPs = await knex.schema.hasTable(t('dim_police_station'));
  if (!hasDimPs) {
    await knex.schema.createTable(t('dim_police_station'), (tbl) => {
      tbl.increments('sk').primary();
      tbl.string('source_ps_id', 36).notNullable().unique(); // FK to hierarchy_nodes.id
      tbl.string('name_en', 120).notNullable();
      tbl.string('name_hi', 120).notNullable().defaultTo('');
      tbl.string('code', 30).nullable();
      tbl.integer('district_sk').notNullable().references('sk').inTable(t('dim_district'));
      tbl.timestamp('warehouse_loaded_at').notNullable().defaultTo(knex.fn.now());
    });
  }

  // ── dim_officer ──────────────────────────────────────────────────────────
  // Keyed by normalized name — consolidates casing/spacing variants
  const hasDimOfficer = await knex.schema.hasTable(t('dim_officer'));
  if (!hasDimOfficer) {
    await knex.schema.createTable(t('dim_officer'), (tbl) => {
      tbl.increments('sk').primary();
      tbl.string('name_raw', 200).notNullable();       // first seen raw value
      tbl.string('name_normalized', 200).notNullable().unique(); // canonical dedup key
      tbl.boolean('is_unmapped').notNullable().defaultTo(false);
      tbl.timestamp('warehouse_loaded_at').notNullable().defaultTo(knex.fn.now());
    });
  }

  // ── dim_crime_head ───────────────────────────────────────────────────────
  const hasDimCrimeHead = await knex.schema.hasTable(t('dim_crime_head'));
  if (!hasDimCrimeHead) {
    await knex.schema.createTable(t('dim_crime_head'), (tbl) => {
      tbl.increments('sk').primary();
      tbl.string('value_raw', 255).notNullable();
      tbl.string('value_normalized', 255).notNullable().unique();
      tbl.boolean('is_unmapped').notNullable().defaultTo(false);
      tbl.timestamp('warehouse_loaded_at').notNullable().defaultTo(knex.fn.now());
    });
  }

  // ── dim_case_status ──────────────────────────────────────────────────────
  // record_type + value together form the natural key (same string "Open"
  // means different things in CASE vs PCR_CALL)
  const hasDimStatus = await knex.schema.hasTable(t('dim_case_status'));
  if (!hasDimStatus) {
    await knex.schema.createTable(t('dim_case_status'), (tbl) => {
      tbl.increments('sk').primary();
      tbl.string('record_type', 20).notNullable();
      tbl.string('value_raw', 100).notNullable();
      tbl.string('value_normalized', 100).notNullable();
      tbl.boolean('is_unmapped').notNullable().defaultTo(false);
      tbl.timestamp('warehouse_loaded_at').notNullable().defaultTo(knex.fn.now());
      tbl.unique(['record_type', 'value_normalized']);
    });
  }

  // ── dim_act_law ──────────────────────────────────────────────────────────
  const hasDimActLaw = await knex.schema.hasTable(t('dim_act_law'));
  if (!hasDimActLaw) {
    await knex.schema.createTable(t('dim_act_law'), (tbl) => {
      tbl.increments('sk').primary();
      tbl.string('value_raw', 300).notNullable();
      tbl.string('value_normalized', 300).notNullable().unique();
      tbl.boolean('is_unmapped').notNullable().defaultTo(false);
      tbl.timestamp('warehouse_loaded_at').notNullable().defaultTo(knex.fn.now());
    });
  }

  // ── fact_fir ─────────────────────────────────────────────────────────────
  const hasFactFir = await knex.schema.hasTable(t('fact_fir'));
  if (!hasFactFir) {
    await knex.schema.createTable(t('fact_fir'), (tbl) => {
      tbl.bigIncrements('sk').primary();
      // Natural / audit keys
      tbl.string('source_record_id', 36).notNullable().unique(); // records.id
      tbl.string('source_record_uid', 100).nullable();           // internal UID from data blob if any
      tbl.timestamp('source_updated_at').nullable();
      tbl.timestamp('warehouse_loaded_at').notNullable().defaultTo(knex.fn.now());
      tbl.timestamp('warehouse_updated_at').notNullable().defaultTo(knex.fn.now());
      // Jurisdictional (for scoping — plain text, mirrors records columns)
      tbl.string('ps_id', 36).notNullable();
      tbl.string('district_id', 36).notNullable();
      tbl.string('sub_div_id', 36).nullable();
      // Dimension FKs
      tbl.integer('district_sk').nullable().references('sk').inTable(t('dim_district'));
      tbl.integer('ps_sk').nullable().references('sk').inTable(t('dim_police_station'));
      tbl.integer('officer_sk').nullable().references('sk').inTable(t('dim_officer'));
      tbl.integer('crime_head_sk').nullable().references('sk').inTable(t('dim_crime_head'));
      tbl.integer('status_sk').nullable().references('sk').inTable(t('dim_case_status'));
      tbl.integer('act_law_sk').nullable().references('sk').inTable(t('dim_act_law'));
      // Workflow
      tbl.string('workflow_status', 30).nullable();  // records.current_status
      // Domain fields — typed columns (no JSONB)
      tbl.string('fir_no', 100).nullable();
      tbl.date('fir_date').nullable();
      tbl.string('gd_no', 100).nullable();
      tbl.date('gd_date').nullable();
      tbl.string('gd_time', 20).nullable();
      tbl.string('beat_no', 50).nullable();
      tbl.date('occurrence_date').nullable();
      tbl.string('occurrence_place', 500).nullable();
      tbl.string('local_head', 255).nullable();      // denormalized copy
      tbl.string('act_name', 300).nullable();
      tbl.string('sections', 500).nullable();
      tbl.text('brief_facts').nullable();
      // PII — stored but access-controlled in query engine
      tbl.string('complainant_name', 200).nullable();
      tbl.string('complainant_address', 500).nullable();
      tbl.string('accused_name', 200).nullable();
      tbl.string('accused_address', 500).nullable();
      tbl.string('officer_name', 200).nullable();    // denormalized io_name
      tbl.string('officer_pis', 50).nullable();
      tbl.string('officer_mobile', 30).nullable();
      tbl.text('property_description').nullable();
      tbl.string('property_status', 50).nullable();
      tbl.string('case_status', 100).nullable();     // denormalized
      tbl.text('remarks').nullable();
      tbl.boolean('cctns_flag').nullable();
      tbl.boolean('zero_fir_flag').nullable();
      tbl.date('record_date').nullable();
    });

    // Reporting indexes (non-blocking)
    await knex.schema.table(t('fact_fir'), (tbl) => {
      tbl.index(['ps_id'], `idx_ff_ps_id`);
      tbl.index(['district_id'], `idx_ff_district_id`);
      tbl.index(['fir_date'], `idx_ff_fir_date`);
      tbl.index(['local_head'], `idx_ff_crime_head`);
      tbl.index(['case_status'], `idx_ff_status`);
      tbl.index(['record_date'], `idx_ff_record_date`);
    });
  }

  // ── fact_arrest ──────────────────────────────────────────────────────────
  const hasFactArrest = await knex.schema.hasTable(t('fact_arrest'));
  if (!hasFactArrest) {
    await knex.schema.createTable(t('fact_arrest'), (tbl) => {
      tbl.bigIncrements('sk').primary();
      tbl.string('source_record_id', 36).notNullable().unique();
      tbl.timestamp('source_updated_at').nullable();
      tbl.timestamp('warehouse_loaded_at').notNullable().defaultTo(knex.fn.now());
      tbl.timestamp('warehouse_updated_at').notNullable().defaultTo(knex.fn.now());
      tbl.string('ps_id', 36).notNullable();
      tbl.string('district_id', 36).notNullable();
      tbl.string('sub_div_id', 36).nullable();
      tbl.integer('district_sk').nullable().references('sk').inTable(t('dim_district'));
      tbl.integer('ps_sk').nullable().references('sk').inTable(t('dim_police_station'));
      tbl.integer('officer_sk').nullable().references('sk').inTable(t('dim_officer'));
      tbl.integer('crime_head_sk').nullable().references('sk').inTable(t('dim_crime_head'));
      tbl.integer('status_sk').nullable().references('sk').inTable(t('dim_case_status'));
      tbl.integer('act_law_sk').nullable().references('sk').inTable(t('dim_act_law'));
      tbl.string('workflow_status', 30).nullable();
      // Domain
      tbl.string('linked_fir_dd_no', 100).nullable();   // join key to fact_fir
      tbl.string('act_name', 300).nullable();
      tbl.string('sections', 500).nullable();
      tbl.string('crime_head', 255).nullable();
      tbl.string('arrested_name', 200).nullable();       // PII
      tbl.string('arrested_address', 500).nullable();    // PII
      tbl.date('arrest_date').nullable();
      tbl.string('arrest_place', 300).nullable();
      tbl.string('custody_status', 100).nullable();
      tbl.string('officer_name', 200).nullable();
      tbl.boolean('nafis_prepared').nullable();
      tbl.boolean('dossier_prepared').nullable();
      tbl.date('record_date').nullable();
    });

    await knex.schema.table(t('fact_arrest'), (tbl) => {
      tbl.index(['ps_id'], `idx_fa_ps_id`);
      tbl.index(['district_id'], `idx_fa_district_id`);
      tbl.index(['arrest_date'], `idx_fa_arrest_date`);
      tbl.index(['linked_fir_dd_no'], `idx_fa_fir_link`);
    });
  }

  // ── fact_pcr ─────────────────────────────────────────────────────────────
  const hasFactPcr = await knex.schema.hasTable(t('fact_pcr'));
  if (!hasFactPcr) {
    await knex.schema.createTable(t('fact_pcr'), (tbl) => {
      tbl.bigIncrements('sk').primary();
      tbl.string('source_record_id', 36).notNullable().unique();
      tbl.timestamp('source_updated_at').nullable();
      tbl.timestamp('warehouse_loaded_at').notNullable().defaultTo(knex.fn.now());
      tbl.timestamp('warehouse_updated_at').notNullable().defaultTo(knex.fn.now());
      tbl.string('ps_id', 36).notNullable();
      tbl.string('district_id', 36).notNullable();
      tbl.string('sub_div_id', 36).nullable();
      tbl.integer('district_sk').nullable().references('sk').inTable(t('dim_district'));
      tbl.integer('ps_sk').nullable().references('sk').inTable(t('dim_police_station'));
      tbl.integer('officer_sk').nullable().references('sk').inTable(t('dim_officer'));
      tbl.integer('crime_head_sk').nullable().references('sk').inTable(t('dim_crime_head'));
      tbl.integer('status_sk').nullable().references('sk').inTable(t('dim_case_status'));
      tbl.string('workflow_status', 30).nullable();
      // Domain
      tbl.string('pcr_no', 100).nullable();
      tbl.string('gd_no', 100).nullable();
      tbl.date('gd_date').nullable();
      tbl.string('gd_time', 20).nullable();
      tbl.string('call_head', 255).nullable();
      tbl.text('call_gist').nullable();
      tbl.string('caller_name', 200).nullable();         // PII
      tbl.string('caller_mobile', 30).nullable();        // PII
      tbl.string('officer_name', 200).nullable();
      tbl.string('arrival_time', 20).nullable();
      tbl.string('call_status', 100).nullable();
      tbl.date('record_date').nullable();
    });

    await knex.schema.table(t('fact_pcr'), (tbl) => {
      tbl.index(['ps_id'], `idx_fp_ps_id`);
      tbl.index(['district_id'], `idx_fp_district_id`);
      tbl.index(['gd_date'], `idx_fp_gd_date`);
      tbl.index(['call_status'], `idx_fp_status`);
    });
  }

  // ── fact_missing ─────────────────────────────────────────────────────────
  const hasFactMissing = await knex.schema.hasTable(t('fact_missing'));
  if (!hasFactMissing) {
    await knex.schema.createTable(t('fact_missing'), (tbl) => {
      tbl.bigIncrements('sk').primary();
      tbl.string('source_record_id', 36).notNullable().unique();
      tbl.timestamp('source_updated_at').nullable();
      tbl.timestamp('warehouse_loaded_at').notNullable().defaultTo(knex.fn.now());
      tbl.timestamp('warehouse_updated_at').notNullable().defaultTo(knex.fn.now());
      tbl.string('ps_id', 36).notNullable();
      tbl.string('district_id', 36).notNullable();
      tbl.string('sub_div_id', 36).nullable();
      tbl.integer('district_sk').nullable().references('sk').inTable(t('dim_district'));
      tbl.integer('ps_sk').nullable().references('sk').inTable(t('dim_police_station'));
      tbl.integer('officer_sk').nullable().references('sk').inTable(t('dim_officer'));
      tbl.integer('status_sk').nullable().references('sk').inTable(t('dim_case_status'));
      tbl.string('workflow_status', 30).nullable();
      // Domain
      tbl.string('dd_no', 100).nullable();               // join key to fact_fir via gd_no
      tbl.date('dd_date').nullable();
      tbl.string('missing_name', 200).nullable();        // PII
      tbl.integer('age').nullable();
      tbl.string('gender', 20).nullable();
      tbl.string('major_minor', 20).nullable();
      tbl.date('missing_date').nullable();
      tbl.string('missing_place', 300).nullable();
      tbl.text('physical_description').nullable();
      tbl.string('informant_name', 200).nullable();      // PII
      tbl.string('informant_mobile', 30).nullable();     // PII
      tbl.string('officer_name', 200).nullable();
      tbl.string('zipnet_no', 100).nullable();
      tbl.string('missing_status', 100).nullable();
      tbl.date('record_date').nullable();
    });

    await knex.schema.table(t('fact_missing'), (tbl) => {
      tbl.index(['ps_id'], `idx_fm_ps_id`);
      tbl.index(['district_id'], `idx_fm_district_id`);
      tbl.index(['missing_date'], `idx_fm_missing_date`);
      tbl.index(['dd_no'], `idx_fm_dd_no`);
      tbl.index(['gender'], `idx_fm_gender`);
      tbl.index(['missing_status'], `idx_fm_status`);
    });
  }

  // ── fact_uidb ────────────────────────────────────────────────────────────
  const hasFactUidb = await knex.schema.hasTable(t('fact_uidb'));
  if (!hasFactUidb) {
    await knex.schema.createTable(t('fact_uidb'), (tbl) => {
      tbl.bigIncrements('sk').primary();
      tbl.string('source_record_id', 36).notNullable().unique();
      tbl.timestamp('source_updated_at').nullable();
      tbl.timestamp('warehouse_loaded_at').notNullable().defaultTo(knex.fn.now());
      tbl.timestamp('warehouse_updated_at').notNullable().defaultTo(knex.fn.now());
      tbl.string('ps_id', 36).notNullable();
      tbl.string('district_id', 36).notNullable();
      tbl.string('sub_div_id', 36).nullable();
      tbl.integer('district_sk').nullable().references('sk').inTable(t('dim_district'));
      tbl.integer('ps_sk').nullable().references('sk').inTable(t('dim_police_station'));
      tbl.integer('officer_sk').nullable().references('sk').inTable(t('dim_officer'));
      tbl.integer('status_sk').nullable().references('sk').inTable(t('dim_case_status'));
      tbl.string('workflow_status', 30).nullable();
      // Domain
      tbl.string('dd_no', 100).nullable();
      tbl.date('found_date').nullable();
      tbl.string('found_place', 300).nullable();
      tbl.string('gender', 20).nullable();
      tbl.string('approx_age', 50).nullable();          // free text "25-30" or "30"
      tbl.integer('approx_age_num').nullable();          // parsed integer for range queries
      tbl.text('description').nullable();
      tbl.string('officer_name', 200).nullable();
      tbl.string('informant_name', 200).nullable();     // PII
      tbl.string('zipnet_no', 100).nullable();
      tbl.boolean('identified').nullable();
      tbl.string('uidb_status', 300).nullable();
      tbl.date('record_date').nullable();
    });

    await knex.schema.table(t('fact_uidb'), (tbl) => {
      tbl.index(['ps_id'], `idx_fu_ps_id`);
      tbl.index(['district_id'], `idx_fu_district_id`);
      tbl.index(['found_date'], `idx_fu_found_date`);
      tbl.index(['gender'], `idx_fu_gender`);
      tbl.index(['identified'], `idx_fu_identified`);
    });
  }

  // ── bridge_fir_arrest ────────────────────────────────────────────────────
  const hasBridgeFirArrest = await knex.schema.hasTable(t('bridge_fir_arrest'));
  if (!hasBridgeFirArrest) {
    await knex.schema.createTable(t('bridge_fir_arrest'), (tbl) => {
      tbl.bigIncrements('id').primary();
      tbl.bigInteger('fir_sk').notNullable().references('sk').inTable(t('fact_fir')).onDelete('CASCADE');
      tbl.bigInteger('arrest_sk').notNullable().references('sk').inTable(t('fact_arrest')).onDelete('CASCADE');
      tbl.string('link_type', 30).notNullable().defaultTo('FIR_NO_MATCH'); // how the link was established
      tbl.timestamp('linked_at').notNullable().defaultTo(knex.fn.now());
      tbl.unique(['fir_sk', 'arrest_sk']);
    });

    await knex.schema.table(t('bridge_fir_arrest'), (tbl) => {
      tbl.index(['fir_sk'], `idx_bfa_fir_sk`);
      tbl.index(['arrest_sk'], `idx_bfa_arrest_sk`);
    });
  }

  // ── bridge_fir_missing ───────────────────────────────────────────────────
  const hasBridgeFirMissing = await knex.schema.hasTable(t('bridge_fir_missing'));
  if (!hasBridgeFirMissing) {
    await knex.schema.createTable(t('bridge_fir_missing'), (tbl) => {
      tbl.bigIncrements('id').primary();
      tbl.bigInteger('fir_sk').notNullable().references('sk').inTable(t('fact_fir')).onDelete('CASCADE');
      tbl.bigInteger('missing_sk').notNullable().references('sk').inTable(t('fact_missing')).onDelete('CASCADE');
      tbl.string('link_type', 30).notNullable().defaultTo('GD_NO_MATCH');
      tbl.timestamp('linked_at').notNullable().defaultTo(knex.fn.now());
      tbl.unique(['fir_sk', 'missing_sk']);
    });

    await knex.schema.table(t('bridge_fir_missing'), (tbl) => {
      tbl.index(['fir_sk'], `idx_bfm_fir_sk`);
      tbl.index(['missing_sk'], `idx_bfm_missing_sk`);
    });
  }

  // ── sync_log ─────────────────────────────────────────────────────────────
  const hasSyncLog = await knex.schema.hasTable(t('sync_log'));
  if (!hasSyncLog) {
    await knex.schema.createTable(t('sync_log'), (tbl) => {
      tbl.increments('id').primary();
      tbl.string('source_table', 30).notNullable(); // CASE|ARREST|PCR_CALL|MISSING|UIDB|ALL
      tbl.timestamp('run_started_at').notNullable().defaultTo(knex.fn.now());
      tbl.timestamp('run_completed_at').nullable();
      tbl.timestamp('watermark_from').nullable();    // last watermark at start of run
      tbl.timestamp('watermark_to').nullable();      // new watermark after run
      tbl.integer('rows_scanned').notNullable().defaultTo(0);
      tbl.integer('rows_upserted').notNullable().defaultTo(0);
      tbl.integer('rows_failed').notNullable().defaultTo(0);
      tbl.integer('bridges_updated').notNullable().defaultTo(0);
      tbl.string('status', 20).notNullable().defaultTo('RUNNING'); // RUNNING|SUCCESS|PARTIAL|FAILED
      tbl.text('error_rows').notNullable().defaultTo('[]');  // JSON array of {source_id, error}
      tbl.text('notes').nullable();
    });

    await knex.schema.table(t('sync_log'), (tbl) => {
      tbl.index(['source_table'], `idx_sl_source`);
      tbl.index(['run_started_at'], `idx_sl_started`);
    });
  }
}

export async function down(knex) {
  const t = (name) => `rpt.${name}`;

  // Drop in reverse dependency order
  await knex.schema.dropTableIfExists(t('sync_log'));
  await knex.schema.dropTableIfExists(t('bridge_fir_missing'));
  await knex.schema.dropTableIfExists(t('bridge_fir_arrest'));
  await knex.schema.dropTableIfExists(t('fact_uidb'));
  await knex.schema.dropTableIfExists(t('fact_missing'));
  await knex.schema.dropTableIfExists(t('fact_pcr'));
  await knex.schema.dropTableIfExists(t('fact_arrest'));
  await knex.schema.dropTableIfExists(t('fact_fir'));
  await knex.schema.dropTableIfExists(t('dim_act_law'));
  await knex.schema.dropTableIfExists(t('dim_case_status'));
  await knex.schema.dropTableIfExists(t('dim_crime_head'));
  await knex.schema.dropTableIfExists(t('dim_officer'));
  await knex.schema.dropTableIfExists(t('dim_police_station'));
  await knex.schema.dropTableIfExists(t('dim_district'));

  await knex.raw(`DROP SCHEMA IF EXISTS rpt CASCADE`);
}
