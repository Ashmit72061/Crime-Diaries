import * as workflowService from './workflow.service.js';

export const getQueue = async (req, res, next) => {
  try {
    const level = req.user?.level || 'SHO';
    const psId = req.user?.psId;
    const districtId = req.user?.districtId;
    
    const records = await workflowService.getQueue(level, psId, districtId, req.query);
    res.status(200).json({ status: 'success', data: records });
  } catch (error) {
    next(error);
  }
};

export const getQueueCount = async (req, res, next) => {
  try {
    const level = req.user?.level || 'SHO';
    const psId = req.user?.psId;
    const districtId = req.user?.districtId;
    
    const count = await workflowService.getQueueCount(level, psId, districtId);
    res.status(200).json({ status: 'success', data: { count } });
  } catch (error) {
    next(error);
  }
};

export const submitRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
    
    const transition = await workflowService.submitRecord(id, userId);
    res.status(200).json({ status: 'success', data: transition });
  } catch (error) {
    next(error);
  }
};

export const approveRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
    const level = req.user?.level || 'SHO';
    
    const transition = await workflowService.approveRecord(id, userId, level);
    res.status(200).json({ status: 'success', data: transition });
  } catch (error) {
    next(error);
  }
};

export const sendBackRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
    const level = req.user?.level || 'SHO';
    const { comment, target_fields } = req.body;
    
    const transition = await workflowService.sendBackRecord(id, userId, level, comment, target_fields);
    res.status(200).json({ status: 'success', data: transition });
  } catch (error) {
    next(error);
  }
};

export const getRecordHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const history = await workflowService.getRecordHistory(id);
    res.status(200).json({ status: 'success', data: history });
  } catch (error) {
    next(error);
  }
};
