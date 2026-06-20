/**
 * Migration: 20260619000000_nullable_template_id_report_jobs
 *
 * Problem: report_jobs.template_id is NOT NULL + FK → report_templates.id.
 * The frontend sends in-memory template IDs like 'cases-register', 'arrest-summary', etc.
 * which do NOT exist as rows in report_templates, causing:
 *   "insert or update on table 'report_jobs' violates foreign key constraint report_jobs_template_id_foreign"
 *
 * Fix: Make template_id nullable. The controller already resolves the ID against the DB
 * and stores NULL when the template is an in-memory fallback.
 *
 * NOTE: SQLite does not support DROP COLUMN or ALTER COLUMN directly.
 * We recreate the table to apply the schema change.
 */

export async function up(knex) {
  const isSQLite = knex.client.config.client === 'sqlite3' || knex.client.config.client === 'better-sqlite3';

  if (isSQLite) {
    // SQLite workaround: rename → recreate → copy → drop old
    await knex.schema.renameTable('report_jobs', 'report_jobs_old');

    await knex.schema.createTable('report_jobs', (table) => {
      table.string('id', 36).primary();
      // Now nullable — no FK violation when template is an in-memory fallback
      table.string('template_id', 36).nullable().references('id').inTable('report_templates').onDelete('SET NULL');
      table.text('filters');
      table.string('format', 10);
      table.string('status', 20).notNullable().defaultTo('PENDING');
      table.text('file_path');
      table.string('created_by', 36).notNullable().references('id').inTable('users');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    // Copy existing rows
    await knex.raw(`
      INSERT INTO report_jobs (id, template_id, filters, format, status, file_path, created_by, created_at, updated_at)
      SELECT id, template_id, filters, format, status, file_path, created_by, created_at, updated_at
      FROM report_jobs_old
    `);

    await knex.schema.dropTable('report_jobs_old');
  } else {
    // PostgreSQL / MySQL path
    await knex.schema.alterTable('report_jobs', (table) => {
      table.string('template_id', 36).nullable().alter();
    });
  }
}

export async function down(knex) {
  // Reversing this is complex; just log a warning
  console.warn('[Migration down] 20260619000000: Cannot safely revert template_id to NOT NULL if NULL rows exist.');
}
