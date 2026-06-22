import * as service from './record-links.service.js';

export const getLinkTypes = async (req, res) => {
  try {
    const types = await service.getLinkTypes();
    return res.status(200).json({ success: true, data: types });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getLinksForRecord = async (req, res) => {
  const { recordId } = req.params;
  try {
    const links = await service.getLinksForRecord(recordId);
    return res.status(200).json({ success: true, data: links });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createLink = async (req, res) => {
  const { sourceRecordId, targetRecordId, linkTypeCode, metadata } = req.body;
  if (!sourceRecordId || !targetRecordId || !linkTypeCode) {
    return res.status(400).json({ success: false, message: 'sourceRecordId, targetRecordId, and linkTypeCode are required' });
  }
  try {
    const link = await service.createLink({
      sourceRecordId,
      targetRecordId,
      linkTypeCode,
      userId: req.user.id,
      metadata: metadata || {}
    });
    return res.status(201).json({ success: true, data: link });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

export const deleteLink = async (req, res) => {
  const { id } = req.params;
  try {
    await service.deleteLink(id, req.user.id);
    return res.status(200).json({ success: true, message: 'Link removed' });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

export const personSearch = async (req, res) => {
  const { searchTerm, fatherName, limit } = req.query;
  const { ps_id, district_id } = req.jurisdictionQuery || {};
  try {
    const results = await service.searchPersonAcrossArrests({
      searchTerm,
      fatherName,
      psId: ps_id,
      districtId: district_id,
      limit: limit ? parseInt(limit, 10) : 50
    });
    return res.status(200).json({ success: true, data: results });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
