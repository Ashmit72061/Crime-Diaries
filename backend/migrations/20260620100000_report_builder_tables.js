/**
 * Migration: Report Builder Tables
 * ==================================
 * Adds two new tables for the Custom Report Builder feature.
 * This is a purely ADDITIVE migration — no existing tables or columns are altered.
 *
 * Tables added:
 *   1. report_builder_saved   — user-saved custom report templates
 *   2. report_builder_audit   — audit trail for every preview/export/cross-match run
 *
 * Compatible with: PostgreSQL (production) and SQLite (local dev).
 */

export async function up(knex) {
  const pg = knex.client.config.client === 'pg' || knex.client.config.client === 'postgresql';

  // ── 1. report_builder_saved ────────────────────────────────────────────────
  const hasSaved = await knex.schema.hasTable('report_builder_saved');
  if (!hasSaved) {
    await knex.schema.createTable('report_builder_saved', (t) => {
      t.string('id', 36).primary();
      t.string('name', 255).notNullable();
      t.text('description').nullable();

      // Full query spec: { table, join?, fields[], filters?, sort? }
      t.text('query_spec').notNullable();

      // If true, this template is visible to HQ roles in addition to the creator
      t.boolean('is_shared').notNullable().defaultTo(false);

      t.string('created_by', 36).notNullable().references('id').inTable('users').onDelete('SET NULL');
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    });

    // Index so listing a user's saved reports is fast
    await knex.schema.table('report_builder_saved', (t) => {
      t.index(['created_by'], 'idx_report_builder_saved_created_by');
      t.index(['is_shared'], 'idx_report_builder_saved_is_shared');
    });
  }

  // ── 2. report_builder_audit ───────────────────────────────────────────────
  const hasAudit = await knex.schema.hasTable('report_builder_audit');
  if (!hasAudit) {
    await knex.schema.createTable('report_builder_audit', (t) => {
      t.string('id', 36).primary();
      t.string('user_id', 36).nullable().references('id').inTable('users').onDelete('SET NULL');
      t.string('user_role', 50).nullable();

      // What kind of operation triggered this log
      // PREVIEW = paginated data preview (POST /query)
      // EXPORT  = file export (POST /export)
      // CROSS_MATCH = MISSING↔UIDB cross-match
      t.string('run_type', 20).notNullable();

      // JSON snapshots of what was queried (non-normalised, for forensic readback)
      t.text('table_spec').nullable();   // e.g. "CASE" or "CASE+ARREST"
      t.text('fields_spec').nullable();  // JSON array of selected fields
      t.text('filter_spec').nullable();  // JSON filter tree

      // Export-specific fields
      t.string('format', 10).nullable();      // CSV | XLSX | PDF | null (preview)
      t.integer('row_count').nullable();      // rows returned / exported
      t.string('job_id', 36).nullable();      // links to report_jobs.id for exports

      t.string('ip_address', 64).nullable();
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    });

    // Indexes for audit dashboard queries
    await knex.schema.table('report_builder_audit', (t) => {
      t.index(['user_id'], 'idx_rba_user_id');
      t.index(['created_at'], 'idx_rba_created_at');
      t.index(['run_type'], 'idx_rba_run_type');
    });
  }
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('report_builder_audit');
  await knex.schema.dropTableIfExists('report_builder_saved');
}
