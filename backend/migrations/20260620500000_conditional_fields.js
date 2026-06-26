export async function up(knex) {
  const hasShowWhen = await knex.schema.hasColumn('field_registry', 'show_when');
  if (!hasShowWhen) {
    await knex.schema.alterTable('field_registry', (table) => {
      table.jsonb('show_when').nullable();
    });
  }

  const propertyCrimes = [
    'Property',
    'Theft',
    'Robbery',
    'Burglary',
    'House Theft',
    'Other Theft',
    'Night Burglary',
    'Day Burglary',
    'Mobile Phone Theft',
    'Cycle Theft',
    'M.V. Theft',
    'Snatching'
  ];

  await knex('field_registry')
    .whereIn('field_key', ['property_description', 'property_status'])
    .update({
      show_when: JSON.stringify({ field: 'local_head', value: propertyCrimes })
    });
}

export async function down(knex) {
  await knex('field_registry')
    .whereIn('field_key', ['property_description', 'property_status'])
    .update({ show_when: null });

  try {
    // If show_when was added by this migration, drop it. Otherwise, ignore.
    const hasShowWhen = await knex.schema.hasColumn('field_registry', 'show_when');
    if (hasShowWhen) {
      // Actually, since show_when is in init_pharos.js, we don't drop it.
      // But we can let the try-catch run if the user rolls back.
    }
  } catch (e) {}
}
