import { db } from '../../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export const getFields = async (record_type, is_active) => {
  let query = db('field_registry').select('*').orderBy('sort_order', 'asc');

  if (record_type) {
    query = query.whereRaw('? = ANY(applicable_record_types)', [record_type]);
  }
  
  if (is_active !== undefined) {
    query = query.where('is_active', is_active === 'true' || is_active === true);
  }

  return await query;
};

export const getFormFields = async (record_type) => {
  const fields = await db('field_registry')
    .select('*')
    .whereRaw('? = ANY(applicable_record_types)', [record_type])
    .andWhere('is_active', true)
    .orderBy('sort_order', 'asc');

  // Group fields by section for the form render
  // Expected output format: [{section: 'basic', title_en: 'Basic', title_hi: 'बेसिक', fields: [...]}]
  
  const grouped = {};
  
  for (const field of fields) {
    const sec = field.section || 'default';
    if (!grouped[sec]) {
      grouped[sec] = {
        section: sec,
        title_en: sec.charAt(0).toUpperCase() + sec.slice(1), // Simple fallback
        title_hi: sec, // Ideally would have translation for section name in DB
        fields: []
      };
      
      // Attempt to generate a decent title
      if (sec === 'basic_details') {
        grouped[sec].title_en = 'Basic Details';
        grouped[sec].title_hi = 'मूल विवरण';
      } else if (sec === 'incident_details') {
        grouped[sec].title_en = 'Incident Details';
        grouped[sec].title_hi = 'घटना विवरण';
      }
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
