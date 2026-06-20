import db from '../src/config/db.js';
async function test() {
  try {
    console.log("Dropping report_jobs table...");
    await db.schema.dropTableIfExists('report_jobs');
    
    console.log("Creating report_jobs table with nullable template_id...");
    await db.schema.createTable('report_jobs', (table) => {
      table.string('id', 36).primary();
      table.string('template_id', 36).nullable().references('id').inTable('report_templates').onDelete('CASCADE');
      table.text('filters');
      table.string('format', 10);
      table.string('status', 20).notNullable().defaultTo('PENDING');
      table.text('file_path');
      table.string('created_by', 36).notNullable().references('id').inTable('users');
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
      table.text('custom_definition').nullable();
      table.text('error_message').nullable();
    });

    const info = await db.raw("PRAGMA table_info(report_jobs)");
    console.log("Updated Table info:", info);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await db.destroy();
  }
}
test();
