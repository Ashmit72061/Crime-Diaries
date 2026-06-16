import * as recordsService from './records.service.js';
<<<<<<< HEAD
import { verifyRecordAccess } from '../../middleware/rbac.middleware.js';

export const getRecords = async (req, res) => {
  const { type, status, dateFrom, dateTo } = req.query;

  try {
    const records = await recordsService.listRecords(
      type,
      { status, dateFrom, dateTo },
      req.jurisdictionQuery
    );
    return res.status(200).json({ success: true, data: { cases: records } }); // named cases for UI compatibility
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getRecord = async (req, res) => {
  const { id } = req.params;

  try {
    // Verify geographical scope access
    await verifyRecordAccess(id, req.user);

    const data = await recordsService.getRecordDetails(id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }
    return res.status(200).json({ success: true, data });
  } catch (error) {
    const status = error.message.includes('Access denied') ? 403 : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

export const create = async (req, res) => {
  const { record_type, record_date, data } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

  if (!record_type || !record_date || !data) {
    return res.status(400).json({ success: false, message: 'record_type, record_date, and data block are required' });
  }

  try {
    const record = await recordsService.createRecord(
      req.user,
      record_type,
      record_date,
      data,
      ipAddress
    );
    return res.status(201).json({ success: true, data: record });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  const { id } = req.params;
  const { data } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

  if (!data) {
    return res.status(400).json({ success: false, message: 'Update data block is required' });
  }

  try {
    // Validate scope
    await verifyRecordAccess(id, req.user);

    const record = await recordsService.updateRecord(id, req.user, data, ipAddress);
    return res.status(200).json({ success: true, data: record });
  } catch (error) {
    const status = error.message.includes('Access denied') ? 403 : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

export const submit = async (req, res) => {
  const { id } = req.params;

  try {
    await verifyRecordAccess(id, req.user);
    await recordsService.submitRecord(id, req.user);
    return res.status(200).json({ success: true, message: 'Record submitted successfully' });
  } catch (error) {
    const status = error.message.includes('Access denied') ? 403 : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

export const approve = async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

  try {
    await verifyRecordAccess(id, req.user);
    await recordsService.transitionRecord(id, req.user, 'approve', comment, null, ipAddress);
    return res.status(200).json({ success: true, message: 'Record approved and advanced successfully' });
  } catch (error) {
    const status = error.message.includes('Access denied') ? 403 : 400;
    return res.status(status).json({ success: false, message: error.message });
  }
};

export const sendBack = async (req, res) => {
  const { id } = req.params;
  const { comment, target_fields } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

  try {
    await verifyRecordAccess(id, req.user);
    await recordsService.transitionRecord(id, req.user, 'send_back', comment, target_fields, ipAddress);
    return res.status(200).json({ success: true, message: 'Record sent back to operator' });
  } catch (error) {
    const status = error.message.includes('Access denied') ? 403 : 400;
    return res.status(status).json({ success: false, message: error.message });
  }
};

export const overrideHead = async (req, res) => {
  const { id } = req.params;
  const { caseHeadId, reason } = req.body; // mapped to match verification test caseHeadId
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

  try {
    await verifyRecordAccess(id, req.user);
    const result = await recordsService.overrideCaseHead(id, req.user, caseHeadId, reason, ipAddress);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    const status = error.message.includes('Access denied') ? 403 : 400;
    return res.status(status).json({ success: false, message: error.message });
  }
};

export const getQueue = async (req, res) => {
  const { role } = req.user;
  let targetStatus;

  if (role === 'HC') {
    targetStatus = ['DRAFT', 'SENT_BACK'];
  } else if (role === 'SHO') {
    targetStatus = ['PENDING_SHO'];
  } else if (role === 'DISTRICT_OFFICER') {
    targetStatus = ['DISTRICT_REVIEW'];
  } else {
    targetStatus = ['HQ_RECEIVED', 'DISTRICT_REVIEW', 'PENDING_SHO'];
  }

  try {
    const records = await recordsService.listRecords(
      null, // any type
      { status: targetStatus },
      req.jurisdictionQuery
    );
    return res.status(200).json({ success: true, data: { queue: records } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
=======

export const getRecords = async (req, res, next) => {
  try {
    const filters = req.query; // e.g., type, status, psId, districtId
    // Note: In a real implementation, user scoping would come from req.user
    const records = await recordsService.getRecords(filters);
    res.status(200).json({ status: 'success', data: records });
  } catch (error) {
    next(error);
  }
};

export const createRecord = async (req, res, next) => {
  try {
    // Note: user and hierarchy details would come from req.user set by Dev 1's middleware
    const { record_type, data, ps_id, district_id } = req.body;
    
    // Fallback logic for mock users
    const created_by = req.user?.id || '00000000-0000-0000-0000-000000000000';
    const psId = ps_id || req.user?.psId;
    const districtId = district_id || req.user?.districtId;

    const newRecord = await recordsService.createRecord({
      record_type,
      data,
      ps_id: psId,
      district_id: districtId,
      created_by
    });
    
    res.status(201).json({ status: 'success', data: newRecord });
  } catch (error) {
    next(error);
  }
};

export const getRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = await recordsService.getRecord(id);
    if (!record) {
      return res.status(404).json({ status: 'error', message: 'Record not found' });
    }
    res.status(200).json({ status: 'success', data: record });
  } catch (error) {
    next(error);
  }
};

export const updateRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const changed_by = req.user?.id || '00000000-0000-0000-0000-000000000000';
    const level = req.user?.level || 'PS';
    
    const updatedRecord = await recordsService.updateRecord(id, req.body, changed_by, level);
    res.status(200).json({ status: 'success', data: updatedRecord });
  } catch (error) {
    next(error);
  }
};

export const deleteRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    await recordsService.deleteRecord(id);
    res.status(200).json({ status: 'success', message: 'Record deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getRecordRevisions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const revisions = await recordsService.getRecordRevisions(id);
    res.status(200).json({ status: 'success', data: revisions });
  } catch (error) {
    next(error);
>>>>>>> 050d70686de07c389fe62cdcf8820253124b8856
  }
};
