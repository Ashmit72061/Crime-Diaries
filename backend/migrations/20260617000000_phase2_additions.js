export async function up(knex) {
  // 1. Alter records table
  await knex.schema.alterTable('records', (table) => {
    table.boolean('is_legacy').defaultTo(false);
    table.string('source_system'); // 'EXCEL_IMPORT' | 'PAPER_SCAN' | 'LEGACY_DB'
    table.timestamp('imported_at');
    table.string('imported_by', 36).references('id').inTable('users');
    table.string('legacy_ref');
  });

  // 2. Create legacy_import_batches
  await knex.schema.createTable('legacy_import_batches', (table) => {
    table.string('id', 36).primary();
    table.string('ps_id', 36).notNullable().references('id').inTable('hierarchy_nodes');
    table.string('record_type', 30).notNullable();
    table.string('source_file', 255).notNullable();
    table.string('imported_by', 36).references('id').inTable('users');
    table.timestamp('imported_at').defaultTo(knex.fn.now());
    table.integer('total_rows').notNullable().defaultTo(0);
    table.integer('imported_count').notNullable().defaultTo(0);
    table.integer('skipped_count').notNullable().defaultTo(0);
    table.integer('error_count').notNullable().defaultTo(0);
    table.string('status', 30).notNullable().defaultTo('PENDING');
    table.text('error_log').notNullable().defaultTo('[]'); // JSON string
  });

  // 3. Create legacy_amendments
  await knex.schema.createTable('legacy_amendments', (table) => {
    table.string('id', 36).primary();
    table.string('record_id', 36).notNullable().references('id').inTable('records').onDelete('CASCADE');
    table.string('requested_by', 36).notNullable().references('id').inTable('users');
    table.string('approved_by', 36).references('id').inTable('users');
    table.timestamp('requested_at').defaultTo(knex.fn.now());
    table.timestamp('approved_at');
    table.string('status', 30).notNullable().defaultTo('PENDING');
    table.text('field_changes').notNullable(); // JSON string
    table.text('reason').notNullable();
  });

  // 4. Create workflow_transitions_config
  await knex.schema.createTable('workflow_transitions_config', (table) => {
    table.string('id', 36).primary();
    table.string('record_type', 30).notNullable().defaultTo('*');
    table.string('from_status', 30).notNullable();
    table.string('to_status', 30).notNullable();
    table.string('action', 30).notNullable();
    table.text('allowed_roles').notNullable(); // JSON string array or string to represent roles
    table.boolean('requires_comment').notNullable().defaultTo(false);
    table.integer('sla_hours');
    table.boolean('is_active').notNullable().defaultTo(true);
  });

  // 5. Alter filter_presets to add is_active and created_at
  await knex.schema.alterTable('filter_presets', (table) => {
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').nullable();
  });

  // 6. Alter report_templates to add created_at
  await knex.schema.alterTable('report_templates', (table) => {
    table.timestamp('created_at').nullable();
  });

  // 7. Create scheduled_reports
  await knex.schema.createTable('scheduled_reports', (table) => {
    table.string('id', 36).primary();
    table.string('template_id', 36).notNullable().references('id').inTable('report_templates').onDelete('CASCADE');
    table.string('cron_expr', 50).notNullable();
    table.text('filter_spec').notNullable().defaultTo('{}');
    table.string('format', 10).notNullable().defaultTo('PDF');
    table.string('scope_ps_id', 36).references('id').inTable('hierarchy_nodes');
    table.string('scope_district_id', 36).references('id').inTable('hierarchy_nodes');
    table.text('recipients').notNullable().defaultTo('[]'); // JSON string array of user IDs
    table.string('created_by', 36).references('id').inTable('users');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('last_run_at');
    table.string('last_run_status', 30);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 8. Create level_data_contracts
  await knex.schema.createTable('level_data_contracts', (table) => {
    table.string('id', 36).primary();
    table.string('from_level', 20).notNullable();
    table.string('to_level', 20).notNullable();
    table.string('route', 30).notNullable().defaultTo('OPS_CHAIN');
    table.string('record_type', 30).notNullable().defaultTo('*');
    table.text('visible_field_keys').notNullable(); // JSON string array
    table.text('aggregate_definitions').notNullable().defaultTo('[]'); // JSON string array of aggregations
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('level_data_contracts');
  await knex.schema.dropTableIfExists('scheduled_reports');

  try {
    await knex.schema.alterTable('report_templates', (table) => {
      table.dropColumn('created_at');
    });
  } catch(e) {}

  try {
    await knex.schema.alterTable('filter_presets', (table) => {
      table.dropColumn('is_active');
      table.dropColumn('created_at');
    });
  } catch(e) {}

  await knex.schema.dropTableIfExists('workflow_transitions_config');
  await knex.schema.dropTableIfExists('legacy_amendments');
  await knex.schema.dropTableIfExists('legacy_import_batches');

  try {
    await knex.schema.alterTable('records', (table) => {
      table.dropColumn('is_legacy');
      table.dropColumn('source_system');
      table.dropColumn('imported_at');
      table.dropColumn('imported_by');
      table.dropColumn('legacy_ref');
    });
  } catch(e) {}
}
