import { db } from '../../config/db.js';
import { publish } from '../../events/eventBus.js';

export const getQueue = async (level, psId, districtId, subDivId, filters) => {
  let query = db('records')
    .select('records.*', 'users.name_en as creator_name')
    .leftJoin('users', 'records.created_by', 'users.id');

  // Filter by level-appropriate status
  if (level === 'SHO') {
    query = query.where('current_status', 'PENDING_SHO');
    if (psId) query = query.andWhere('records.ps_id', psId);
  } else if (level === 'ACP') {
    query = query.where('current_status', 'ACP_REVIEW');
    if (subDivId) query = query.andWhere('records.sub_div_id', subDivId);
  } else if (level === 'DISTRICT_OFFICER') {
    query = query.where('current_status', 'DISTRICT_REVIEW');
    if (districtId) query = query.andWhere('records.district_id', districtId);
  } else {
    // Other levels logic...
    query = query.where('current_status', 'NONE'); // stub for safety
  }

  if (filters.type) query = query.where('record_type', filters.type);

  const limit = filters.limit ? parseInt(filters.limit, 10) : 20;
  const page = filters.page ? parseInt(filters.page, 10) : 1;
  const offset = (page - 1) * limit;

  query = query.limit(limit).offset(offset).orderBy('updated_at', 'desc');
  return await query;
};

export const getQueueCount = async (level, psId, districtId, subDivId) => {
  let query = db('records').count('* as count');

  if (level === 'SHO') {
    query = query.where('current_status', 'PENDING_SHO');
    if (psId) query = query.andWhere('ps_id', psId);
  } else if (level === 'ACP') {
    query = query.where('current_status', 'ACP_REVIEW');
    if (subDivId) query = query.andWhere('sub_div_id', subDivId);
  } else if (level === 'DISTRICT_OFFICER') {
    query = query.where('current_status', 'DISTRICT_REVIEW');
    if (districtId) query = query.andWhere('district_id', districtId);
  } else {
    return 0;
  }

  const result = await query.first();
  return parseInt(result.count, 10);
};

export const submitRecord = async (recordId, userId) => {
  const record = await db('records').where('id', recordId).first();
  if (!record) throw new Error('Record not found');
  
  if (record.current_status !== 'DRAFT' && record.current_status !== 'SENT_BACK_HC') {
    throw new Error('Only DRAFT or SENT_BACK_HC records can be submitted');
  }

  const newStatus = 'PENDING_SHO';

  // Update record
  await db('records').where('id', recordId).update({
    current_status: newStatus,
    current_level: 'SHO',
    updated_at: db.fn.now()
  });

  // Log transition
  const [transition] = await db('workflow_transitions').insert({
    record_id: recordId,
    from_status: record.current_status,
    to_status: newStatus,
    action: 'SUBMIT',
    performed_by: userId
  }).returning('*');

  // Publish event
  await publish('record.status_changed', {
    recordId,
    action: 'SUBMIT',
    from_status: record.current_status,
    to_status: newStatus,
    performed_by: userId,
    target_psId: record.ps_id
  });

  return transition;
};

export const approveRecord = async (recordId, userId, level) => {
  const record = await db('records').where('id', recordId).first();
  if (!record) throw new Error('Record not found');

  let newStatus;
  let newLevel;
  
  if (level === 'SHO' && record.current_status === 'PENDING_SHO') {
    newStatus = 'DISTRICT_REVIEW';
    newLevel = 'DISTRICT';
  } else if (level === 'DISTRICT_OFFICER' && record.current_status === 'DISTRICT_REVIEW') {
    newStatus = 'COMPILED'; // or waiting for compilation step
    newLevel = 'JCP';
  } else {
    throw new Error(`Cannot approve record in status ${record.current_status} at level ${level}`);
  }

  await db('records').where('id', recordId).update({
    current_status: newStatus,
    current_level: newLevel,
    updated_at: db.fn.now()
  });

  const [transition] = await db('workflow_transitions').insert({
    record_id: recordId,
    from_status: record.current_status,
    to_status: newStatus,
    action: 'APPROVE',
    performed_by: userId
  }).returning('*');

  await publish('record.status_changed', {
    recordId,
    action: 'APPROVE',
    from_status: record.current_status,
    to_status: newStatus,
    performed_by: userId,
    target_psId: record.ps_id
  });

  return transition;
};

export const sendBackRecord = async (recordId, userId, level, comment, target_fields) => {
  if (!comment) throw new Error('Comment is required when sending back');
  
  const record = await db('records').where('id', recordId).first();
  if (!record) throw new Error('Record not found');

  let newStatus;
  let newLevel;

  if (level === 'SHO' && record.current_status === 'PENDING_SHO') {
    newStatus = 'SENT_BACK_HC';
    newLevel = 'PS';
  } else if (level === 'DISTRICT_OFFICER' && record.current_status === 'DISTRICT_REVIEW') {
    newStatus = 'PENDING_SHO'; // Sent back to PS/SHO
    newLevel = 'SHO';
  } else {
    throw new Error(`Cannot send back record in status ${record.current_status} at level ${level}`);
  }

  await db('records').where('id', recordId).update({
    current_status: newStatus,
    current_level: newLevel,
    updated_at: db.fn.now()
  });

  const [transition] = await db('workflow_transitions').insert({
    record_id: recordId,
    from_status: record.current_status,
    to_status: newStatus,
    action: 'SEND_BACK',
    performed_by: userId,
    comment,
    target_fields
  }).returning('*');

  await publish('record.status_changed', {
    recordId,
    action: 'SEND_BACK',
    from_status: record.current_status,
    to_status: newStatus,
    performed_by: userId,
    target_psId: record.ps_id,
    comment,
    target_fields
  });

  return transition;
};

export const getRecordHistory = async (recordId) => {
  return await db('workflow_transitions')
    .where('record_id', recordId)
    .orderBy('performed_at', 'desc');
};
