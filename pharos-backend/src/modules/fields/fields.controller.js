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

export const getFieldsForForm = async (req, res) => {
  const { record_type } = req.params;

  try {
    const rawFields = await db('field_registry')
      .where({ is_active: true })
      .orderBy('sort_order', 'asc');

    // Filter fields applicable to record_type
    const filteredFields = rawFields.filter(f => {
      const types = parseJsonField(f.applicable_record_types) || [];
      return types.map(t => t.toUpperCase()).includes(record_type.toUpperCase());
    }).map(f => ({
      id: f.id,
      field_key: f.field_key,
      field_type: f.field_type,
      applicable_record_types: parseJsonField(f.applicable_record_types),
      label_en: f.label_en,
      label_hi: f.label_hi,
      options: parseJsonField(f.options),
      validation: parseJsonField(f.validation_rules),
      visible_to_levels: parseJsonField(f.visible_to_levels),
      editable_by_levels: parseJsonField(f.editable_by_levels),
      introduced_at_level: f.introduced_at_level,
      section: f.section || 'General',
      sort_order: f.sort_order
    }));

    // Group fields by section
    const sectionsMap = new Map();
    for (const f of filteredFields) {
      const secName = f.section;
      if (!sectionsMap.has(secName)) {
        sectionsMap.set(secName, []);
      }
      sectionsMap.get(secName).push(f);
    }

    const sections = [];
    for (const [sectionName, fields] of sectionsMap.entries()) {
      sections.push({
        section: sectionName,
        fields
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        record_type,
        sections
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
