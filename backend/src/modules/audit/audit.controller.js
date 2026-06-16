import db from '../../config/db.js';

const parseJsonField = (val) => {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch (e) { return val; }
  }
  return val;
};

export const getRecordAudit = async (req, res) => {
  const { recordId } = req.params;

  try {
    const revisions = await db('record_revisions')
      .select('record_revisions.*', 'u.username', 'u.badge_no', 'u.name_en', 'u.name_hi')
      .leftJoin('users as u', 'record_revisions.changed_by', 'u.id')
      .where('record_revisions.record_id', recordId)
      .orderBy('record_revisions.revision_number', 'asc');

    const formatted = revisions.map(r => ({
      ...r,
      field_changes: parseJsonField(r.field_changes)
    }));

    return res.status(200).json({
      status: 'success',
      success: true,
      data: formatted
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
};

export const getUserAudit = async (req, res) => {
  const { userId } = req.params;
  const { from, to } = req.query;
  const page = parseInt(req.query.page || 1, 10);
  const limit = parseInt(req.query.limit || 20, 10);
  const offset = (page - 1) * limit;

  try {
    let query = db('record_revisions')
      .select('record_revisions.*', 'r.record_type', 'r.current_status')
      .leftJoin('records as r', 'record_revisions.record_id', 'r.id')
      .where('record_revisions.changed_by', userId);

    let countQuery = db('record_revisions').where('changed_by', userId);

    if (from) {
      query = query.where('record_revisions.changed_at', '>=', from);
      countQuery = countQuery.where('changed_at', '>=', from);
    }
    if (to) {
      query = query.where('record_revisions.changed_at', '<=', to);
      countQuery = countQuery.where('changed_at', '<=', to);
    }

    const totalRes = await countQuery.count('* as count').first();
    const total = parseInt(totalRes.count || 0, 10);

    const list = await query
      .orderBy('record_revisions.changed_at', 'desc')
      .limit(limit)
      .offset(offset);

    const formatted = list.map(r => ({
      ...r,
      field_changes: parseJsonField(r.field_changes)
    }));

    return res.status(200).json({
      status: 'success',
      success: true,
      data: formatted,
      meta: { page, limit, total }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const list = await db('audit_logs')
      .select('audit_logs.*', 'u.username as operator_name', 'u.badge_no')
      .leftJoin('users as u', 'audit_logs.changed_by_id', 'u.id')
      .orderBy('audit_logs.changed_at', 'desc')
      .limit(200);

    return res.status(200).json({
      status: 'success',
      success: true,
      data: list
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
};
