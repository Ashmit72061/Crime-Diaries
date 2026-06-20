import { db } from '../../config/db.js';
import { v4 as uuidv4 } from 'uuid';

// applicable_record_types is stored as JSON text e.g. '["CASE","ARREST"]'
// We use a LIKE on the quoted value so "CASE" won't accidentally match "CASES"
const typeFilter = (query, record_type) =>
  query.whereRaw('applicable_record_types LIKE ?', [`%"${record_type}"%`]);

const SECTION_TITLES = {
  general_info: { en: 'General Information', hi: 'सामान्य जानकारी' },
  identity: { en: 'Identity', hi: 'पहचान' },
  incident_details: { en: 'Incident Details', hi: 'घटना विवरण' },
  complainant_accused_info: { en: 'Complainant & Accused', hi: 'शिकायतकर्ता और आरोपी' },
  investigation_officer: { en: 'Investigation Officer', hi: 'जांच अधिकारी' },
  property_status: { en: 'Property & Status', hi: 'संपत्ति और स्थिति' },
  intranet_flags: { en: 'Intranet Flags', hi: 'इंट्रानेट झंडे' },
  offence_info: { en: 'Offence Information', hi: 'अपराध जानकारी' },
  arrestee_info: { en: 'Arrested Person Details', hi: 'गिरफ्तार व्यक्ति विवरण' },
  custody_status: { en: 'Custody Status', hi: 'हिरासत स्थिति' },
  procedure_slips: { en: 'Procedure & Slips', hi: 'प्रक्रिया और पर्ची' },
  informant_contact: { en: 'Informant & Contact', hi: 'सूचनाकर्ता और संपर्क' },
  complaint_details: { en: 'Complaint Details', hi: 'शिकायत विवरण' },
  response_io: { en: 'Response & IO', hi: 'प्रतिक्रिया और जांच अधिकारी' },
  arrival_geo: { en: 'Arrival & Location', hi: 'पहुंचना और स्थान' },
  person_details: { en: 'Person Details', hi: 'व्यक्ति विवरण' },
  location_particulars: { en: 'Location Particulars', hi: 'स्थान विशेष' },
  physical_bio: { en: 'Physical Description', hi: 'शारीरिक हुलिया' },
  contacts_assigned: { en: 'Contacts & Assigned IO', hi: 'संपर्क और आवंटित जांच अधिकारी' },
  discovery_details: { en: 'Discovery Details', hi: 'खोज विवरण' },
  corpse_desc: { en: 'Body Description', hi: 'शव विवरण' },
  officer_informant: { en: 'Officer & Informant', hi: 'अधिकारी और सूचनाकर्ता' },
  zipnet_status: { en: 'ZIPNET & Status', hi: 'जिपनेट और स्थिति' },
  linked_case: { en: 'Linked Case', hi: 'संबंधित मामला' },
  classification: { en: 'Classification', hi: 'वर्गीकरण' },
  gist: { en: 'Call Gist', hi: 'कॉल का विवरण' },
  category: { en: 'Category', hi: 'श्रेणी' },
  stolen_property: { en: 'Stolen Property', hi: 'चोरी की गई संपत्ति' },
  recovered_property: { en: 'Recovered Property', hi: 'बरामद संपत्ति' },
};

function sectionTitle(sec) {
  const t = SECTION_TITLES[sec];
  if (t) return t;
  // Convert snake_case to Title Case as fallback
  const titleEn = sec.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return { en: titleEn, hi: titleEn };
}

export const getFields = async (record_type, is_active) => {
  let query = db('field_registry').select('*').orderBy('sort_order', 'asc');

  if (record_type) {
    query = typeFilter(query, record_type);
  }

  if (is_active !== undefined) {
    query = query.where('is_active', is_active === 'true' || is_active === true);
  }

  return await query;
};

export const getFormFields = async (record_type) => {
  const fields = await typeFilter(
    db('field_registry').select('*').andWhere('is_active', true).orderBy('sort_order', 'asc'),
    record_type
  );

  const grouped = {};

  for (const field of fields) {
    const sec = field.section || 'general_info';
    if (!grouped[sec]) {
      const t = sectionTitle(sec);
      grouped[sec] = { section: sec, title_en: t.en, title_hi: t.hi, fields: [] };
    }
    grouped[sec].fields.push(field);
  }

  return Object.values(grouped);
};

export const createField = async (fieldData) => {
  const id = uuidv4();
  const [newField] = await db('field_registry').insert({
    id,
    ...fieldData
  }).returning('*');
  return newField;
};

export const updateField = async (id, fieldData) => {
  const [updatedField] = await db('field_registry')
    .where({ id })
    .update(fieldData)
    .returning('*');

  if (!updatedField) throw new Error('Field not found');
  return updatedField;
};

export const toggleFieldStatus = async (id, is_active) => {
  const [updatedField] = await db('field_registry')
    .where({ id })
    .update({ is_active })
    .returning('*');

  if (!updatedField) throw new Error('Field not found');
  return updatedField;
};
