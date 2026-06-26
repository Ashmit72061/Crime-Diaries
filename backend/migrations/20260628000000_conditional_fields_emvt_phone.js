// Wires up two conditional field patterns in field_registry:
//
// 1. Vehicle detail fields (vehicle_no, vehicle_type, vehicle_make, etc.)
//    now only appear when case_type is 'eMVT' or 'eTheft'.
//    Previously these had no show_when so they showed on every CASE form.
//
// 2. Phone fields (phone_make, phone_model, phone_imei, phone_color, phone_status)
//    are moved from the flat CASE form into the PROPERTY repeater entity.
//    They now appear only when property_major_category = 'Mobile Phone'.
//    A new property_phone_number field is also added.

import { v4 as uuidv4 } from 'uuid';

const L = JSON.stringify(['PS', 'DISTRICT', 'HQ']);
const E = JSON.stringify(['PS']);
const CASE_ARREST = JSON.stringify(['CASE', 'ARREST']);
const CASE_ONLY = JSON.stringify(['CASE']);

const VEHICLE_SHOW_WHEN = JSON.stringify({ field: 'case_type', value: ['eMVT', 'eTheft'] });
const PHONE_SHOW_WHEN   = JSON.stringify({ field: 'property_major_category', value: ['Mobile Phone'] });

export async function up(knex) {
  // ─── A. Add show_when to existing vehicle fields ─────────────────────────
  // These 4 fields already exist but show for every CASE. Restrict them to eMVT/eTheft.
  await knex('field_registry')
    .whereIn('field_key', ['vehicle_no', 'vehicle_type', 'cd_uploaded_24h', 'footage_collected'])
    .update({ show_when: VEHICLE_SHOW_WHEN });

  // ─── B. Insert new vehicle detail fields ──────────────────────────────────
  // These give officers the full vehicle profile for motor vehicle theft cases.
  const newVehicleFields = [
    {
      id: uuidv4(),
      field_key: 'vehicle_make',
      field_type: 'TEXT',
      applicable_record_types: CASE_ONLY,
      label_en: 'Vehicle Make / Manufacturer',
      label_hi: 'वाहन निर्माता / ब्रांड',
      visible_to_levels: L,
      editable_by_levels: E,
      section: 'vehicle_details',
      sort_order: 51.1,
      show_when: VEHICLE_SHOW_WHEN,
      is_active: true,
      scope_level: 'global',
    },
    {
      id: uuidv4(),
      field_key: 'vehicle_model',
      field_type: 'TEXT',
      applicable_record_types: CASE_ONLY,
      label_en: 'Vehicle Model',
      label_hi: 'वाहन मॉडल',
      visible_to_levels: L,
      editable_by_levels: E,
      section: 'vehicle_details',
      sort_order: 51.2,
      show_when: VEHICLE_SHOW_WHEN,
      is_active: true,
      scope_level: 'global',
    },
    {
      id: uuidv4(),
      field_key: 'vehicle_color',
      field_type: 'TEXT',
      applicable_record_types: CASE_ONLY,
      label_en: 'Vehicle Color',
      label_hi: 'वाहन का रंग',
      visible_to_levels: L,
      editable_by_levels: E,
      section: 'vehicle_details',
      sort_order: 51.3,
      show_when: VEHICLE_SHOW_WHEN,
      is_active: true,
      scope_level: 'global',
    },
    {
      id: uuidv4(),
      field_key: 'vehicle_chassis_no',
      field_type: 'TEXT',
      applicable_record_types: CASE_ONLY,
      label_en: 'Chassis Number',
      label_hi: 'चेसिस नंबर',
      visible_to_levels: L,
      editable_by_levels: E,
      section: 'vehicle_details',
      sort_order: 51.4,
      show_when: VEHICLE_SHOW_WHEN,
      is_active: true,
      scope_level: 'global',
    },
    {
      id: uuidv4(),
      field_key: 'vehicle_engine_no',
      field_type: 'TEXT',
      applicable_record_types: CASE_ONLY,
      label_en: 'Engine Number',
      label_hi: 'इंजन नंबर',
      visible_to_levels: L,
      editable_by_levels: E,
      section: 'vehicle_details',
      sort_order: 51.5,
      show_when: VEHICLE_SHOW_WHEN,
      is_active: true,
      scope_level: 'global',
    },
  ];

  for (const field of newVehicleFields) {
    const exists = await knex('field_registry').where({ field_key: field.field_key }).first();
    if (!exists) {
      await knex('field_registry').insert(field);
    }
  }

  // ─── C. Move existing phone fields into PROPERTY repeater ─────────────────
  // Previously: flat CASE form fields, triggered by local_head.
  // Now: inside the PROPERTY repeater, triggered by property_major_category.
  await knex('field_registry')
    .whereIn('field_key', ['phone_make', 'phone_model', 'phone_imei', 'phone_color', 'phone_status'])
    .update({
      repeater_entity: 'PROPERTY',
      applicable_record_types: CASE_ARREST,
      show_when: PHONE_SHOW_WHEN,
      section: 'property_details',
    });

  // ─── D. Insert new phone number field ─────────────────────────────────────
  const phoneNumberExists = await knex('field_registry').where({ field_key: 'property_phone_number' }).first();
  if (!phoneNumberExists) {
    await knex('field_registry').insert({
      id: uuidv4(),
      field_key: 'property_phone_number',
      field_type: 'TEXT',
      applicable_record_types: CASE_ARREST,
      label_en: 'Phone Number',
      label_hi: 'फोन नंबर',
      visible_to_levels: L,
      editable_by_levels: E,
      repeater_entity: 'PROPERTY',
      section: 'property_details',
      sort_order: 309,
      show_when: PHONE_SHOW_WHEN,
      is_active: true,
      scope_level: 'global',
    });
  }
}

export async function down(knex) {
  // Remove show_when from vehicle fields (restore to showing always)
  await knex('field_registry')
    .whereIn('field_key', ['vehicle_no', 'vehicle_type', 'cd_uploaded_24h', 'footage_collected'])
    .update({ show_when: null });

  // Remove new vehicle fields
  await knex('field_registry')
    .whereIn('field_key', ['vehicle_make', 'vehicle_model', 'vehicle_color', 'vehicle_chassis_no', 'vehicle_engine_no'])
    .delete();

  // Restore phone fields to flat CASE form (original state from 20260623000000)
  const originalPhoneShowWhen = JSON.stringify({ field: 'local_head', value: ['Mobile Theft', 'Snatching', 'Robbery'] });
  await knex('field_registry')
    .whereIn('field_key', ['phone_make', 'phone_model', 'phone_imei', 'phone_color', 'phone_status'])
    .update({
      repeater_entity: null,
      applicable_record_types: JSON.stringify(['CASE']),
      show_when: originalPhoneShowWhen,
      section: 'Property Details',
    });

  // Remove new phone number field
  await knex('field_registry').where({ field_key: 'property_phone_number' }).delete();
}
