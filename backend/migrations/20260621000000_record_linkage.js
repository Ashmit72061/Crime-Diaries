export async function up(knex) {
  // Create link_type_registry
  await knex.schema.createTable('link_type_registry', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('code', 50).unique().notNullable();
    table.string('source_record_type', 30).notNullable();
    table.string('target_record_type', 30).notNullable();
    table.string('label_en', 150).notNullable();
    table.string('label_hi', 150).notNullable();
    table.string('cardinality', 30).defaultTo('ONE_TO_MANY');
    table.boolean('is_active').defaultTo(true);
  });

  // Create record_links
  await knex.schema.createTable('record_links', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('link_type_id').references('id').inTable('link_type_registry').onDelete('CASCADE');
    table.string('source_record_id', 36).references('id').inTable('records').onDelete('CASCADE');
    table.string('target_record_id', 36).references('id').inTable('records').onDelete('CASCADE');
    table.text('metadata').defaultTo('{}');
    table.string('created_by', 36).references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.unique(['source_record_id', 'target_record_id', 'link_type_id']);
  });

  // Add constraint for source != target
  await knex.raw('ALTER TABLE record_links ADD CONSTRAINT chk_source_not_equal_target CHECK (source_record_id != target_record_id)');

  // Seed default link types
  await knex('link_type_registry').insert([
    {
      code: 'CASE_ARREST',
      source_record_type: 'CASE',
      target_record_type: 'ARREST',
      label_en: 'Case → Arrest',
      label_hi: 'मामला → गिरफ्तारी',
      cardinality: 'ONE_TO_MANY',
      is_active: true
    },
    {
      code: 'CASE_MISSING',
      source_record_type: 'CASE',
      target_record_type: 'MISSING',
      label_en: 'Case → Missing Person',
      label_hi: 'मामला → गुमशुदा व्यक्ति',
      cardinality: 'ONE_TO_MANY',
      is_active: false
    },
    {
      code: 'CASE_PCR',
      source_record_type: 'CASE',
      target_record_type: 'PCR_CALL',
      label_en: 'Case → PCR Call',
      label_hi: 'मामला → पीसीआर कॉल',
      cardinality: 'ONE_TO_MANY',
      is_active: false
    },
    {
      code: 'CASE_UIDB',
      source_record_type: 'CASE',
      target_record_type: 'UIDB',
      label_en: 'Case → UIDB',
      label_hi: 'मामला → यूआईडीबी',
      cardinality: 'ONE_TO_MANY',
      is_active: false
    }
  ]);
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('record_links');
  await knex.schema.dropTableIfExists('link_type_registry');
}
