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

export const createArrest = asyncHandler(async (req, res) => {
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

    // Calculate sequential number for this PS and date
    const countRow = await db.get(
      `SELECT COUNT(*) as count FROM arrests a 
       JOIN daily_records_meta m ON a.meta_id = m.id 
       WHERE m.ps_id = ? AND m.record_date = ?`,
      [policeStation, recordDate]
    );
    const seqNo = (countRow ? countRow.count : 0) + 1;

    // Optional validations if linked to a Case
    if (fields.linkedCaseId) {
      const parentCase = await db.get('SELECT * FROM cases WHERE id = ?', [fields.linkedCaseId]);
      if (parentCase && parentCase.fir_date && new Date(fields.arrestDate) < new Date(parentCase.fir_date)) {
        throw new ApiError(400, 'Arrest date cannot be earlier than the linked Case FIR Date');
      }
    }

    const result = await db.run(
      `INSERT INTO arrests (
        meta_id, seq_no, linked_case_id, linked_fir_dd_no, linked_fir_dd_date, linked_fir_dd_time,
        act_name, act_sections, arrested_name, arrested_address, arrest_date, arrest_time, arrest_place,
        informant_name, informant_address, informant_tel, nafis_prepared, dossier_prepared, search_slip_prepared,
        address_verified, verifying_officer_name, verifying_officer_rank, crime_head_id, status, status_other_text,
        recovered_material, special_scheme, accused_photo, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        meta.id, seqNo, fields.linkedCaseId || null, fields.linkedFirDdNo || '', fields.linkedFirDdDate || null, fields.linkedFirDdTime || '',
        fields.actName, fields.actSections, fields.arrestedName, fields.arrestedAddress, fields.arrestDate, fields.arrestTime, fields.arrestPlace,
        fields.informantName, fields.informantAddress, fields.informantTel, fields.nafisPrepared, fields.dossierPrepared, fields.searchSlipPrepared,
        fields.addressVerified, fields.verifyingOfficerName || '', fields.verifyingOfficerRank || '', fields.crimeHeadId, fields.status,
        fields.statusOtherText || '', fields.recoveredMaterial || '', fields.specialScheme || 'None', fields.accusedPhoto || null, userId, userId
      ]
    );

    const arrestId = result.lastID;

    if (customFields) {
      await saveCustomFields(arrestId, 'Arrest', 'arrests', district, customFields, userId);
    }

    // Write to Audit Log
    const newRecord = await db.get('SELECT * FROM arrests WHERE id = ?', [arrestId]);
    await db.run(
      `INSERT INTO audit_logs (table_name, record_id, action, changed_by, changed_by_role, new_value, ip_address, reason) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['arrests', String(arrestId), 'create', userId, role, JSON.stringify(newRecord), req.ip || '127.0.0.1', 'Record initialized']
    );

    await db.run('COMMIT');

    return res.status(201).json(
      new ApiResponse(201, { arrestId, seqNo }, 'Arrest record created successfully')
    );
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
});

export const getArrests = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo, search, submissionStatus } = req.query;

  const db = await getDB();
  let query = `
    SELECT a.*, 
           m.record_date, m.submission_status, 
           ps.name as station_name, d.name as district_name,
           ch.code as crime_head_code, ch.description as crime_head_desc,
           ch_override.code as override_code, ch_override.description as override_desc
    FROM arrests a
    JOIN daily_records_meta m ON a.meta_id = m.id
    JOIN police_stations ps ON m.ps_id = ps.id
    JOIN districts d ON m.district_id = d.id
    JOIN case_heads ch ON a.crime_head_id = ch.id
    LEFT JOIN case_heads ch_override ON a.crime_head_dcp_override = ch_override.id
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
    query += ' AND (a.arrested_name LIKE ? OR a.arrested_address LIKE ? OR a.linked_fir_dd_no LIKE ? OR a.verifying_officer_name LIKE ?)';
    const searchVal = `%${search}%`;
    params.push(searchVal, searchVal, searchVal, searchVal);
  }

  query += ' ORDER BY a.created_at DESC';

  const arrests = await db.all(query, params);

  return res.status(200).json(
    new ApiResponse(200, { arrests }, 'Arrests retrieved successfully')
  );
});

export const getArrestById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const db = await getDB();

  const target = await db.get(
    `SELECT a.*, m.ps_id, m.district_id, m.submission_status, m.record_date,
            ps.name as station_name, d.name as district_name,
            ch.code as crime_head_code, ch.description as crime_head_desc,
            ch_override.code as override_code, ch_override.description as override_desc
     FROM arrests a
     JOIN daily_records_meta m ON a.meta_id = m.id
     JOIN police_stations ps ON m.ps_id = ps.id
     JOIN districts d ON m.district_id = d.id
     JOIN case_heads ch ON a.crime_head_id = ch.id
     LEFT JOIN case_heads ch_override ON a.crime_head_dcp_override = ch_override.id
     WHERE a.id = ?`,
    [id]
  );

  if (!target) throw new ApiError(404, 'Arrest record not found');

  await verifyRecordJurisdiction(target.meta_id, req.user);

  const customFields = await getCustomFieldValuesForRecord(id, 'Arrest');

  const auditLogs = await db.all(
    `SELECT a.*, u.username, u.email 
     FROM audit_logs a
     JOIN users u ON a.changed_by = u.id
     WHERE a.table_name = 'arrests' AND a.record_id = ?
     ORDER BY a.changed_at DESC`,
    [String(id)]
  );

  return res.status(200).json(
    new ApiResponse(200, { arrest: target, customFields, auditLogs }, 'Arrest details retrieved successfully')
  );
});

export const updateArrest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { customFields, submissionStatus = 'draft', ...updates } = req.body;

  const db = await getDB();
  const target = await db.get('SELECT * FROM arrests WHERE id = ?', [id]);
  if (!target) throw new ApiError(404, 'Arrest record not found');

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
      `UPDATE arrests SET 
        linked_case_id = ?, linked_fir_dd_no = ?, linked_fir_dd_date = ?, linked_fir_dd_time = ?,
        act_name = ?, act_sections = ?, arrested_name = ?, arrested_address = ?, arrest_date = ?, arrest_time = ?, arrest_place = ?,
        informant_name = ?, informant_address = ?, informant_tel = ?, nafis_prepared = ?, dossier_prepared = ?, search_slip_prepared = ?,
        address_verified = ?, verifying_officer_name = ?, verifying_officer_rank = ?, crime_head_id = ?, status = ?, status_other_text = ?,
        recovered_material = ?, special_scheme = ?, accused_photo = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        updates.linkedCaseId !== undefined ? updates.linkedCaseId : target.linked_case_id,
        updates.linkedFirDdNo !== undefined ? updates.linkedFirDdNo : target.linked_fir_dd_no,
        updates.linkedFirDdDate !== undefined ? updates.linkedFirDdDate : target.linked_fir_dd_date,
        updates.linkedFirDdTime !== undefined ? updates.linkedFirDdTime : target.linked_fir_dd_time,
        updates.actName || target.act_name,
        updates.actSections || target.act_sections,
        updates.arrestedName || target.arrested_name,
        updates.arrestedAddress || target.arrested_address,
        updates.arrestDate || target.arrest_date,
        updates.arrestTime || target.arrest_time,
        updates.arrestPlace || target.arrest_place,
        updates.informantName || target.informant_name,
        updates.informantAddress || target.informant_address,
        updates.informantTel || target.informant_tel,
        updates.nafisPrepared || target.nafis_prepared,
        updates.dossierPrepared || target.dossier_prepared,
        updates.searchSlipPrepared || target.search_slip_prepared,
        updates.addressVerified || target.address_verified,
        updates.verifyingOfficerName !== undefined ? updates.verifyingOfficerName : target.verifying_officer_name,
        updates.verifyingOfficerRank !== undefined ? updates.verifyingOfficerRank : target.verifying_officer_rank,
        updates.crimeHeadId || target.crime_head_id,
        updates.status || target.status,
        updates.statusOtherText !== undefined ? updates.statusOtherText : target.status_other_text,
        updates.recoveredMaterial !== undefined ? updates.recoveredMaterial : target.recovered_material,
        updates.specialScheme || target.special_scheme,
        updates.accusedPhoto !== undefined ? updates.accusedPhoto : target.accused_photo,
        req.user.id,
        id
      ]
    );

    if (customFields) {
      await saveCustomFields(id, 'Arrest', 'arrests', req.user.district, customFields, req.user.id);
    }

    const updatedRecord = await db.get('SELECT * FROM arrests WHERE id = ?', [id]);

    await db.run(
      `INSERT INTO audit_logs (table_name, record_id, action, changed_by, changed_by_role, old_value, new_value, ip_address, reason) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['arrests', String(id), 'update', req.user.id, req.user.role, oldData, JSON.stringify(updatedRecord), req.ip || '127.0.0.1', 'Record details updated']
    );

    await db.run('COMMIT');
    return res.status(200).json(new ApiResponse(200, { arrest: updatedRecord }, 'Arrest updated successfully'));
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
});

export const overrideCrimeHead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { crimeHeadId, reason } = req.body;

  if (req.user.role !== 'dcp') {
    throw new ApiError(403, 'Only District DCPs can modify crime head classifications.');
  }

  if (!crimeHeadId) throw new ApiError(400, 'New Crime Head ID is required.');
  if (!reason || reason.trim().length < 10) {
    throw new ApiError(400, 'A mandatory reason of at least 10 characters is required.');
  }

  const db = await getDB();
  const target = await db.get('SELECT * FROM arrests WHERE id = ?', [id]);
  if (!target) throw new ApiError(404, 'Arrest record not found');

  await verifyRecordJurisdiction(target.meta_id, req.user);

  const oldCrimeHeadId = target.crime_head_dcp_override || target.crime_head_id;

  await db.run('BEGIN TRANSACTION');

  try {
    await db.run(
      'UPDATE arrests SET crime_head_dcp_override = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [crimeHeadId, req.user.id, id]
    );

    const oldHeadObj = await db.get('SELECT code FROM case_heads WHERE id = ?', [oldCrimeHeadId]);
    const newHeadObj = await db.get('SELECT code FROM case_heads WHERE id = ?', [crimeHeadId]);

    // Write synchronous Audit Log entry
    await db.run(
      `INSERT INTO audit_logs (table_name, record_id, action, changed_by, changed_by_role, field_name, old_value, new_value, ip_address, reason) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'arrests', String(id), 'override', req.user.id, req.user.role, 'crime_head_dcp_override',
        oldHeadObj ? oldHeadObj.code : String(oldCrimeHeadId),
        newHeadObj ? newHeadObj.code : String(crimeHeadId),
        req.ip || '127.0.0.1', reason.trim()
      ]
    );

    await db.run('COMMIT');

    const updatedRecord = await db.get('SELECT * FROM arrests WHERE id = ?', [id]);
    return res.status(200).json(new ApiResponse(200, { arrest: updatedRecord }, 'Crime Head overridden successfully'));
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
});
