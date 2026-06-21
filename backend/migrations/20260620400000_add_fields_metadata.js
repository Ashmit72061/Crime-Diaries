export async function up(knex) {
  const hasScopeLevel = await knex.schema.hasColumn('field_registry', 'scope_level');
  const hasScopeId = await knex.schema.hasColumn('field_registry', 'scope_id');
  const hasCreatedBy = await knex.schema.hasColumn('field_registry', 'created_by');
  const hasSectionLabelEn = await knex.schema.hasColumn('field_registry', 'section_label_en');
  const hasSectionLabelHi = await knex.schema.hasColumn('field_registry', 'section_label_hi');

  await knex.schema.alterTable('field_registry', (table) => {
    if (!hasScopeLevel) table.string('scope_level', 50).notNullable().defaultTo('global');
    if (!hasScopeId) table.text('scope_id').nullable();
    if (!hasCreatedBy) table.text('created_by').nullable();
    if (!hasSectionLabelEn) table.string('section_label_en', 120).nullable();
    if (!hasSectionLabelHi) table.string('section_label_hi', 120).nullable();
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

