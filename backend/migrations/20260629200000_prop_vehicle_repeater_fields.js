import { v4 as uuidv4 } from 'uuid';

const COMMON = {
  applicable_record_types: JSON.stringify(['CASE', 'ARREST']),
  visible_to_levels: JSON.stringify(['PS', 'DISTRICT', 'HQ']),
  editable_by_levels: JSON.stringify(['PS']),
  introduced_at_level: 'PS',
  section: 'property_details',
  repeater_entity: 'PROPERTY',
  scope_level: 'global',
  is_active: true,
  full_width: false,
  readonly: false,
};

// show_when: property_major_category = "Vehicle" (any status)
const SHOW_VEHICLE = JSON.stringify({ field: 'property_major_category', value: ['Vehicle'] });

// show_when: property_major_category = "Vehicle" AND property_stolen_recovered = "Stolen"
const SHOW_VEHICLE_STOLEN = JSON.stringify({
  and: [
    { field: 'property_major_category', value: ['Vehicle'] },
    { field: 'property_stolen_recovered', value: ['Stolen'] },
  ],
});

const VEHICLE_TYPE_OPTIONS = JSON.stringify([
  { value: 'Car',        label_en: 'Car',           label_hi: 'कार' },
  { value: 'Motorcycle', label_en: 'Motorcycle',    label_hi: 'मोटरसाइकिल' },
  { value: 'Scooter',    label_en: 'Scooter',       label_hi: 'स्कूटर' },
  { value: 'E-Rickshaw', label_en: 'E-Rickshaw',    label_hi: 'ई-रिक्शा' },
  { value: 'Auto',       label_en: 'Auto Rickshaw',  label_hi: 'ऑटो रिक्शा' },
  { value: 'Tempo',      label_en: 'Tempo / Truck',  label_hi: 'टेम्पो / ट्रक' },
  { value: 'Cycle',      label_en: 'Bicycle',        label_hi: 'साइकिल' },
  { value: 'Other',      label_en: 'Other',          label_hi: 'अन्य' },
]);

const YES_NO = JSON.stringify([
  { value: 'Yes', label_en: 'Yes', label_hi: 'हाँ' },
  { value: 'No',  label_en: 'No',  label_hi: 'नहीं' },
]);

export const up = async (knex) => {
  const fields = [
    {
      id: uuidv4(),
      field_key: 'prop_vehicle_no',
      label_en: 'Vehicle Registration No.',
      label_hi: 'वाहन पंजीकरण संख्या',
      field_type: 'TEXT',
      show_when: SHOW_VEHICLE,
      sort_order: 334,
    },
    {
      id: uuidv4(),
      field_key: 'prop_vehicle_type',
      label_en: 'Vehicle Type',
      label_hi: 'वाहन का प्रकार',
      field_type: 'SELECT',
      options: VEHICLE_TYPE_OPTIONS,
      show_when: SHOW_VEHICLE,
      sort_order: 335,
    },
    {
      id: uuidv4(),
      field_key: 'prop_cd_24h',
      label_en: '1st CD Uploaded Within 24 Hours',
      label_hi: 'पहली सीडी 24 घंटे में अपलोड की गई',
      field_type: 'SELECT',
      options: YES_NO,
      show_when: SHOW_VEHICLE_STOLEN,
      sort_order: 336,
    },
    {
      id: uuidv4(),
      field_key: 'prop_cctv',
      label_en: 'CCTV Footage Collected',
      label_hi: 'सीसीटीवी फुटेज एकत्र किया गया',
      field_type: 'SELECT',
      options: YES_NO,
      show_when: SHOW_VEHICLE_STOLEN,
      sort_order: 337,
    },
  ];

  for (const field of fields) {
    const exists = await knex('field_registry').where({ field_key: field.field_key }).first();
    if (!exists) {
      await knex('field_registry').insert({ ...COMMON, ...field });
    }
  }
};

export const down = async (knex) => {
  await knex('field_registry')
    .whereIn('field_key', ['prop_vehicle_no', 'prop_vehicle_type', 'prop_cd_24h', 'prop_cctv'])
    .delete();
};
