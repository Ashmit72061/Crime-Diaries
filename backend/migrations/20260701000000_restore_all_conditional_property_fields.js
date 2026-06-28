/**
 * Restoration migration — re-applies all conditional field config that the
 * dev5/frontend seed (seeds/01_fields.js) wiped after migrations 20260629xxx ran.
 *
 * Idempotent: all inserts check for existence first; updates are safe to re-run.
 */
import { v4 as uuidv4 } from 'uuid';

// ─── Shared column defaults for PROPERTY repeater fields ────────────────────
const PROP_COMMON = {
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
  validation_rules: null,
  options: null,
};

const YES_NO = JSON.stringify([
  { value: 'Yes', label_en: 'Yes', label_hi: 'हाँ' },
  { value: 'No',  label_en: 'No',  label_hi: 'नहीं' },
]);

// show_when helpers
const sw = (cat) => JSON.stringify({ field: 'property_major_category', value: [cat] });
const SHOW_VEHICLE = sw('Vehicle');
const SHOW_VEHICLE_STOLEN = JSON.stringify({
  and: [
    { field: 'property_major_category', value: ['Vehicle'] },
    { field: 'property_stolen_recovered', value: ['Stolen'] },
  ],
});

// ─── All new PROPERTY repeater fields to insert ──────────────────────────────
const VEHICLE_FIELDS = [
  {
    field_key: 'prop_vehicle_no',
    label_en: 'Vehicle Registration No.',
    label_hi: 'वाहन पंजीकरण संख्या',
    field_type: 'TEXT',
    show_when: SHOW_VEHICLE,
    sort_order: 334,
  },
  {
    field_key: 'prop_vehicle_type',
    label_en: 'Vehicle Type',
    label_hi: 'वाहन का प्रकार',
    field_type: 'SELECT',
    options: JSON.stringify([
      { value: 'Car',        label_en: 'Car',            label_hi: 'कार' },
      { value: 'Motorcycle', label_en: 'Motorcycle',     label_hi: 'मोटरसाइकिल' },
      { value: 'Scooter',    label_en: 'Scooter',        label_hi: 'स्कूटर' },
      { value: 'E-Rickshaw', label_en: 'E-Rickshaw',     label_hi: 'ई-रिक्शा' },
      { value: 'Auto',       label_en: 'Auto Rickshaw',  label_hi: 'ऑटो रिक्शा' },
      { value: 'Tempo',      label_en: 'Tempo / Truck',  label_hi: 'टेम्पो / ट्रक' },
      { value: 'Cycle',      label_en: 'Bicycle',        label_hi: 'साइकिल' },
      { value: 'Other',      label_en: 'Other',          label_hi: 'अन्य' },
    ]),
    show_when: SHOW_VEHICLE,
    sort_order: 335,
  },
  {
    field_key: 'prop_cd_24h',
    label_en: '1st CD Uploaded Within 24 Hours',
    label_hi: 'पहली सीडी 24 घंटे में अपलोड की गई',
    field_type: 'SELECT',
    options: YES_NO,
    show_when: SHOW_VEHICLE_STOLEN,
    sort_order: 336,
  },
  {
    field_key: 'prop_cctv',
    label_en: 'CCTV Footage Collected',
    label_hi: 'सीसीटीवी फुटेज एकत्र किया गया',
    field_type: 'SELECT',
    options: YES_NO,
    show_when: SHOW_VEHICLE_STOLEN,
    sort_order: 337,
  },
];

const CATEGORY_FIELDS = [
  // ── Cash ──────────────────────────────────────────────────────────────────
  {
    field_key: 'prop_cash_amount',
    label_en: 'Amount (₹)',
    label_hi: 'राशि (₹)',
    field_type: 'NUMBER',
    show_when: sw('Cash'),
    sort_order: 344,
  },
  {
    field_key: 'prop_cash_currency',
    label_en: 'Currency Type',
    label_hi: 'मुद्रा प्रकार',
    field_type: 'SELECT',
    options: JSON.stringify([
      { value: 'INR',   label_en: 'Indian Rupee (INR)',   label_hi: 'भारतीय रुपया (INR)' },
      { value: 'USD',   label_en: 'US Dollar (USD)',      label_hi: 'अमेरिकी डॉलर (USD)' },
      { value: 'EUR',   label_en: 'Euro (EUR)',           label_hi: 'यूरो (EUR)' },
      { value: 'GBP',   label_en: 'British Pound (GBP)', label_hi: 'ब्रिटिश पाउंड (GBP)' },
      { value: 'Other', label_en: 'Other',               label_hi: 'अन्य' },
    ]),
    show_when: sw('Cash'),
    sort_order: 345,
  },
  {
    field_key: 'prop_cash_denomination',
    label_en: 'Denomination Details',
    label_hi: 'मूल्यवर्ग विवरण',
    field_type: 'TEXT',
    show_when: sw('Cash'),
    sort_order: 346,
  },

  // ── Jewellery ─────────────────────────────────────────────────────────────
  {
    field_key: 'prop_gold_item_type',
    label_en: 'Item Type',
    label_hi: 'वस्तु प्रकार',
    field_type: 'SELECT',
    options: JSON.stringify([
      { value: 'Ring',     label_en: 'Ring',     label_hi: 'अंगूठी' },
      { value: 'Necklace', label_en: 'Necklace', label_hi: 'हार' },
      { value: 'Bracelet', label_en: 'Bracelet', label_hi: 'कड़ा / ब्रेसलेट' },
      { value: 'Chain',    label_en: 'Chain',    label_hi: 'चेन' },
      { value: 'Earring',  label_en: 'Earring',  label_hi: 'कान की बाली' },
      { value: 'Bangles',  label_en: 'Bangles',  label_hi: 'चूड़ियाँ' },
      { value: 'Watch',    label_en: 'Watch',    label_hi: 'घड़ी' },
      { value: 'Other',    label_en: 'Other',    label_hi: 'अन्य' },
    ]),
    show_when: sw('Jewellery'),
    sort_order: 344,
  },
  {
    field_key: 'prop_gold_material',
    label_en: 'Material',
    label_hi: 'सामग्री',
    field_type: 'SELECT',
    options: JSON.stringify([
      { value: 'Gold',     label_en: 'Gold',     label_hi: 'सोना' },
      { value: 'Silver',   label_en: 'Silver',   label_hi: 'चाँदी' },
      { value: 'Diamond',  label_en: 'Diamond',  label_hi: 'हीरा' },
      { value: 'Platinum', label_en: 'Platinum', label_hi: 'प्लैटिनम' },
      { value: 'Mixed',    label_en: 'Mixed',    label_hi: 'मिश्रित' },
      { value: 'Other',    label_en: 'Other',    label_hi: 'अन्य' },
    ]),
    show_when: sw('Jewellery'),
    sort_order: 345,
  },
  {
    field_key: 'prop_gold_weight',
    label_en: 'Weight (grams)',
    label_hi: 'वज़न (ग्राम)',
    field_type: 'TEXT',
    show_when: sw('Jewellery'),
    sort_order: 346,
  },
  {
    field_key: 'prop_gold_value',
    label_en: 'Estimated Value (₹)',
    label_hi: 'अनुमानित मूल्य (₹)',
    field_type: 'NUMBER',
    show_when: sw('Jewellery'),
    sort_order: 347,
  },

  // ── Electronics ───────────────────────────────────────────────────────────
  {
    field_key: 'prop_elec_device_type',
    label_en: 'Device Type',
    label_hi: 'उपकरण प्रकार',
    field_type: 'SELECT',
    options: JSON.stringify([
      { value: 'Laptop',         label_en: 'Laptop',          label_hi: 'लैपटॉप' },
      { value: 'Tablet',         label_en: 'Tablet',          label_hi: 'टैबलेट' },
      { value: 'Smart TV',       label_en: 'Smart TV',        label_hi: 'स्मार्ट टीवी' },
      { value: 'Camera',         label_en: 'Camera',          label_hi: 'कैमरा' },
      { value: 'Speaker',        label_en: 'Speaker',         label_hi: 'स्पीकर' },
      { value: 'Headphones',     label_en: 'Headphones',      label_hi: 'हेडफोन' },
      { value: 'Gaming Console', label_en: 'Gaming Console',  label_hi: 'गेमिंग कंसोल' },
      { value: 'Other',          label_en: 'Other',           label_hi: 'अन्य' },
    ]),
    show_when: sw('Electronics'),
    sort_order: 344,
  },
  {
    field_key: 'prop_elec_brand',
    label_en: 'Make / Brand',
    label_hi: 'निर्माता / ब्रांड',
    field_type: 'TEXT',
    show_when: sw('Electronics'),
    sort_order: 345,
  },
  {
    field_key: 'prop_elec_model',
    label_en: 'Model',
    label_hi: 'मॉडल',
    field_type: 'TEXT',
    show_when: sw('Electronics'),
    sort_order: 346,
  },
  {
    field_key: 'prop_elec_serial',
    label_en: 'Serial Number',
    label_hi: 'क्रमांक',
    field_type: 'TEXT',
    show_when: sw('Electronics'),
    sort_order: 347,
  },
  {
    field_key: 'prop_elec_value',
    label_en: 'Estimated Value (₹)',
    label_hi: 'अनुमानित मूल्य (₹)',
    field_type: 'NUMBER',
    show_when: sw('Electronics'),
    sort_order: 348,
  },

  // ── Documents ─────────────────────────────────────────────────────────────
  {
    field_key: 'prop_doc_type',
    label_en: 'Document Type',
    label_hi: 'दस्तावेज़ प्रकार',
    field_type: 'SELECT',
    options: JSON.stringify([
      { value: 'Passport',        label_en: 'Passport',        label_hi: 'पासपोर्ट' },
      { value: 'Aadhar Card',     label_en: 'Aadhar Card',     label_hi: 'आधार कार्ड' },
      { value: 'PAN Card',        label_en: 'PAN Card',        label_hi: 'पैन कार्ड' },
      { value: 'Driving License', label_en: 'Driving License', label_hi: 'ड्राइविंग लाइसेंस' },
      { value: 'Voter ID',        label_en: 'Voter ID',        label_hi: 'मतदाता पहचान पत्र' },
      { value: 'Ration Card',     label_en: 'Ration Card',     label_hi: 'राशन कार्ड' },
      { value: 'Bank Passbook',   label_en: 'Bank Passbook',   label_hi: 'बैंक पासबुक' },
      { value: 'Cheque Book',     label_en: 'Cheque Book',     label_hi: 'चेक बुक' },
      { value: 'Other',           label_en: 'Other',           label_hi: 'अन्य' },
    ]),
    show_when: sw('Documents'),
    sort_order: 344,
  },
  {
    field_key: 'prop_doc_number',
    label_en: 'Document Number',
    label_hi: 'दस्तावेज़ संख्या',
    field_type: 'TEXT',
    show_when: sw('Documents'),
    sort_order: 345,
  },
  {
    field_key: 'prop_doc_holder',
    label_en: 'Document Holder Name',
    label_hi: 'दस्तावेज़ धारक का नाम',
    field_type: 'TEXT',
    show_when: sw('Documents'),
    sort_order: 346,
  },
  {
    field_key: 'prop_doc_issuing_auth',
    label_en: 'Issuing Authority',
    label_hi: 'जारीकर्ता प्राधिकरण',
    field_type: 'TEXT',
    show_when: sw('Documents'),
    sort_order: 347,
  },

  // ── Drugs ─────────────────────────────────────────────────────────────────
  {
    field_key: 'prop_drug_type',
    label_en: 'Drug / Substance Type',
    label_hi: 'नशीला पदार्थ प्रकार',
    field_type: 'SELECT',
    options: JSON.stringify([
      { value: 'Heroin/Smack',       label_en: 'Heroin / Smack',            label_hi: 'हेरोइन / स्मैक' },
      { value: 'Cannabis/Ganja',     label_en: 'Cannabis / Ganja / Charas', label_hi: 'गांजा / चरस' },
      { value: 'Cocaine',            label_en: 'Cocaine',                   label_hi: 'कोकीन' },
      { value: 'Methamphetamine',    label_en: 'Methamphetamine / Ice',     label_hi: 'मेथैम्फेटामाइन' },
      { value: 'Opium/Afim',        label_en: 'Opium / Afim',             label_hi: 'अफ़ीम' },
      { value: 'Tablets/Pills',      label_en: 'Tablets / Pills',           label_hi: 'गोलियाँ' },
      { value: 'Chemical Precursor', label_en: 'Chemical Precursor',        label_hi: 'रासायनिक अग्रदूत' },
      { value: 'Other',              label_en: 'Other',                     label_hi: 'अन्य' },
    ]),
    show_when: sw('Drugs'),
    sort_order: 344,
  },
  {
    field_key: 'prop_drug_quantity',
    label_en: 'Quantity',
    label_hi: 'मात्रा',
    field_type: 'TEXT',
    show_when: sw('Drugs'),
    sort_order: 345,
  },
  {
    field_key: 'prop_drug_unit',
    label_en: 'Unit',
    label_hi: 'इकाई',
    field_type: 'SELECT',
    options: JSON.stringify([
      { value: 'grams',   label_en: 'Grams',          label_hi: 'ग्राम' },
      { value: 'kg',      label_en: 'Kilograms',      label_hi: 'किलोग्राम' },
      { value: 'ml',      label_en: 'Millilitres',    label_hi: 'मिलीलीटर' },
      { value: 'litres',  label_en: 'Litres',         label_hi: 'लीटर' },
      { value: 'tablets', label_en: 'Tablets / Pills', label_hi: 'गोलियाँ' },
      { value: 'packets', label_en: 'Packets',        label_hi: 'पैकेट' },
      { value: 'sachets', label_en: 'Sachets',        label_hi: 'पाउच / सैशे' },
    ]),
    show_when: sw('Drugs'),
    sort_order: 346,
  },
  {
    field_key: 'prop_drug_value',
    label_en: 'Estimated Street Value (₹)',
    label_hi: 'अनुमानित बाज़ार मूल्य (₹)',
    field_type: 'NUMBER',
    show_when: sw('Drugs'),
    sort_order: 347,
  },

  // ── Arms ──────────────────────────────────────────────────────────────────
  {
    field_key: 'prop_arms_type',
    label_en: 'Weapon Type',
    label_hi: 'हथियार प्रकार',
    field_type: 'SELECT',
    options: JSON.stringify([
      { value: 'Pistol',           label_en: 'Pistol',             label_hi: 'पिस्तौल' },
      { value: 'Revolver',         label_en: 'Revolver',           label_hi: 'रिवॉल्वर' },
      { value: 'Rifle',            label_en: 'Rifle',              label_hi: 'राइफ़ल' },
      { value: 'Country-made gun', label_en: 'Country-made Firearm', label_hi: 'देशी कट्टा' },
      { value: 'Knife',            label_en: 'Knife',              label_hi: 'चाकू' },
      { value: 'Sword/Machete',    label_en: 'Sword / Machete',    label_hi: 'तलवार / मचेटे' },
      { value: 'Other',            label_en: 'Other',              label_hi: 'अन्य' },
    ]),
    show_when: sw('Arms'),
    sort_order: 344,
  },
  {
    field_key: 'prop_arms_make',
    label_en: 'Make / Manufacturer',
    label_hi: 'निर्माता',
    field_type: 'TEXT',
    show_when: sw('Arms'),
    sort_order: 345,
  },
  {
    field_key: 'prop_arms_serial',
    label_en: 'Serial Number',
    label_hi: 'क्रमांक',
    field_type: 'TEXT',
    show_when: sw('Arms'),
    sort_order: 346,
  },
  {
    field_key: 'prop_arms_ammo_count',
    label_en: 'Ammunition Count',
    label_hi: 'गोला-बारूद संख्या',
    field_type: 'TEXT',
    show_when: sw('Arms'),
    sort_order: 347,
  },
  {
    field_key: 'prop_arms_license',
    label_en: 'License Number',
    label_hi: 'लाइसेंस संख्या',
    field_type: 'TEXT',
    show_when: sw('Arms'),
    sort_order: 348,
  },

  // ── Others ────────────────────────────────────────────────────────────────
  {
    field_key: 'prop_other_desc',
    label_en: 'Item Description',
    label_hi: 'वस्तु विवरण',
    field_type: 'TEXTAREA',
    full_width: true,
    show_when: sw('Others'),
    sort_order: 344,
  },
  {
    field_key: 'prop_other_value',
    label_en: 'Estimated Value (₹)',
    label_hi: 'अनुमानित मूल्य (₹)',
    field_type: 'NUMBER',
    show_when: sw('Others'),
    sort_order: 345,
  },
];

export const up = async (knex) => {
  // 1. Fix rc_no show_when (seeds reset it to null)
  await knex('field_registry')
    .where({ field_key: 'rc_no' })
    .whereRaw(`applicable_record_types::text LIKE '%CASE%'`)
    .update({ show_when: JSON.stringify({ field: 'status', value: 'Charge Sheet' }) });

  // 2. Fix disposal_type show_when (seeds reset it to null)
  await knex('field_registry')
    .where({ field_key: 'disposal_type' })
    .whereRaw(`applicable_record_types::text LIKE '%CASE%'`)
    .update({ show_when: JSON.stringify({ field: 'status', value: 'Charge Sheet' }) });

  // 3. Insert transfer_to if missing
  const ttExists = await knex('field_registry').where({ field_key: 'transfer_to' }).first();
  if (!ttExists) {
    await knex('field_registry').insert({
      id: uuidv4(),
      field_key: 'transfer_to',
      label_en: 'Transfer To',
      label_hi: 'स्थानांतरण करें',
      field_type: 'SELECT',
      section: 'investigation_details',
      applicable_record_types: JSON.stringify(['CASE']),
      options: JSON.stringify([
        { value: 'Court',  label_en: 'Court',  label_hi: 'न्यायालय' },
        { value: 'CBI',    label_en: 'CBI (Central Bureau of Investigation)', label_hi: 'सीबीआई' },
        { value: 'EOW',    label_en: 'EOW (Economic Offences Wing)', label_hi: 'ईओडब्ल्यू' },
        { value: 'ACB',    label_en: 'ACB (Anti-Corruption Bureau)', label_hi: 'एसीबी' },
        { value: 'NIA',    label_en: 'NIA (National Investigation Agency)', label_hi: 'एनआईए' },
        { value: 'ED',     label_en: 'ED (Enforcement Directorate)', label_hi: 'प्रवर्तन निदेशालय' },
        { value: 'NCB',    label_en: 'NCB (Narcotics Control Bureau)', label_hi: 'एनसीबी' },
        { value: 'STF',    label_en: 'STF (Special Task Force)', label_hi: 'एसटीएफ' },
        { value: 'SIT',    label_en: 'SIT (Special Investigation Team)', label_hi: 'एसआईटी' },
        { value: 'Other',  label_en: 'Other Investigative Agency', label_hi: 'अन्य जांच एजेंसी' },
      ]),
      show_when: JSON.stringify({ field: 'status', value: 'Transfer' }),
      sort_order: 61.5,
      is_active: true,
      visible_to_levels: JSON.stringify(['PS', 'DISTRICT', 'HQ']),
      editable_by_levels: JSON.stringify(['PS']),
      introduced_at_level: 'PS',
      scope_level: 'global',
      full_width: false,
      readonly: false,
      validation_rules: null,
    });
  }

  // 4. Move phone fields AFTER property_stolen_recovered (sort 333) to 338-343
  const PHONE_REORDER = [
    { field_key: 'property_phone_number', sort_order: 338 },
    { field_key: 'phone_make',            sort_order: 339 },
    { field_key: 'phone_model',           sort_order: 340 },
    { field_key: 'phone_imei',            sort_order: 341 },
    { field_key: 'phone_color',           sort_order: 342 },
    { field_key: 'phone_status',          sort_order: 343 },
  ];
  for (const { field_key, sort_order } of PHONE_REORDER) {
    await knex('field_registry')
      .where({ field_key, repeater_entity: 'PROPERTY' })
      .update({ sort_order });
  }

  // 5. Insert vehicle fields if missing
  for (const field of VEHICLE_FIELDS) {
    const exists = await knex('field_registry').where({ field_key: field.field_key }).first();
    if (!exists) {
      await knex('field_registry').insert({ ...PROP_COMMON, id: uuidv4(), ...field });
    }
  }

  // 6. Insert all category-specific fields if missing
  for (const field of CATEGORY_FIELDS) {
    const exists = await knex('field_registry').where({ field_key: field.field_key }).first();
    if (!exists) {
      await knex('field_registry').insert({
        ...PROP_COMMON,
        id: uuidv4(),
        full_width: field.full_width || false,
        ...field,
      });
    }
  }
};

export const down = async (knex) => {
  // Revert show_when on rc_no and disposal_type
  await knex('field_registry')
    .whereIn('field_key', ['rc_no', 'disposal_type'])
    .update({ show_when: null });

  // Remove transfer_to
  await knex('field_registry').where({ field_key: 'transfer_to' }).delete();

  // Restore phone fields to original sort
  const PHONE_ORIGINAL = [
    { field_key: 'property_phone_number', sort_order: 309 },
    { field_key: 'phone_make',            sort_order: 310 },
    { field_key: 'phone_model',           sort_order: 311 },
    { field_key: 'phone_imei',            sort_order: 312 },
    { field_key: 'phone_color',           sort_order: 313 },
    { field_key: 'phone_status',          sort_order: 314 },
  ];
  for (const { field_key, sort_order } of PHONE_ORIGINAL) {
    await knex('field_registry').where({ field_key, repeater_entity: 'PROPERTY' }).update({ sort_order });
  }

  // Remove all inserted prop_ fields
  const ALL_KEYS = [
    ...VEHICLE_FIELDS.map(f => f.field_key),
    ...CATEGORY_FIELDS.map(f => f.field_key),
  ];
  await knex('field_registry').whereIn('field_key', ALL_KEYS).delete();
};
