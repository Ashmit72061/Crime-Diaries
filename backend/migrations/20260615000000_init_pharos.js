export async function up(knex) {
  // 1. hierarchy_nodes
  await knex.schema.createTable('hierarchy_nodes', (table) => {
    table.string('id', 36).primary();
    table.string('node_type', 30).notNullable(); // 'PS'|'SUB_DIVISION'|'DISTRICT'|'JCP'|'SCP'|'HQ'
    table.string('name_en', 100).notNullable();
    table.string('name_hi', 100).notNullable();
    table.string('code', 30).unique();
    table.string('parent_id', 36).references('id').inTable('hierarchy_nodes').onDelete('CASCADE');
    table.text('metadata'); // JSON object
    table.boolean('is_active').notNullable().defaultTo(true);
  });

  // 2. users
  await knex.schema.createTable('users', (table) => {
    table.string('id', 36).primary();
    table.string('username', 50).unique().notNullable();
    table.string('badge_no', 50).unique().notNullable();
    table.string('name_en', 100).notNullable();
    table.string('name_hi', 100).notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('role', 20).notNullable(); // HC|SHO|DISTRICT_OFFICER|HQ_ANALYST|HQ_ADMIN|SYSTEM_ADMIN
    table.string('station_id', 36).references('id').inTable('hierarchy_nodes').onDelete('SET NULL');
    table.string('district_id', 36).references('id').inTable('hierarchy_nodes').onDelete('SET NULL');
    table.string('sub_div_id', 36).references('id').inTable('hierarchy_nodes').onDelete('SET NULL');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('last_login');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 3. field_registry
  await knex.schema.createTable('field_registry', (table) => {
    table.string('id', 36).primary();
    table.string('field_key', 60).notNullable(); // not globally unique — same key can exist per module
    table.string('field_type', 20).notNullable();
    table.text('applicable_record_types').notNullable(); // JSON array string
    table.string('label_en', 120).notNullable();
    table.string('label_hi', 120).notNullable();
    table.text('options'); // JSON array [{value, label_en, label_hi}]
    table.text('validation_rules'); // JSON string
    table.text('visible_to_levels').notNullable(); // JSON array string
    table.text('editable_by_levels').notNullable(); // JSON array string
    table.string('introduced_at_level', 30).notNullable().defaultTo('PS');
    table.string('section', 60);
    table.integer('sort_order').defaultTo(0);
    table.boolean('full_width').defaultTo(false);
    table.text('show_when'); // JSON {field, value} — conditional visibility
    table.boolean('is_active').notNullable().defaultTo(true);
  });

  // 4. records
  await knex.schema.createTable('records', (table) => {
    table.string('id', 36).primary();
    table.string('record_type', 20).notNullable(); // 'ARREST'|'PCR'|'CASES'|'MISSING'
    table.string('ps_id', 36).notNullable().references('id').inTable('hierarchy_nodes');
    table.string('district_id', 36).notNullable().references('id').inTable('hierarchy_nodes');
    table.string('sub_div_id', 36).references('id').inTable('hierarchy_nodes');
    table.text('data').notNullable().defaultTo('{}'); // JSON string for values
    table.string('current_status', 30).notNullable().defaultTo('DRAFT');
    table.string('current_level', 20).notNullable().defaultTo('PS');
    table.date('record_date').notNullable();
    table.string('created_by', 36).notNullable().references('id').inTable('users');
    table.string('updated_by', 36).references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 5. record_revisions
  await knex.schema.createTable('record_revisions', (table) => {
    table.string('id', 36).primary();
    table.string('record_id', 36).notNullable().references('id').inTable('records').onDelete('CASCADE');
    table.integer('revision_number').notNullable();
    table.string('changed_by', 36).notNullable().references('id').inTable('users');
    table.timestamp('changed_at').defaultTo(knex.fn.now());
    table.string('level', 20).notNullable().defaultTo('PS');
    table.string('change_type', 30).notNullable(); // CREATE|UPDATE|STATUS_CHANGE|LEVEL_TRANSITION|HEAD_OVERRIDE
    table.text('field_changes').notNullable().defaultTo('[]'); // JSON string
    table.text('comment');
    table.text('reason'); // mandatory for DCP override
    table.string('ip_address', 45);
    table.string('prev_hash', 64);
    table.string('row_hash', 64);
  });

  // 6. workflow_transitions
  await knex.schema.createTable('workflow_transitions', (table) => {
    table.string('id', 36).primary();
    table.string('record_id', 36).notNullable().references('id').inTable('records').onDelete('CASCADE');
    table.string('from_level', 20);
    table.string('to_level', 20);
    table.string('from_status', 30);
    table.string('to_status', 30).notNullable();
    table.string('action', 30).notNullable(); // SUBMIT|APPROVE|SEND_BACK|CLOSE
    table.string('performed_by', 36).notNullable().references('id').inTable('users');
    table.timestamp('performed_at').defaultTo(knex.fn.now());
    table.text('comment');
    table.text('target_fields'); // JSON array string
  });

  // 7. compilations
  await knex.schema.createTable('compilations', (table) => {
    table.string('id', 36).primary();
    table.string('source_level', 20).notNullable();
    table.string('target_level', 20).notNullable();
    table.string('route', 30).notNullable(); // 'OPS_CHAIN' | 'DIRECT_HQ'
    table.date('period').notNullable();
    table.string('source_entity_id', 36).notNullable().references('id').inTable('hierarchy_nodes');
    table.string('status', 20).notNullable().defaultTo('DRAFT');
    table.text('record_ids').notNullable().defaultTo('[]'); // JSON array string
    table.text('compiled_summary'); // JSON string
    table.string('submitted_by', 36).references('id').inTable('users');
    table.timestamp('submitted_at');
  });

  // 8. compilation_records
  await knex.schema.createTable('compilation_records', (table) => {
    table.string('id', 36).primary();
    table.string('compilation_id', 36).notNullable().references('id').inTable('compilations').onDelete('CASCADE');
    table.string('record_id', 36).notNullable().references('id').inTable('records').onDelete('CASCADE');
    table.unique(['compilation_id', 'record_id']);
  });

  // 9. notifications
  await knex.schema.createTable('notifications', (table) => {
    table.string('id', 36).primary();
    table.string('title_en', 255).notNullable();
    table.string('title_hi', 255).notNullable();
    table.text('message_en');
    table.text('message_hi');
    table.string('user_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('record_id', 36).references('id').inTable('records').onDelete('SET NULL');
    table.boolean('is_read').notNullable().defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 10. report_templates
  await knex.schema.createTable('report_templates', (table) => {
    table.string('id', 36).primary();
    table.string('name_en', 255).notNullable();
    table.string('name_hi', 255).notNullable();
    table.text('applicable_record_types').notNullable(); // JSON array
    table.text('applicable_levels').notNullable(); // JSON array
    table.text('template_definition').notNullable(); // JSON string
    table.text('output_formats'); // JSON array DEFAULT '{PDF,EXCEL}'
    table.boolean('is_active').notNullable().defaultTo(true);
    table.string('created_by', 36).references('id').inTable('users');
  });

  // 11. report_jobs
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

  // 12. filter_presets
  await knex.schema.createTable('filter_presets', (table) => {
    table.string('id', 36).primary();
    table.string('name_en', 255).notNullable();
    table.string('name_hi', 255).notNullable();
    table.string('scope', 20).notNullable(); // 'SYSTEM'|'ROLE'|'USER'
    table.string('scope_id', 36); // role name or user UUID
    table.text('filter_spec').notNullable(); // JSON string
    table.text('applicable_record_types'); // JSON array
    table.string('created_by', 36).references('id').inTable('users');
  });

  // 13. custom_field_definitions
  await knex.schema.createTable('custom_field_definitions', (table) => {
    table.string('id', 36).primary();
    table.string('module', 20).notNullable(); // cases|arrests|pcr|missing
    table.string('field_key', 60).notNullable();
    table.string('field_label', 120).notNullable();
    table.string('field_type', 20).notNullable(); // text|long_text|number|date|dropdown
    table.text('options_json'); // JSON array
    table.boolean('is_required').defaultTo(false);
    table.string('scope_level', 20).notNullable(); // district|hq
    table.string('scope_id', 36).references('id').inTable('hierarchy_nodes').onDelete('CASCADE');
    table.boolean('is_active').defaultTo(true);
    table.string('created_by', 36).references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 14. custom_field_values
  await knex.schema.createTable('custom_field_values', (table) => {
    table.string('id', 36).primary();
    table.string('record_id', 36).notNullable().references('id').inTable('records').onDelete('CASCADE');
    table.string('record_type', 20).notNullable();
    table.string('field_definition_id', 36).notNullable().references('id').inTable('custom_field_definitions').onDelete('CASCADE');
    table.text('value_text');
    table.string('created_by', 36).references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 15. audit_logs (Standard log backup table)
  await knex.schema.createTable('audit_logs', (table) => {
    table.string('id', 36).primary();
    table.string('table_name', 40).notNullable();
    table.string('record_id', 36);
    table.string('action', 20).notNullable(); // CREATE|UPDATE|OVERRIDE|LOGIN|SUBMIT
    table.string('changed_by_id', 36).notNullable().references('id').inTable('users');
    table.string('changed_by_role', 20).notNullable();
    table.timestamp('changed_at').defaultTo(knex.fn.now());
    table.string('field_name', 60);
    table.text('old_value');
    table.text('new_value');
    table.text('reason');
    table.string('ip_address', 45);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('custom_field_values');
  await knex.schema.dropTableIfExists('custom_field_definitions');
  await knex.schema.dropTableIfExists('filter_presets');
  await knex.schema.dropTableIfExists('report_jobs');
  await knex.schema.dropTableIfExists('report_templates');
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('compilation_records');
  await knex.schema.dropTableIfExists('compilations');
  await knex.schema.dropTableIfExists('workflow_transitions');
  await knex.schema.dropTableIfExists('record_revisions');
  await knex.schema.dropTableIfExists('records');
  await knex.schema.dropTableIfExists('field_registry');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('hierarchy_nodes');
}
