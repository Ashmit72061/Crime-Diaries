// Adds a UNIQUE constraint on field_registry.field_key.
//
// Background: the original schema allowed duplicate field_keys (one row per
// record type per field). The new seed strategy consolidates shared fields into
// a single row with a combined applicable_record_types array, which requires
// field_key to be globally unique.
//
// We delete all rows here because the seed (01_fields.js) is now the canonical
// source for this table and will fully repopulate it on the next db:seed run.

export async function up(knex) {
  await knex('field_registry').delete();
  await knex.schema.alterTable('field_registry', (table) => {
    table.unique(['field_key']);
  });
}

export async function down(knex) {
  try {
    await knex.schema.alterTable('field_registry', (table) => {
      table.dropUnique(['field_key']);
    });
  } catch (e) {}
}
