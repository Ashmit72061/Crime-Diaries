export async function up(knex) {
  await knex.schema.alterTable('field_registry', (table) => {
    table.string('scope_level', 50).notNullable().defaultTo('global');
    table.text('scope_id').nullable();
    table.text('created_by').nullable();
    table.string('section_label_en', 120).nullable();
    table.string('section_label_hi', 120).nullable();
  });
}

export async function down(knex) {
  try {
    await knex.schema.alterTable('field_registry', (table) => {
      table.dropColumn('section_label_hi');
      table.dropColumn('section_label_en');
      table.dropColumn('created_by');
      table.dropColumn('scope_id');
      table.dropColumn('scope_level');
    });
  } catch(e) {}
}
