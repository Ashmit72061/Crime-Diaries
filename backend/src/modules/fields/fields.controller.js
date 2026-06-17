import db from '../../config/db.js';

const parseJsonField = (val) => {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch (e) {
      return val;
    }
  }
  return val;
};

// Convert a snake_case section key into a readable title
function toTitleCase(str) {
  return str
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Map known section keys to bilingual titles
const SECTION_TITLES = {
  general_info:             { en: 'General Information',          hi: 'सामान्य जानकारी' },
  basic_details:            { en: 'Basic Details',                hi: 'बुनियादी विवरण' },
  incident_details:         { en: 'Incident Details',             hi: 'घटना का विवरण' },
  investigation_details:    { en: 'Investigation Details',        hi: 'जांच का विवरण' },
  complainant_accused_info: { en: 'Complainant & Accused',        hi: 'शिकायतकर्ता और आरोपी' },
  investigation_officer:    { en: 'Investigating Officer',        hi: 'जांच अधिकारी' },
  property_status:          { en: 'Property & Case Status',       hi: 'संपत्ति और स्थिति' },
  intranet_flags:           { en: 'System Reference Flags',       hi: 'प्रणाली संदर्भ झंडे' },
  linkages:                 { en: 'Case Linkage',                 hi: 'केस लिंकेज' },
  arrestee_info:            { en: 'Arrested Person Particulars',  hi: 'गिरफ्तार व्यक्ति का विवरण' },
  offence_info:             { en: 'Offence Classification',       hi: 'अपराध वर्गीकरण' },
  procedure_slips:          { en: 'Procedural Slips',             hi: 'प्रक्रियात्मक पर्ची' },
  custody_status:           { en: 'Custody Status',               hi: 'हिरासत की स्थिति' },
  informant_contact:        { en: 'Informant Contact',            hi: 'सूचना प्रदाता संपर्क' },
  complaint_details:        { en: 'Complaint Details',            hi: 'शिकायत विवरण' },
  response_io:              { en: 'Responding Officers',          hi: 'प्रतिक्रिया अधिकारी' },
  arrival_geo:              { en: 'Arrival & Geo-Location',       hi: 'आगमन और भू-स्थान' },
  record_type_select:       { en: 'Register Type & References',   hi: 'पंजीकरण प्रकार' },
  physical_bio:             { en: 'Physical Description',         hi: 'शारीरिक विवरण' },
  location_particulars:     { en: 'Location Particulars',         hi: 'स्थान विवरण' },
  contacts_assigned:        { en: 'Contacts & Assigned IO',       hi: 'संपर्क और IO' },
  person_details:           { en: 'Person Details',               hi: 'व्यक्ति विवरण' },
  officer_informant:        { en: 'Officers & Informant',         hi: 'अधिकारी और सूचना प्रदाता' },
  discovery_details:        { en: 'Discovery Details',            hi: 'बरामदगी का विवरण' },
  corpse_desc:              { en: 'Physical Description',         hi: 'शारीरिक विवरण' },
  zipnet_status:            { en: 'ZIPNET & Status',              hi: 'ज़िपनेट और स्थिति' },
};

export const getFieldsForForm = async (req, res) => {
  const { record_type } = req.params;

  let normalizedType = record_type.toUpperCase();
  if (normalizedType === 'CASES') normalizedType = 'CASE';
  if (normalizedType === 'ARRESTS') normalizedType = 'ARREST';
  if (normalizedType === 'PCR' || normalizedType === 'PCR_CALLS') normalizedType = 'PCR_CALL';
  if (normalizedType === 'MISSING_PERSONS' || normalizedType === 'MISSING_PERSON') normalizedType = 'MISSING';

  try {
    const rawFields = await db('field_registry')
      .where({ is_active: true })
      .orderBy('sort_order', 'asc');

    // Filter fields applicable to record_type
    const filteredFields = rawFields.filter(f => {
      const types = (parseJsonField(f.applicable_record_types) || []).map(t => {
        let ut = t.toUpperCase();
        if (ut === 'CASES') ut = 'CASE';
        if (ut === 'ARRESTS') ut = 'ARREST';
        if (ut === 'PCR' || ut === 'PCR_CALLS') ut = 'PCR_CALL';
        if (ut === 'MISSING_PERSONS' || ut === 'MISSING_PERSON') ut = 'MISSING';
        return ut;
      });
      return types.includes(normalizedType);
    }).map(f => ({
      id: f.id,
      field_key: f.field_key,
      field_type: f.field_type,
      applicable_record_types: parseJsonField(f.applicable_record_types),
      label_en: f.label_en,
      label_hi: f.label_hi || f.label_en,
      placeholder_en: f.placeholder_en || null,
      placeholder_hi: f.placeholder_hi || null,
      options: parseJsonField(f.options),
      validation_rules: parseJsonField(f.validation_rules),
      visible_to_levels: parseJsonField(f.visible_to_levels),
      editable_by_levels: parseJsonField(f.editable_by_levels),
      introduced_at_level: f.introduced_at_level,
      readonly: f.readonly || false,
      full_width: f.full_width || false,
      show_when: parseJsonField(f.show_when) || null,
      section: f.section || 'general_info',
      sort_order: f.sort_order
    }));

    // Group fields by section preserving insertion order
    const sectionsMap = new Map();
    for (const f of filteredFields) {
      const secKey = f.section;
      if (!sectionsMap.has(secKey)) {
        sectionsMap.set(secKey, []);
      }
      sectionsMap.get(secKey).push(f);
    }

    const sections = [];
    for (const [sectionKey, fields] of sectionsMap.entries()) {
      const titles = SECTION_TITLES[sectionKey] || {
        en: toTitleCase(sectionKey),
        hi: toTitleCase(sectionKey)
      };
      sections.push({
        section: sectionKey,
        title_en: titles.en,
        title_hi: titles.hi,
        fields
      });
    }

    return res.status(200).json({
      success: true,
      data: sections
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
