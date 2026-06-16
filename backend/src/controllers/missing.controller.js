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

export const createMissing = asyncHandler(async (req, res) => {
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

    const result = await db.run(
      `INSERT INTO missing_persons (
        meta_id, record_subtype, dd_fir_no, dd_fir_date, age, gender, physical_description,
        last_seen_location, found_location, date_missing_recovered, time_missing_recovered,
        informant_name, informant_contact, io_name, status, remarks,
        dd_fir_time, duty_officer, track_child_no, track_child_date, major_minor,
        zipnet_no, traced_dd_no, fir_no_year, fir_date, is_identified,
        created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        meta.id, fields.recordSubtype, fields.ddFirNo, fields.ddFirDate, fields.age, fields.gender, fields.physicalDescription,
        fields.lastSeenLocation || '', fields.foundLocation || '', fields.dateMissingRecovered, fields.timeMissingRecovered,
        fields.informantName, fields.informantContact, fields.ioName, fields.status, fields.remarks || '',
        fields.ddFirTime || '', fields.dutyOfficer || '', fields.trackChildNo || '', fields.trackChildDate || '', fields.majorMinor || 'Unknown',
        fields.zipnetNo || '', fields.tracedDdNo || '', fields.firNoYear || '', fields.firDate || '', fields.isIdentified || 'No',
        userId, userId
      ]
    );

    const missingId = result.lastID;

    if (customFields) {
      await saveCustomFields(missingId, 'MissingPerson', 'missing', district, customFields, userId);
    }

    // Write to Audit Log
    const newRecord = await db.get('SELECT * FROM missing_persons WHERE id = ?', [missingId]);
    await db.run(
      `INSERT INTO audit_logs (table_name, record_id, action, changed_by, changed_by_role, new_value, ip_address, reason) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['missing_persons', String(missingId), 'create', userId, role, JSON.stringify(newRecord), req.ip || '127.0.0.1', 'Record initialized']
    );

    await db.run('COMMIT');

    return res.status(201).json(
      new ApiResponse(201, { missingId }, 'Missing Person/Recovered Body record created successfully')
    );
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
});

export const getMissings = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo, search, submissionStatus, recordSubtype } = req.query;

  const db = await getDB();
  let query = `
    SELECT mp.*, 
           m.record_date, m.submission_status, 
           ps.name as station_name, d.name as district_name
    FROM missing_persons mp
    JOIN daily_records_meta m ON mp.meta_id = m.id
    JOIN police_stations ps ON m.ps_id = ps.id
    JOIN districts d ON m.district_id = d.id
    WHERE 1=1
  `;
  const params = [];

  // Enforce jurisdiction checks
  if (req.jurisdictionQuery.ps_id) {
    query += ' m.ps_id = ?';
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

  if (recordSubtype) {
    query += ' AND mp.record_subtype = ?';
    params.push(recordSubtype);
  }

  if (search) {
    query += ' AND (mp.dd_fir_no LIKE ? OR mp.physical_description LIKE ? OR mp.informant_name LIKE ? OR mp.io_name LIKE ?)';
    const searchVal = `%${search}%`;
    params.push(searchVal, searchVal, searchVal, searchVal);
  }

  query += ' ORDER BY mp.created_at DESC';

  const missings = await db.all(query, params);

  return res.status(200).json(
    new ApiResponse(200, { missings }, 'Missing/Recovered/Found records retrieved successfully')
  );
});

export const getMissingById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const db = await getDB();

  const target = await db.get(
    `SELECT mp.*, m.ps_id, m.district_id, m.submission_status, m.record_date,
            ps.name as station_name, d.name as district_name
     FROM missing_persons mp
     JOIN daily_records_meta m ON mp.meta_id = m.id
     JOIN police_stations ps ON m.ps_id = ps.id
     JOIN districts d ON m.district_id = d.id
     WHERE mp.id = ?`,
    [id]
  );

  if (!target) throw new ApiError(404, 'Record not found');

  await verifyRecordJurisdiction(target.meta_id, req.user);

  const customFields = await getCustomFieldValuesForRecord(id, 'MissingPerson');

  const auditLogs = await db.all(
    `SELECT a.*, u.username, u.email 
     FROM audit_logs a
     JOIN users u ON a.changed_by = u.id
     WHERE a.table_name = 'missing_persons' AND a.record_id = ?
     ORDER BY a.changed_at DESC`,
    [String(id)]
  );

  return res.status(200).json(
    new ApiResponse(200, { missing: target, customFields, auditLogs }, 'Missing Person details retrieved successfully')
  );
});

export const updateMissing = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { customFields, submissionStatus = 'draft', ...updates } = req.body;

  const db = await getDB();
  const target = await db.get('SELECT * FROM missing_persons WHERE id = ?', [id]);
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
      `UPDATE missing_persons SET 
        record_subtype = ?, dd_fir_no = ?, dd_fir_date = ?, age = ?, gender = ?, physical_description = ?,
        last_seen_location = ?, found_location = ?, date_missing_recovered = ?, time_missing_recovered = ?,
        informant_name = ?, informant_contact = ?, io_name = ?, status = ?, remarks = ?,
        dd_fir_time = ?, duty_officer = ?, track_child_no = ?, track_child_date = ?, major_minor = ?,
        zipnet_no = ?, traced_dd_no = ?, fir_no_year = ?, fir_date = ?, is_identified = ?,
        updated_by = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        updates.recordSubtype || target.record_subtype,
        updates.ddFirNo || target.dd_fir_no,
        updates.ddFirDate || target.dd_fir_date,
        updates.age !== undefined ? updates.age : target.age,
        updates.gender || target.gender,
        updates.physicalDescription || target.physical_description,
        updates.lastSeenLocation !== undefined ? updates.lastSeenLocation : target.last_seen_location,
        updates.foundLocation !== undefined ? updates.foundLocation : target.found_location,
        updates.dateMissingRecovered || target.date_missing_recovered,
        updates.timeMissingRecovered || target.time_missing_recovered,
        updates.informantName || target.informant_name,
        updates.informantContact || target.informant_contact,
        updates.ioName || target.io_name,
        updates.status || target.status,
        updates.remarks !== undefined ? updates.remarks : target.remarks,
        updates.ddFirTime !== undefined ? updates.ddFirTime : target.dd_fir_time,
        updates.dutyOfficer !== undefined ? updates.dutyOfficer : target.duty_officer,
        updates.trackChildNo !== undefined ? updates.trackChildNo : target.track_child_no,
        updates.trackChildDate !== undefined ? updates.trackChildDate : target.track_child_date,
        updates.majorMinor !== undefined ? updates.majorMinor : target.major_minor,
        updates.zipnetNo !== undefined ? updates.zipnetNo : target.zipnet_no,
        updates.tracedDdNo !== undefined ? updates.tracedDdNo : target.traced_dd_no,
        updates.firNoYear !== undefined ? updates.firNoYear : target.fir_no_year,
        updates.firDate !== undefined ? updates.firDate : target.fir_date,
        updates.isIdentified !== undefined ? updates.isIdentified : target.is_identified,
        req.user.id,
        id
      ]
    );

    if (customFields) {
      await saveCustomFields(id, 'MissingPerson', 'missing', req.user.district, customFields, req.user.id);
    }

    const updatedRecord = await db.get('SELECT * FROM missing_persons WHERE id = ?', [id]);

    await db.run(
      `INSERT INTO audit_logs (table_name, record_id, action, changed_by, changed_by_role, old_value, new_value, ip_address, reason) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['missing_persons', String(id), 'update', req.user.id, req.user.role, oldData, JSON.stringify(updatedRecord), req.ip || '127.0.0.1', 'Record details updated']
    );

    await db.run('COMMIT');
    return res.status(200).json(new ApiResponse(200, { missing: updatedRecord }, 'Record updated successfully'));
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
});
