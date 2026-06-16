import * as recordsService from './records.service.js';
import { verifyRecordAccess } from '../../middleware/rbac.middleware.js';

export const getRecords = async (req, res) => {
  const { type, status, dateFrom, dateTo } = req.query;

  try {
    const records = await recordsService.listRecords(
      type,
      { status, dateFrom, dateTo },
      req.jurisdictionQuery
    );
    return res.status(200).json({ success: true, data: records });
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
  }
};
