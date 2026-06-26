import { v4 as uuidv4 } from 'uuid';

const PHONE_FIELDS = [
  {
    field_key: 'phone_make',
    field_type: 'TEXT',
    label_en: 'Phone Make / Brand',
    label_hi: 'फोन का ब्रांड',
    section: 'Property Details',
    sort_order: 310,
    show_when: { field: 'local_head', value: ['Mobile Theft', 'Snatching', 'Robbery'] },
  },
  {
    field_key: 'phone_model',
    field_type: 'TEXT',
    label_en: 'Phone Model',
    label_hi: 'फोन का मॉडल',
    section: 'Property Details',
    sort_order: 311,
    show_when: { field: 'local_head', value: ['Mobile Theft', 'Snatching', 'Robbery'] },
  },
  {
    field_key: 'phone_imei',
    field_type: 'TEXT',
    label_en: 'IMEI Number',
    label_hi: 'आईएमईआई नंबर',
    section: 'Property Details',
    sort_order: 312,
    show_when: { field: 'local_head', value: ['Mobile Theft', 'Snatching', 'Robbery'] },
  },
  {
    field_key: 'phone_color',
    field_type: 'TEXT',
    label_en: 'Phone Color',
    label_hi: 'फोन का रंग',
    section: 'Property Details',
    sort_order: 313,
    show_when: { field: 'local_head', value: ['Mobile Theft', 'Snatching', 'Robbery'] },
  },
  {
    field_key: 'phone_status',
    field_type: 'SELECT',
    label_en: 'Phone Recovery Status',
    label_hi: 'फोन बरामदगी स्थिति',
    section: 'Property Details',
    sort_order: 314,
    options: [
      { value: 'NOT_RECOVERED', label_en: 'Not Recovered', label_hi: 'बरामद नहीं' },
      { value: 'RECOVERED',     label_en: 'Recovered',     label_hi: 'बरामद' },
      { value: 'PARTIAL',       label_en: 'Partially Recovered', label_hi: 'आंशिक रूप से बरामद' },
    ],
    show_when: { field: 'local_head', value: ['Mobile Theft', 'Snatching', 'Robbery'] },
  },
];

export async function up(knex) {
  for (const f of PHONE_FIELDS) {
    const exists = await knex('field_registry').where({ field_key: f.field_key }).first();
    if (!exists) {
      await knex('field_registry').insert({
        id: uuidv4(),
        field_key: f.field_key,
        field_type: f.field_type,
        label_en: f.label_en,
        label_hi: f.label_hi,
        applicable_record_types: ['CASE'],
        section: f.section,
        sort_order: f.sort_order,
        options: f.options ? JSON.stringify(f.options) : null,
        show_when: JSON.stringify(f.show_when),
        is_active: true,
        scope_level: 'global',
        visible_to_levels: ['PS', 'DISTRICT', 'HQ'],
        editable_by_levels: ['PS'],
      });
    }
  }
}

export async function down(knex) {
  await knex('field_registry')
    .whereIn('field_key', PHONE_FIELDS.map(f => f.field_key))
    .delete();
}
