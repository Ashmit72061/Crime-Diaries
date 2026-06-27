export const up = async (knex) => {
  await knex('field_registry')
    .where({ field_key: 'transfer_to' })
    .whereRaw(`applicable_record_types::text LIKE '%CASE%'`)
    .update({ section: 'general_info', sort_order: 334 });

  await knex('field_registry')
    .where({ field_key: 'rc_no' })
    .whereRaw(`applicable_record_types::text LIKE '%CASE%'`)
    .update({ section: 'general_info', sort_order: 335 });

  await knex('field_registry')
    .where({ field_key: 'disposal_type' })
    .whereRaw(`applicable_record_types::text LIKE '%CASE%'`)
    .update({ section: 'general_info', sort_order: 336 });
};

export const down = async (knex) => {
  await knex('field_registry')
    .where({ field_key: 'transfer_to' })
    .whereRaw(`applicable_record_types::text LIKE '%CASE%'`)
    .update({ section: 'investigation_details', sort_order: 61 });

  await knex('field_registry')
    .where({ field_key: 'rc_no' })
    .whereRaw(`applicable_record_types::text LIKE '%CASE%'`)
    .update({ section: 'investigation_details', sort_order: 62 });

  await knex('field_registry')
    .where({ field_key: 'disposal_type' })
    .whereRaw(`applicable_record_types::text LIKE '%CASE%'`)
    .update({ section: 'investigation_details', sort_order: 63 });
};
