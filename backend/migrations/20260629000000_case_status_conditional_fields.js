import { v4 as uuidv4 } from 'uuid';

/**
 * Migration: Case status conditional fields
 *
 * When status = "Charge Sheet" → show rc_no, disposal_type
 * When status = "Transfer"     → show transfer_to (new field)
 * All other statuses           → hide all three fields
 */
export const up = async (knex) => {
  // Update show_when on rc_no
  await knex('field_registry')
    .where({ field_key: 'rc_no' })
    .whereRaw(`applicable_record_types::text LIKE '%CASE%'`)
    .update({
      show_when: JSON.stringify({ field: 'status', value: 'Charge Sheet' }),
    });

  // Update show_when on disposal_type
  await knex('field_registry')
    .where({ field_key: 'disposal_type' })
    .whereRaw(`applicable_record_types::text LIKE '%CASE%'`)
    .update({
      show_when: JSON.stringify({ field: 'status', value: 'Charge Sheet' }),
    });

  // Insert transfer_to field if it doesn't exist
  const existing = await knex('field_registry')
    .where({ field_key: 'transfer_to' })
    .whereRaw(`applicable_record_types::text LIKE '%CASE%'`)
    .first();

  if (!existing) {
    await knex('field_registry').insert({
      id: uuidv4(),
      field_key: 'transfer_to',
      label_en: 'Transfer To',
      label_hi: 'स्थानांतरण करें',
      field_type: 'SELECT',
      section: 'investigation_details',
      applicable_record_types: JSON.stringify(['CASE']),
      options: JSON.stringify([
        'Court',
        'CBI (Central Bureau of Investigation)',
        'EOW (Economic Offences Wing)',
        'ACB (Anti-Corruption Bureau)',
        'NIA (National Investigation Agency)',
        'ED (Enforcement Directorate)',
        'NCB (Narcotics Control Bureau)',
        'STF (Special Task Force)',
        'SIT (Special Investigation Team)',
        'Other Investigative Agency',
      ]),
      show_when: JSON.stringify({ field: 'status', value: 'Transfer' }),
      sort_order: 61,
      is_active: true,
      visible_to_levels: JSON.stringify(['PS', 'DISTRICT', 'HQ']),
      editable_by_levels: JSON.stringify(['PS']),
      introduced_at_level: 'PS',
      scope_level: 'global',
      full_width: false,
      readonly: false,
    });

    // Bump rc_no and disposal_type sort_order to make room
    await knex('field_registry')
      .where({ field_key: 'rc_no' })
      .whereRaw(`applicable_record_types::text LIKE '%CASE%'`)
      .update({ sort_order: 62 });

    await knex('field_registry')
      .where({ field_key: 'disposal_type' })
      .whereRaw(`applicable_record_types::text LIKE '%CASE%'`)
      .update({ sort_order: 63 });
  }
};

export const down = async (knex) => {
  // Remove show_when from rc_no and disposal_type
  await knex('field_registry')
    .where({ field_key: 'rc_no' })
    .whereRaw(`applicable_record_types::text LIKE '%CASE%'`)
    .update({ show_when: null });

  await knex('field_registry')
    .where({ field_key: 'disposal_type' })
    .whereRaw(`applicable_record_types::text LIKE '%CASE%'`)
    .update({ show_when: null });

  // Remove transfer_to field
  await knex('field_registry')
    .where({ field_key: 'transfer_to' })
    .whereRaw(`applicable_record_types::text LIKE '%CASE%'`)
    .delete();
};
