import * as recordsService from './records.service.js';

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
  }
};
