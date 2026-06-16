import { db } from '../../config/db.js';
import { publish } from '../../events/eventBus.js';

export const getRecords = async (filters) => {
  let query = db('records').select('*');

  if (filters.type) query = query.where('record_type', filters.type);
  if (filters.status) query = query.where('current_status', filters.status);
  if (filters.psId) query = query.where('ps_id', filters.psId);
  if (filters.districtId) query = query.where('district_id', filters.districtId);

  // Apply pagination if provided
  const limit = filters.limit ? parseInt(filters.limit, 10) : 20;
  const page = filters.page ? parseInt(filters.page, 10) : 1;
  const offset = (page - 1) * limit;

  query = query.limit(limit).offset(offset).orderBy('updated_at', 'desc');

  return await query;
};

export const getRecord = async (id) => {
  return await db('records').where({ id }).first();
};

export const createRecord = async (recordData) => {
  const [newRecord] = await db('records').insert({
    record_type: recordData.record_type,
    ps_id: recordData.ps_id,
    district_id: recordData.district_id,
    data: recordData.data || {},
    current_status: 'DRAFT',
    current_level: 'PS',
    created_by: recordData.created_by
  }).returning('*');

  // Publish to Event Bus
  await publish('record.created', {
    recordId: newRecord.id,
    record_type: newRecord.record_type,
    psId: newRecord.ps_id,
    created_by: newRecord.created_by,
    data: newRecord.data
  });

  return newRecord;
};

export const updateRecord = async (id, updateData, changed_by, level) => {
  const existingRecord = await db('records').where({ id }).first();
  if (!existingRecord) throw new Error('Record not found');

  if (existingRecord.current_status !== 'DRAFT' && existingRecord.current_status !== 'SENT_BACK_HC') {
    throw new Error('Only DRAFT or SENT_BACK_HC records can be updated directly');
  }

  // Calculate diff (simplified for prototype)
  const field_changes = [];
  const newData = { ...existingRecord.data, ...updateData.data };
  
  for (const key of Object.keys(updateData.data || {})) {
    if (existingRecord.data[key] !== updateData.data[key]) {
      field_changes.push({
        key,
        old: existingRecord.data[key],
        new: updateData.data[key]
      });
    }
  }

  const [updatedRecord] = await db('records')
    .where({ id })
    .update({
      data: newData,
      version: existingRecord.version + 1,
      updated_at: db.fn.now()
    })
    .returning('*');

  // Publish update event
  await publish('record.updated', {
    recordId: id,
    changed_by,
    field_changes,
    level
  });

  return updatedRecord;
};

export const deleteRecord = async (id) => {
  const record = await db('records').where({ id }).first();
  if (!record) throw new Error('Record not found');
  if (record.current_status !== 'DRAFT') {
    throw new Error('Only DRAFT records can be deleted');
  }

  await db('records').where({ id }).del();
};

export const getRecordRevisions = async (record_id) => {
  return await db('record_revisions')
    .where({ record_id })
    .orderBy('changed_at', 'desc');
};
