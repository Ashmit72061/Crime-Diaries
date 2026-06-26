/**
 * Migration: 20260622000000_drop_report_jobs_template_fk
 *
 * The previous migration (20260619) made template_id nullable but left the FK
 * report_jobs_template_id_foreign → report_templates.id in place.
 * In-memory templates (arrest-summary, cases-register, arrested-24hr-list, etc.)
 * are never inserted into report_templates, so every job insert fails with:
 *   "insert or update on table 'report_jobs' violates foreign key constraint"
 *
 * Fix: drop the FK. template_id is a free-form string identifier; resolution
 * against the DB or in-memory registry is handled in the controller layer.
 */

export async function up(knex) {
  await knex.schema.alterTable('report_jobs', (table) => {
    table.dropForeign(['template_id']);
  });
}

export async function down(knex) {
  await knex.schema.alterTable('report_jobs', (table) => {
    table.foreign('template_id').references('id').inTable('report_templates');
  });
}
