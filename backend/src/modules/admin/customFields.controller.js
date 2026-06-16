import db from '../../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const parseJsonField = (val) => {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch (e) { return val; }
  }
  return val;
};

export const createCustomField = async (req, res) => {
  const { module, field_key, field_label, field_type, options_json, is_required } = req.body;
  const { role, district_id } = req.user;

  if (!module || !field_key || !field_label || !field_type) {
    return res.status(400).json({ success: false, message: 'module, field_key, field_label, and field_type are required' });
  }

  // Restrict to DCP and Admin roles only
  if (!['DISTRICT_OFFICER', 'SYSTEM_ADMIN', 'HQ_ADMIN'].includes(role)) {
    return res.status(403).json({ success: false, message: 'Access denied: Only DCP and Admin users can create custom fields' });
  }

  try {
    const id = uuidv4();
    const scopeLevel = role === 'DISTRICT_OFFICER' ? 'district' : 'hq';
    const scopeId = role === 'DISTRICT_OFFICER' ? district_id : null;

    const payload = {
      id,
      module: module.toLowerCase(),
      field_key: field_key.toLowerCase(),
      field_label,
      field_type,
      options_json: options_json ? (typeof options_json === 'string' ? options_json : JSON.stringify(options_json)) : null,
      is_required: is_required ? 1 : 0,
      scope_level: scopeLevel,
      scope_id: scopeId,
      is_active: 1,
      created_by: req.user.id
    };

    await db('custom_field_definitions').insert(payload);

    return res.status(201).json({
      success: true,
      message: 'Custom field definition created successfully',
      data: {
        id,
        field_key: payload.field_key,
        field_label
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCustomFields = async (req, res) => {
  const { module } = req.query;
  const { ps_id, district_id } = req.user;

  try {
    let query = db('custom_field_definitions').where({ is_active: 1 });

    if (module) {
      query = query.where({ module: module.toLowerCase() });
    }

    // Scoped to user's district or global HQ
    if (district_id) {
      query = query.where((qb) => {
        qb.where({ scope_level: 'hq' })
          .orWhere({ scope_level: 'district', scope_id: district_id });
      });
    }

    const list = await query.orderBy('created_at', 'asc');
    
    const formatted = list.map(item => ({
      ...item,
      options_json: parseJsonField(item.options_json),
      is_required: !!item.is_required
    }));

    return res.status(200).json({
      success: true,
      data: {
        customFields: formatted
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
