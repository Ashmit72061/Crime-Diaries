export async function up(knex) {
  const hasShowWhen = await knex.schema.hasColumn('field_registry', 'show_when');
  if (!hasShowWhen) {
    await knex.schema.alterTable('field_registry', (table) => {
      table.jsonb('show_when').nullable();
    });
  }

  // Set show_when for fields that should only appear when property is involved
  await knex('field_registry')
    .whereIn('field_key', ['property_description', 'property_status'])
    .update({
      show_when: JSON.stringify({ field: 'local_head', value: ['Property', 'Theft', 'House Theft', 'Robbery', 'Snatching'] }),
    });
}

export async function down(knex) {
  await knex('field_registry')
    .whereIn('field_key', ['property_description', 'property_status'])
    .update({ show_when: null });

  try {
    await knex.schema.alterTable('field_registry', (table) => {
      table.dropColumn('show_when');
    });
  } catch (e) {}
}
