export const up = async (knex) => {
  const updates = [
    { field_key: 'property_phone_number', sort_order: 338 },
    { field_key: 'phone_make',            sort_order: 339 },
    { field_key: 'phone_model',           sort_order: 340 },
    { field_key: 'phone_imei',            sort_order: 341 },
    { field_key: 'phone_color',           sort_order: 342 },
    { field_key: 'phone_status',          sort_order: 343 },
  ];
  for (const { field_key, sort_order } of updates) {
    await knex('field_registry').where({ field_key }).update({ sort_order });
  }
};

export const down = async (knex) => {
  const updates = [
    { field_key: 'property_phone_number', sort_order: 309 },
    { field_key: 'phone_make',            sort_order: 310 },
    { field_key: 'phone_model',           sort_order: 311 },
    { field_key: 'phone_imei',            sort_order: 312 },
    { field_key: 'phone_color',           sort_order: 313 },
    { field_key: 'phone_status',          sort_order: 314 },
  ];
  for (const { field_key, sort_order } of updates) {
    await knex('field_registry').where({ field_key }).update({ sort_order });
  }
};
