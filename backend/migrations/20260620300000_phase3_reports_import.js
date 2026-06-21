export async function up(knex) {
  // 1. Recreate report_jobs to make template_id nullable (necessary for SQLite table alteration limits)
  await knex.schema.dropTableIfExists('report_jobs');
  await knex.schema.createTable('report_jobs', (table) => {
    table.string('id', 36).primary();
    table.string('template_id', 36).nullable().references('id').inTable('report_templates').onDelete('CASCADE');
    table.text('filters'); // JSON string
    table.string('format', 10);
    table.string('status', 20).notNullable().defaultTo('PENDING'); // PENDING|READY|FAILED
    table.text('file_path');
    table.string('created_by', 36).notNullable().references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.text('custom_definition').nullable(); // JSON string
    table.text('error_message').nullable();
  });

  // 2. Alter report_templates
  await knex.schema.alterTable('report_templates', (table) => {
    table.string('template_type', 50).notNullable().defaultTo('PROFORMA');
  });

  // 3. Create import_batches
  await knex.schema.createTable('import_batches', (table) => {
    table.string('id', 36).primary();
    table.string('record_type', 50).notNullable(); // 'ARREST' | 'PCR_CALL' | 'CASE'
    table.boolean('is_legacy').notNullable().defaultTo(false);
    table.string('uploaded_by', 36).notNullable().references('id').inTable('users').onDelete('SET NULL');
    table.string('ps_id', 36).nullable().references('id').inTable('hierarchy_nodes').onDelete('SET NULL');
    table.string('district_id', 36).nullable().references('id').inTable('hierarchy_nodes').onDelete('SET NULL');
    table.string('file_path', 255).notNullable();
    table.integer('total_rows').notNullable().defaultTo(0);
    table.integer('valid_rows').notNullable().defaultTo(0);
    table.integer('invalid_rows').notNullable().defaultTo(0);
    table.string('status', 50).notNullable().defaultTo('VALIDATION_PENDING');
    table.integer('imported_rows').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('confirmed_at').nullable();
  });

  // 4. Create import_batch_errors
  await knex.schema.createTable('import_batch_errors', (table) => {
    table.string('id', 36).primary();
    table.string('batch_id', 36).notNullable().references('id').inTable('import_batches').onDelete('CASCADE');
    table.integer('row_number').notNullable();
    table.string('field_key', 60).nullable();
    table.string('error_code', 50).notNullable();
    table.text('error_message').notNullable();
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('import_batch_errors');
  await knex.schema.dropTableIfExists('import_batches');

  try {
    await knex.schema.alterTable('report_templates', (table) => {
      table.dropColumn('template_type');
    });
  } catch(e) {}

  // Recreate report_jobs back to its original layout with notNullable template_id
  await knex.schema.dropTableIfExists('report_jobs');
  await knex.schema.createTable('report_jobs', (table) => {
    table.string('id', 36).primary();
    table.string('template_id', 36).notNullable().references('id').inTable('report_templates').onDelete('CASCADE');
    table.text('filters'); // JSON string
    table.string('format', 10);
    table.string('status', 20).notNullable().defaultTo('PENDING'); // PENDING|READY|FAILED
    table.text('file_path');
    table.string('created_by', 36).notNullable().references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}
