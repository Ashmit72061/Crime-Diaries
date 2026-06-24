export async function up(knex) {
  const hasLinkTypeRegistry = await knex.schema.hasTable('link_type_registry');

  if (!hasLinkTypeRegistry) {
    await knex.schema.createTable('link_type_registry', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('code', 50).notNullable().unique();
      table.string('source_record_type', 20).notNullable();
      table.string('target_record_type', 20).notNullable();
      table.string('label_en', 120).notNullable();
      table.string('label_hi', 120).notNullable();
      table.string('cardinality', 20).notNullable().defaultTo('ONE_TO_MANY');
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    });

    await knex('link_type_registry').insert([
      { code: 'CASE_ARREST',  source_record_type: 'CASE', target_record_type: 'ARREST',   label_en: 'Case → Arrest',          label_hi: 'मामला → गिरफ्तारी',       is_active: true  },
      { code: 'CASE_MISSING', source_record_type: 'CASE', target_record_type: 'MISSING',   label_en: 'Case → Missing Person',  label_hi: 'मामला → लापता व्यक्ति',   is_active: false },
      { code: 'CASE_PCR',     source_record_type: 'CASE', target_record_type: 'PCR_CALL',  label_en: 'Case → PCR Call',        label_hi: 'मामला → पीसीआर कॉल',      is_active: false },
      { code: 'CASE_UIDB',    source_record_type: 'CASE', target_record_type: 'UIDB',      label_en: 'Case → UIDB Record',     label_hi: 'मामला → यूआईडीबी रिकॉर्ड', is_active: false },
    ]).onConflict('code').ignore();
  }

  const hasRecordLinks = await knex.schema.hasTable('record_links');

  if (!hasRecordLinks) {
    await knex.schema.createTable('record_links', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('link_type_id').notNullable()
        .references('id').inTable('link_type_registry').onDelete('RESTRICT');
      table.string('source_record_id', 36).notNullable()
        .references('id').inTable('records').onDelete('CASCADE');
      table.string('target_record_id', 36).notNullable()
        .references('id').inTable('records').onDelete('CASCADE');
      table.text('metadata').defaultTo('{}');
      table.string('created_by', 36).notNullable()
        .references('id').inTable('users');
      table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
      table.unique(['source_record_id', 'target_record_id', 'link_type_id'], { indexName: 'record_links_unique' });
    });

    await knex.raw(`
      ALTER TABLE record_links
      ADD CONSTRAINT record_links_no_self_link
      CHECK (source_record_id != target_record_id)
    `);
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_record_links_source      ON record_links (source_record_id)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_record_links_target      ON record_links (target_record_id)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_record_links_type_source ON record_links (link_type_id, source_record_id)');
  }
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('record_links');
  await knex.schema.dropTableIfExists('link_type_registry');
}
