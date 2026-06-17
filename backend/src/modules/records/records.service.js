import { v4 as uuidv4 } from 'uuid';
import db from '../../config/db.js';
import * as eventBus from '../../events/eventBus.js';

// Helpers
const calculateDiff = (oldData, newData) => {
  const diff = [];
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
  for (const key of allKeys) {
    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      diff.push({
        field_key: key,
        old_value: oldData[key] ?? '',
        new_value: newData[key] ?? ''
      });
    }
  }
  return diff;
};

const parseJsonField = (val) => {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch (e) { return val; }
  }
  return val;
};

const generateUID = async (recordType, psId, dateStr, trx = db) => {
  const ps = await trx('hierarchy_nodes').where({ id: psId }).first();
  const psCode = ps?.code || 'PS';
  const cleanDate = dateStr.replace(/[^0-9]/g, ''); // YYYYMMDD
  const countRow = await trx('records')
    .where({ ps_id: psId, record_type: recordType })
    .count('* as count')
    .first();
  const seq = String((parseInt(countRow.count, 10) || 0) + 1).padStart(4, '0');
  return `${recordType}-${psCode}-${cleanDate}-${seq}`;
};

// Services
export const listRecords = async (recordType, filters, jurisdictionQuery) => {
  let query = db('records').select(
    'records.*',
    'ps.name_en as ps_name',
    'dist.name_en as district_name',
    'u.username as creator_name'
  )
  .join('hierarchy_nodes as ps', 'records.ps_id', 'ps.id')
  .join('hierarchy_nodes as dist', 'records.district_id', 'dist.id')
  .join('users as u', 'records.created_by', 'u.id');

  // Apply RBAC geographical boundary filters
  if (jurisdictionQuery.ps_id) {
    query = query.where('records.ps_id', jurisdictionQuery.ps_id);
  }
  if (jurisdictionQuery.district_id) {
    query = query.where('records.district_id', jurisdictionQuery.district_id);
  }
  if (jurisdictionQuery.sub_div_id) {
    query = query.where('records.sub_div_id', jurisdictionQuery.sub_div_id);
  }

  // Scoped filters
  if (recordType) {
    query = query.where('records.record_type', recordType);
  }

  if (filters.status) {
    if (Array.isArray(filters.status)) {
      query = query.whereIn('records.current_status', filters.status);
    } else {
      query = query.where('records.current_status', filters.status);
    }
  }

  if (filters.dateFrom) {
    query = query.where('records.record_date', '>=', filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.where('records.record_date', '<=', filters.dateTo);
  }

  const rawRecords = await query.orderBy('records.created_at', 'desc');

  return rawRecords.map(r => ({
    ...r,
    data: parseJsonField(r.data)
  }));
};

export const getRecordDetails = async (id) => {
  const record = await db('records')
    .select('records.*', 'ps.name_en as ps_name', 'dist.name_en as district_name')
    .join('hierarchy_nodes as ps', 'records.ps_id', 'ps.id')
    .join('hierarchy_nodes as dist', 'records.district_id', 'dist.id')
    .where('records.id', id)
    .first();

  if (!record) return null;

  record.data = parseJsonField(record.data);

  // Fetch revisions
  const revisions = await db('record_revisions')
    .select('record_revisions.*', 'u.username', 'u.name_en as user_fullname')
    .join('users as u', 'record_revisions.changed_by', 'u.id')
    .where('record_revisions.record_id', id)
    .orderBy('record_revisions.revision_number', 'asc');

  revisions.forEach(rev => {
    rev.field_changes = parseJsonField(rev.field_changes);
  });

  // Fetch workflow transitions
  const transitions = await db('workflow_transitions')
    .select('workflow_transitions.*', 'u.username')
    .join('users as u', 'workflow_transitions.performed_by', 'u.id')
    .where('workflow_transitions.record_id', id)
    .orderBy('workflow_transitions.performed_at', 'asc');

  transitions.forEach(tr => {
    tr.target_fields = parseJsonField(tr.target_fields);
  });

  // Fetch Custom Field Values (EAV)
  const customValues = await db('custom_field_values')
    .select('custom_field_values.*', 'd.field_label', 'd.field_key', 'd.field_type')
    .join('custom_field_definitions as d', 'custom_field_values.field_definition_id', 'd.id')
    .where('custom_field_values.record_id', id);

  return {
    record,
    revisions,
    transitions,
    customFields: customValues
  };
};

export const createRecord = async (user, recordType, recordDate, data, ipAddress) => {
  const dbRecord = await db.transaction(async (trx) => {
    const id = uuidv4();
    const uid = await generateUID(recordType, user.ps_id, recordDate, trx);

    // Save records row
    const recordPayload = {
      id,
      record_type: recordType,
      ps_id: user.ps_id,
      district_id: user.district_id,
      sub_div_id: user.sub_div_id,
      data: JSON.stringify(data),
      current_status: 'DRAFT',
      current_level: 'PS',
      record_date: recordDate,
      created_by: user.id,
      updated_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Inject generated UID into records data JSON block for search consistency
    const hydratedData = { ...data, uid };
    recordPayload.data = JSON.stringify(hydratedData);

    await trx('records').insert(recordPayload);

    // Write initial revision (Pillar 2)
    const revisionPayload = {
      id: uuidv4(),
      record_id: id,
      revision_number: 1,
      changed_by: user.id,
      changed_at: new Date().toISOString(),
      level: 'PS',
      change_type: 'CREATE',
      field_changes: JSON.stringify(calculateDiff({}, hydratedData)),
      ip_address: ipAddress
    };

    await trx('record_revisions').insert(revisionPayload);

    // Write audit log entry
    await trx('audit_logs').insert({
      id: uuidv4(),
      table_name: 'records',
      record_id: id,
      action: 'CREATE',
      changed_by_id: user.id,
      changed_by_role: user.role,
      changed_at: new Date().toISOString(),
      new_value: JSON.stringify(hydratedData),
      ip_address: ipAddress
    });

    return { id, uid, data: hydratedData };
  });

  // Publish created event
  await eventBus.publish('record.created', {
    record_id: dbRecord.id,
    record_type: recordType,
    changed_by: user.id,
    data: dbRecord.data
  });

  return dbRecord;
};

export const updateRecord = async (id, user, data, ipAddress) => {
  const dbRecord = await db.transaction(async (trx) => {
    const record = await trx('records').where({ id }).first();
    if (!record) throw new Error('Record not found');

    if (record.current_status !== 'DRAFT' && record.current_status !== 'SENT_BACK_HC') {
      throw new Error('This record is locked. Only DRAFT or SENT_BACK_HC records can be edited.');
    }

    const oldData = parseJsonField(record.data);
    const hydratedData = { ...oldData, ...data };

    const diff = calculateDiff(oldData, hydratedData);
    if (diff.length === 0) return record; // No modifications made

    // Update record
    await trx('records').where({ id }).update({
      data: JSON.stringify(hydratedData),
      updated_by: user.id,
      updated_at: new Date().toISOString()
    });

    // Fetch revision counter
    const revCountRow = await trx('record_revisions')
      .where({ record_id: id })
      .count('* as count')
      .first();
    const nextRevNo = (parseInt(revCountRow.count, 10) || 0) + 1;

    // Write revision
    await trx('record_revisions').insert({
      id: uuidv4(),
      record_id: id,
      revision_number: nextRevNo,
      changed_by: user.id,
      changed_at: new Date().toISOString(),
      level: record.current_level,
      change_type: 'UPDATE',
      field_changes: JSON.stringify(diff),
      ip_address: ipAddress
    });

    // Write standard audit log
    for (const change of diff) {
      await trx('audit_logs').insert({
        id: uuidv4(),
        table_name: 'records',
        record_id: id,
        action: 'UPDATE',
        changed_by_id: user.id,
        changed_by_role: user.role,
        changed_at: new Date().toISOString(),
        field_name: change.field_key,
        old_value: String(change.old_value),
        new_value: String(change.new_value),
        ip_address: ipAddress
      });
    }

    return { id, data: hydratedData };
  });

  // Publish updated event
  await eventBus.publish('record.updated', {
    record_id: id,
    changed_by: user.id,
    data: dbRecord.data
  });

  return dbRecord;
};

export const submitRecord = async (id, user) => {
  await db.transaction(async (trx) => {
    const record = await trx('records').where({ id }).first();
    if (!record) throw new Error('Record not found');

    if (record.current_status !== 'DRAFT' && record.current_status !== 'SENT_BACK_HC') {
      throw new Error('Record is already submitted');
    }

    // Advance status to PENDING_SHO
    await trx('records').where({ id }).update({
      current_status: 'PENDING_SHO',
      updated_by: user.id,
      updated_at: new Date().toISOString()
    });

    // Write workflow transition log
    await trx('workflow_transitions').insert({
      id: uuidv4(),
      record_id: id,
      from_status: record.current_status,
      to_status: 'PENDING_SHO',
      from_level: record.current_level,
      to_level: record.current_level,
      action: 'SUBMIT',
      performed_by: user.id,
      performed_at: new Date().toISOString()
    });

    // Write audit log
    await trx('audit_logs').insert({
      id: uuidv4(),
      table_name: 'records',
      record_id: id,
      action: 'SUBMIT',
      changed_by_id: user.id,
      changed_by_role: user.role,
      changed_at: new Date().toISOString()
    });
  });

  // Publish submit event
  await eventBus.publish('record.submitted', {
    record_id: id,
    performed_by: user.id
  });
};

export const transitionRecord = async (id, user, action, comment, targetFields, ipAddress) => {
  const TRANSITIONS = {
    PENDING_SHO: {
      approve: { to: 'DISTRICT_REVIEW', toLevel: 'DISTRICT' },
      send_back: { to: 'SENT_BACK_HC', toLevel: 'PS', requiresComment: true }
    },
    DISTRICT_REVIEW: {
      approve: { to: 'HQ_RECEIVED', toLevel: 'HQ' },
      send_back: { to: 'SENT_BACK_HC', toLevel: 'PS', requiresComment: true }
    }
  };

  await db.transaction(async (trx) => {
    const record = await trx('records').where({ id }).first();
    if (!record) throw new Error('Record not found');

    const stateRules = TRANSITIONS[record.current_status];
    if (!stateRules || !stateRules[action]) {
      throw new Error(`Invalid action "${action}" for status "${record.current_status}"`);
    }

    const rule = stateRules[action];
    if (rule.requiresComment && (!comment || comment.trim().length === 0)) {
      throw new Error('Comment is required for this action');
    }

    // Update status
    await trx('records').where({ id }).update({
      current_status: rule.to,
      current_level: rule.toLevel,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    });

    // Write workflow transition log
    await trx('workflow_transitions').insert({
      id: uuidv4(),
      record_id: id,
      from_status: record.current_status,
      to_status: rule.to,
      from_level: record.current_level,
      to_level: rule.toLevel,
      action: action.toUpperCase(),
      performed_by: user.id,
      performed_at: new Date().toISOString(),
      comment,
      target_fields: targetFields ? JSON.stringify(targetFields) : null
    });

    // Write standard audit log
    await trx('audit_logs').insert({
      id: uuidv4(),
      table_name: 'records',
      record_id: id,
      action: action.toUpperCase(),
      changed_by_id: user.id,
      changed_by_role: user.role,
      changed_at: new Date().toISOString(),
      reason: comment,
      ip_address: ipAddress
    });
  });

  // Publish event
  const eventName = `record.${action === 'approve' ? 'approved' : 'sent_back'}`;
  await eventBus.publish(eventName, {
    record_id: id,
    performed_by: user.id,
    comment
  });
};

export const overrideCaseHead = async (id, user, newHead, reason, ipAddress) => {
  if (!newHead) throw new Error('New crime head classification is required');
  if (!reason || reason.trim().length < 10) {
    throw new Error('Justification reason must be at least 10 characters long');
  }

  const result = await db.transaction(async (trx) => {
    const record = await trx('records').where({ id }).first();
    if (!record) throw new Error('Record not found');

    const oldData = parseJsonField(record.data);
    let key = 'crime_head';
    if ('case_head' in oldData) {
      key = 'case_head';
    } else if ('local_head' in oldData) {
      key = 'local_head';
    } else if (record.record_type === 'CASE' || record.record_type === 'CASES') {
      key = 'local_head';
    }
    const oldHead = oldData[key];

    const hydratedData = { ...oldData, [key]: newHead };

    // Update data block
    await trx('records').where({ id }).update({
      data: JSON.stringify(hydratedData),
      updated_by: user.id,
      updated_at: new Date().toISOString()
    });

    // Fetch revision count
    const revCountRow = await trx('record_revisions')
      .where({ record_id: id })
      .count('* as count')
      .first();
    const nextRevNo = (parseInt(revCountRow.count, 10) || 0) + 1;

    // Write revision (tamper-chained event)
    await trx('record_revisions').insert({
      id: uuidv4(),
      record_id: id,
      revision_number: nextRevNo,
      changed_by: user.id,
      changed_at: new Date().toISOString(),
      level: record.current_level,
      change_type: 'HEAD_OVERRIDE',
      field_changes: JSON.stringify([{ field_key: key, old_value: oldHead || '', new_value: newHead }]),
      reason,
      ip_address: ipAddress
    });

    // Write audit logs
    await trx('audit_logs').insert({
      id: uuidv4(),
      table_name: 'records',
      record_id: id,
      action: 'OVERRIDE',
      changed_by_id: user.id,
      changed_by_role: user.role,
      changed_at: new Date().toISOString(),
      field_name: key,
      old_value: oldHead || '',
      new_value: newHead,
      reason,
      ip_address: ipAddress
    });

    return { id, data: hydratedData };
  });

  // Publish override event
  await eventBus.publish('record.overridden', {
    record_id: id,
    performed_by: user.id,
    reason,
    data: result.data
  });

  return result;
};

export const getRecordRevisions = async (record_id) => {
  return await db('record_revisions')
    .where({ record_id })
    .orderBy('revision_number', 'asc');
};
