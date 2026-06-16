import { getDB } from '../config/db.js';

export const saveCustomFields = async (recordId, recordType, module, districtId, customFieldsMap, createdBy) => {
  if (!customFieldsMap || Object.keys(customFieldsMap).length === 0) return;

  const db = await getDB();

  const keys = Object.keys(customFieldsMap);
  const placeholders = keys.map(() => '?').join(',');

  // Retrieve active definitions for this module and scope OR matching the submitted field keys
  const definitions = await db.all(
    `SELECT * FROM custom_field_definitions 
     WHERE module = ? AND (is_active = 1 OR field_key IN (${placeholders}))
     AND (scope_level = 'hq' OR (scope_level = 'district' AND scope_id = ?))`,
    [module, ...keys, districtId]
  );

  for (const def of definitions) {
    const value = customFieldsMap[def.field_key];
    if (value === undefined || value === null) continue;

    // Check if value already exists
    const existing = await db.get(
      `SELECT id FROM custom_field_values 
       WHERE record_id = ? AND record_type = ? AND field_definition_id = ?`,
      [recordId, recordType, def.id]
    );

    if (existing) {
      await db.run(
        `UPDATE custom_field_values SET value_text = ? WHERE id = ?`,
        [String(value), existing.id]
      );
    } else {
      await db.run(
        `INSERT INTO custom_field_values (record_id, record_type, field_definition_id, value_text, created_by) 
         VALUES (?, ?, ?, ?, ?)`,
        [recordId, recordType, def.id, String(value), createdBy]
      );
    }
  }
};

export const getCustomFieldValuesForRecord = async (recordId, recordType) => {
  const db = await getDB();

  const values = await db.all(
    `SELECT val.value_text as value, def.field_key as key, def.field_label as label, def.field_type as type, def.id as definition_id, def.options_json
     FROM custom_field_values val
     JOIN custom_field_definitions def ON val.field_definition_id = def.id
     WHERE val.record_id = ? AND val.record_type = ?`,
    [recordId, recordType]
  );

  const result = {};
  values.forEach((v) => {
    result[v.key] = {
      value: v.value,
      label: v.label,
      type: v.type,
      definitionId: v.definition_id,
      options: v.options_json ? JSON.parse(v.options_json) : null
    };
  });

  return result;
};
