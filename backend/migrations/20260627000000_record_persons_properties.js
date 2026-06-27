// Adds support for multiple persons and properties per record.
// - record_persons: one row per person (accused/victim/arrested/etc.) linked to a record
// - record_properties: one row per property item linked to a record
// - field_registry.repeater_entity: marks a field as belonging to a repeater sub-form

export async function up(knex) {
  // Add repeater_entity to field_registry
  const hasCol = await knex.schema.hasColumn('field_registry', 'repeater_entity');
  if (!hasCol) {
    await knex.schema.alterTable('field_registry', (table) => {
      table.string('repeater_entity', 50).nullable();
    });
  }

  // record_persons — one row per person entry
  const hasPersons = await knex.schema.hasTable('record_persons');
  if (!hasPersons) {
    await knex.schema.createTable('record_persons', (table) => {
      table.string('id', 36).primary();
      // records.id is string(36) — must match to satisfy FK constraint
      table.string('record_id', 36).notNullable()
        .references('id').inTable('records').onDelete('CASCADE');
      table.string('person_type', 30).notNullable(); // ACCUSED, VICTIM, ARRESTED, COMPLAINANT, MISSING, BODY
      // Extracted columns for fast SQL search
      table.string('first_name', 100).nullable();
      table.string('last_name', 100).nullable();
      table.string('mobile', 20).nullable();
      table.string('city', 100).nullable();
      table.string('district', 100).nullable();
      // Full person data (GIN indexed)
      table.jsonb('data').defaultTo('{}');
      table.integer('sort_order').defaultTo(0);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });

    await knex.raw('CREATE INDEX IF NOT EXISTS idx_record_persons_record_id ON record_persons(record_id)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_record_persons_type ON record_persons(record_id, person_type)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_record_persons_data_gin ON record_persons USING gin(data)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_record_persons_first_name ON record_persons(first_name)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_record_persons_mobile ON record_persons(mobile)');
  }

  // record_properties — one row per property item
  const hasProperties = await knex.schema.hasTable('record_properties');
  if (!hasProperties) {
    await knex.schema.createTable('record_properties', (table) => {
      table.string('id', 36).primary();
      table.string('record_id', 36).notNullable()
        .references('id').inTable('records').onDelete('CASCADE');
      table.string('major_category', 50).nullable();
      table.string('minor_category', 100).nullable();
      table.string('status', 20).defaultTo('Stolen'); // Stolen, Recovered, Seized
      table.text('details').nullable();
      table.integer('sort_order').defaultTo(0);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });

    await knex.raw('CREATE INDEX IF NOT EXISTS idx_record_properties_record_id ON record_properties(record_id)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_record_properties_category ON record_properties(major_category)');
  }
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('record_properties');
  await knex.schema.dropTableIfExists('record_persons');
  const hasCol = await knex.schema.hasColumn('field_registry', 'repeater_entity');
  if (hasCol) {
    await knex.schema.alterTable('field_registry', (table) => {
      table.dropColumn('repeater_entity');
    });
  }
}
