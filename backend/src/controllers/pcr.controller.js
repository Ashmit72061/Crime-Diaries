import { getDB } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { saveCustomFields, getCustomFieldValuesForRecord } from '../utils/customFields.helper.js';
import { verifyRecordJurisdiction } from '../middleware/jurisdiction.middleware.js';

const getOrCreateMeta = async (db, psId, distId, dateStr, userId, sessionStatus = 'draft') => {
  let meta = await db.get(
    'SELECT * FROM daily_records_meta WHERE ps_id = ? AND record_date = ?',
    [psId, dateStr]
  );

  if (meta) {
    if (meta.submission_status === 'submitted') {
      throw new ApiError(403, 'The Daily Diary for this date is already submitted and locked.');
    }
    if (sessionStatus === 'submitted') {
      await db.run(
        'UPDATE daily_records_meta SET submission_status = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['submitted', userId, meta.id]
      );
      meta.submission_status = 'submitted';
    }
  } else {
    const result = await db.run(
      `INSERT INTO daily_records_meta (record_date, ps_id, district_id, submission_status, created_by, updated_by) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [dateStr, psId, distId, sessionStatus, userId, userId]
    );
    meta = {
      id: result.lastID,
      record_date: dateStr,
      ps_id: psId,
      district_id: distId,
      submission_status: sessionStatus
    };
  }

  return meta;
};

export const createPcr = asyncHandler(async (req, res) => {
  const { role, policeStation, district, id: userId } = req.user;
  if (role !== 'ps') {
    throw new ApiError(403, 'Only Police Station users can create records.');
  }

  const { recordDate, customFields, submissionStatus = 'draft', ...fields } = req.body;
  if (!recordDate) throw new ApiError(400, 'Record date is required.');

  const db = await getDB();
  await db.run('BEGIN TRANSACTION');

  try {
    const meta = await getOrCreateMeta(db, policeStation, district, recordDate, userId, submissionStatus);

    // Calculate sequential number
    const countRow = await db.get(
      `SELECT COUNT(*) as count FROM pcr_klandras p 
       JOIN daily_records_meta m ON p.meta_id = m.id 
       WHERE m.ps_id = ? AND m.record_date = ?`,
      [policeStation, recordDate]
    );
    const seqNo = (countRow ? countRow.count : 0) + 1;

    const result = await db.run(
      `INSERT INTO pcr_klandras (
        meta_id, seq_no, gd_no, gd_date, gd_time, call_head, complainant_name, complainant_address, call_gist,
        io_name, eo_name, action_taken, status, arrival_dd_no, arrival_date, arrival_time, latitude, longitude, beat_no, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        meta.id, seqNo, fields.gdNo, fields.gdDate, fields.gdTime, fields.callHead, fields.complainantName, fields.complainantAddress, fields.callGist,
        fields.ioName, fields.eoName || '', fields.actionTaken, fields.status, fields.arrivalDdNo, fields.arrivalDate, fields.arrivalTime,
        fields.latitude || '', fields.longitude || '', fields.beatNo, userId, userId
      ]
    );

    const pcrId = result.lastID;

    if (customFields) {
      await saveCustomFields(pcrId, 'PCRKalandra', 'pcr', district, customFields, userId);
    }

    // Write to Audit Log
    const newRecord = await db.get('SELECT * FROM pcr_klandras WHERE id = ?', [pcrId]);
    await db.run(
      `INSERT INTO audit_logs (table_name, record_id, action, changed_by, changed_by_role, new_value, ip_address, reason) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['pcr_klandras', String(pcrId), 'create', userId, role, JSON.stringify(newRecord), req.ip || '127.0.0.1', 'Record initialized']
    );

    await db.run('COMMIT');

    return res.status(201).json(
      new ApiResponse(201, { pcrId, seqNo }, 'PCR Call / Kalandra record created successfully')
    );
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
});

export const getPcrs = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo, search, submissionStatus } = req.query;

  const db = await getDB();
  let query = `
    SELECT p.*, 
           m.record_date, m.submission_status, 
           ps.name as station_name, d.name as district_name
    FROM pcr_klandras p
    JOIN daily_records_meta m ON p.meta_id = m.id
    JOIN police_stations ps ON m.ps_id = ps.id
    JOIN districts d ON m.district_id = d.id
    WHERE 1=1
  `;
  const params = [];

  // Enforce jurisdiction checks
  if (req.jurisdictionQuery.ps_id) {
    query += ' AND m.ps_id = ?';
    params.push(req.jurisdictionQuery.ps_id);
  }
  if (req.jurisdictionQuery.district_id) {
    query += ' AND m.district_id = ?';
    params.push(req.jurisdictionQuery.district_id);
  }
  if (req.jurisdictionQuery.sub_division_id) {
    query += ' AND ps.sub_division_id = ?';
    params.push(req.jurisdictionQuery.sub_division_id);
  }

  if (submissionStatus) {
    query += ' AND m.submission_status = ?';
    params.push(submissionStatus);
  }

  if (dateFrom) {
    query += ' AND m.record_date >= ?';
    params.push(dateFrom);
  }
  if (dateTo) {
    query += ' AND m.record_date <= ?';
    params.push(dateTo);
  }

  if (search) {
    query += ' AND (p.complainant_name LIKE ? OR p.gd_no LIKE ? OR p.call_head LIKE ? OR p.io_name LIKE ?)';
    const searchVal = `%${search}%`;
    params.push(searchVal, searchVal, searchVal, searchVal);
  }

  query += ' ORDER BY p.created_at DESC';

  const pcrs = await db.all(query, params);

  return res.status(200).json(
    new ApiResponse(200, { pcrs }, 'PCR Calls retrieved successfully')
  );
});

export const getPcrById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const db = await getDB();

  const target = await db.get(
    `SELECT p.*, m.ps_id, m.district_id, m.submission_status, m.record_date,
            ps.name as station_name, d.name as district_name
     FROM pcr_klandras p
     JOIN daily_records_meta m ON p.meta_id = m.id
     JOIN police_stations ps ON m.ps_id = ps.id
     JOIN districts d ON m.district_id = d.id
     WHERE p.id = ?`,
    [id]
  );

  if (!target) throw new ApiError(404, 'Record not found');

  await verifyRecordJurisdiction(target.meta_id, req.user);

  const customFields = await getCustomFieldValuesForRecord(id, 'PCRKalandra');

  const auditLogs = await db.all(
    `SELECT a.*, u.username, u.email 
     FROM audit_logs a
     JOIN users u ON a.changed_by = u.id
     WHERE a.table_name = 'pcr_klandras' AND a.record_id = ?
     ORDER BY a.changed_at DESC`,
    [String(id)]
  );

  return res.status(200).json(
    new ApiResponse(200, { pcr: target, customFields, auditLogs }, 'PCR details retrieved successfully')
  );
});

export const updatePcr = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { customFields, submissionStatus = 'draft', ...updates } = req.body;

  const db = await getDB();
  const target = await db.get('SELECT * FROM pcr_klandras WHERE id = ?', [id]);
  if (!target) throw new ApiError(404, 'Record not found');

  const meta = await db.get('SELECT * FROM daily_records_meta WHERE id = ?', [target.meta_id]);
  if (meta.submission_status === 'submitted') {
    throw new ApiError(403, 'This record is submitted and locked from edits.');
  }

  await verifyRecordJurisdiction(target.meta_id, req.user);

  await db.run('BEGIN TRANSACTION');

  try {
    if (submissionStatus === 'submitted') {
      await db.run(
        'UPDATE daily_records_meta SET submission_status = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['submitted', req.user.id, meta.id]
      );
    }

    const oldData = JSON.stringify(target);

    await db.run(
      `UPDATE pcr_klandras SET 
        gd_no = ?, gd_date = ?, gd_time = ?, call_head = ?, complainant_name = ?, complainant_address = ?, call_gist = ?,
        io_name = ?, eo_name = ?, action_taken = ?, status = ?, arrival_dd_no = ?, arrival_date = ?, arrival_time = ?,
        latitude = ?, longitude = ?, beat_no = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        updates.gdNo || target.gd_no,
        updates.gdDate || target.gd_date,
        updates.gdTime || target.gd_time,
        updates.callHead || target.call_head,
        updates.complainantName || target.complainant_name,
        updates.complainantAddress || target.complainant_address,
        updates.callGist || target.call_gist,
        updates.ioName || target.io_name,
        updates.eoName !== undefined ? updates.eoName : target.eo_name,
        updates.actionTaken || target.action_taken,
        updates.status || target.status,
        updates.arrivalDdNo || target.arrival_dd_no,
        updates.arrivalDate || target.arrival_date,
        updates.arrivalTime || target.arrival_time,
        updates.latitude !== undefined ? updates.latitude : target.latitude,
        updates.longitude !== undefined ? updates.longitude : target.longitude,
        updates.beatNo || target.beat_no,
        req.user.id,
        id
      ]
    );

    if (customFields) {
      await saveCustomFields(id, 'PCRKalandra', 'pcr', req.user.district, customFields, req.user.id);
    }

    const updatedRecord = await db.get('SELECT * FROM pcr_klandras WHERE id = ?', [id]);

    await db.run(
      `INSERT INTO audit_logs (table_name, record_id, action, changed_by, changed_by_role, old_value, new_value, ip_address, reason) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['pcr_klandras', String(id), 'update', req.user.id, req.user.role, oldData, JSON.stringify(updatedRecord), req.ip || '127.0.0.1', 'Record details updated']
    );

    await db.run('COMMIT');
    return res.status(200).json(new ApiResponse(200, { pcr: updatedRecord }, 'PCR updated successfully'));
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
});
