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
  await knex.schema.alterTable('report_jobs', (table) => {
    table.string('template_id', 36).nullable().alter();
  });
}

export async function down(knex) {
  // Reversing this is complex; just log a warning
  console.warn('[Migration down] 20260619000000: Cannot safely revert template_id to NOT NULL if NULL rows exist.');
}
