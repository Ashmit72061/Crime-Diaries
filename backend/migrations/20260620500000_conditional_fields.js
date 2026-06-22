export async function up(knex) {
  // Update property_description and property_status to only show when local_head is a property-related crime
  const propertyCrimes = [
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

  const showWhenRule = JSON.stringify({
    field: 'local_head',
    value: propertyCrimes
  });

  // Update property_description (field_key: 'property_description')
  await knex('field_registry')
    .where({ field_key: 'property_description' })
    .update({
      show_when: showWhenRule
    });

  // Update property_status (field_key: 'property_status')
  await knex('field_registry')
    .where({ field_key: 'property_status' })
    .update({
      show_when: showWhenRule
    });
}

export async function down(knex) {
  // Clear show_when rules for property fields
  await knex('field_registry')
    .whereIn('field_key', ['property_description', 'property_status'])
    .update({
      show_when: null
    });
}
