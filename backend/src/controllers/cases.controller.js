import { getDB } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { saveCustomFields, getCustomFieldValuesForRecord } from '../utils/customFields.helper.js';
import { verifyRecordJurisdiction } from '../middleware/jurisdiction.middleware.js';

const generateCaseUid = async (db, psId, dateStr) => {
  const cleanDate = dateStr.replace(/[^0-9]/g, '').slice(0, 8); // YYYYMMDD
  const cleanPs = psId.replace('PS_', '');
  
  // Count cases for this PS on this date
  const countRow = await db.get(
    `SELECT COUNT(*) as count FROM cases c 
     JOIN daily_records_meta m ON c.meta_id = m.id 
     WHERE m.ps_id = ? AND m.record_date = ?`,
    [psId, dateStr]
  );
  
  const seq = String((countRow ? countRow.count : 0) + 1).padStart(4, '0');
  return `CASE-${cleanPs}-${cleanDate}-${seq}`;
};

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

export const createCase = asyncHandler(async (req, res) => {
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
    const uid = await generateCaseUid(db, policeStation, recordDate);

    const result = await db.run(
      `INSERT INTO cases (
        meta_id, uid, fir_no, fir_date, gd_no, gd_date, gd_time, occurrence_date, occurrence_time, occurrence_place, brief_facts,
        case_head_id, act_name, section_text, complainant_name, complainant_address, accused_name, accused_address,
        arrest_date, io_name, io_pis, io_mobile, property_description, property_status, stolen_property, recovered_property,
        status, status_other, remarks, cctns_flag, etheft_flag, emvt_flag, ncrp_flag, zero_fir_flag, case_type, case_type_other, sid_no, beat_no,
        rc_no, theft_from, time_of_theft, motive, hotspot, agency, agency_order_date, pending_investigation_age, victim_mobile, io_position,
        accused_count, accused_victim_relation, stolen_article_type, weapon_used, vehicle_used, work_out, date_of_work_out, disposed_date, pending_investigation_reason,
        created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        meta.id, uid, fields.firNo || '', fields.firDate || null, fields.gdNo, fields.gdDate, fields.gdTime,
        fields.occurrenceDate, fields.occurrenceTime || null, fields.occurrencePlace, fields.briefFacts, fields.caseHeadId, fields.actName,
        fields.sectionText, fields.complainantName, fields.complainantAddress, fields.accusedName, fields.accusedAddress,
        fields.arrestDate || null, fields.ioName, fields.ioPis, fields.ioMobile, fields.propertyDescription || '',
        fields.propertyStatus, fields.stolenProperty || null, fields.recoveredProperty || null, fields.status, fields.statusOther || null, fields.remarks || '',
        fields.cctnsFlag ? 1 : 0, fields.etheftFlag ? 1 : 0, fields.emvtFlag ? 1 : 0, fields.ncrpFlag ? 1 : 0, fields.zeroFirFlag ? 1 : 0,
        fields.caseType || null, fields.caseTypeOther || null, fields.sidNo || null, fields.beatNo,
        fields.rcNo || '', fields.theftFrom || '', fields.timeOfTheft || '', fields.motive || '', fields.hotspot || '', fields.agency || '', fields.agencyOrderDate || '',
        fields.pendingInvestigationAge || '', fields.victimMobile || '', fields.ioPosition || '', parseInt(fields.accusedCount || 0, 10),
        fields.accusedVictimRelation || '', fields.stolenArticleType || '', fields.weaponUsed || '', fields.vehicleUsed || '',
        fields.workOut || '', fields.dateOfWorkOut || '', fields.disposedDate || '', fields.pendingInvestigationReason || '',
        userId, userId
      ]
    );

    const caseId = result.lastID;

    if (fields.accusedList && Array.isArray(fields.accusedList)) {
      for (const acc of fields.accusedList) {
        await db.run(
          `INSERT INTO case_accused (case_id, name, father_name, address, arrest_date, age, state_origin, recovery_details)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [caseId, acc.name, acc.fatherName || '', acc.address || '', acc.arrestDate || null, acc.age ? parseInt(acc.age, 10) : null, acc.stateOrigin || '', acc.recoveryDetails || '']
        );
      }
    }

    if (customFields) {
      await saveCustomFields(caseId, 'Case', 'cases', district, customFields, userId);
    }

    // Write to Audit Log
    const newRecord = await db.get('SELECT * FROM cases WHERE id = ?', [caseId]);
    await db.run(
      `INSERT INTO audit_logs (table_name, record_id, action, changed_by, changed_by_role, new_value, ip_address, reason) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['cases', String(caseId), 'create', userId, role, JSON.stringify(newRecord), req.ip || '127.0.0.1', 'Record initialized']
    );

    await db.run('COMMIT');

    return res.status(201).json(
      new ApiResponse(201, { caseId, uid }, 'Case created successfully')
    );
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
});

export const getCases = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo, search, submissionStatus } = req.query;

  const db = await getDB();
  let query = `
    SELECT c.*, 
           m.record_date, m.submission_status, 
           ps.name as station_name, d.name as district_name,
           ch.code as case_head_code, ch.description as case_head_desc,
           ch_override.code as override_code, ch_override.description as override_desc
    FROM cases c
    JOIN daily_records_meta m ON c.meta_id = m.id
    JOIN police_stations ps ON m.ps_id = ps.id
    JOIN districts d ON m.district_id = d.id
    JOIN case_heads ch ON c.case_head_id = ch.id
    LEFT JOIN case_heads ch_override ON c.case_head_dcp_override = ch_override.id
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
    query += ' AND (c.uid LIKE ? OR c.fir_no LIKE ? OR c.gd_no LIKE ? OR c.complainant_name LIKE ? OR c.accused_name LIKE ?)';
    const searchVal = `%${search}%`;
    params.push(searchVal, searchVal, searchVal, searchVal, searchVal);
  }

  query += ' ORDER BY c.created_at DESC';

  const cases = await db.all(query, params);

  return res.status(200).json(
    new ApiResponse(200, { cases }, 'Cases retrieved successfully')
  );
});

export const getCaseById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const db = await getDB();

  const target = await db.get(
    `SELECT c.*, m.ps_id, m.district_id, m.submission_status, m.record_date,
            ps.name as station_name, d.name as district_name,
            ch.code as case_head_code, ch.description as case_head_desc,
            ch_override.code as override_code, ch_override.description as override_desc
     FROM cases c
     JOIN daily_records_meta m ON c.meta_id = m.id
     JOIN police_stations ps ON m.ps_id = ps.id
     JOIN districts d ON m.district_id = d.id
     JOIN case_heads ch ON c.case_head_id = ch.id
     LEFT JOIN case_heads ch_override ON c.case_head_dcp_override = ch_override.id
     WHERE c.id = ?`,
    [id]
  );

  if (!target) throw new ApiError(404, 'Case record not found');

  await verifyRecordJurisdiction(target.meta_id, req.user);

  const customFields = await getCustomFieldValuesForRecord(id, 'Case');

  const accusedList = await db.all(
    `SELECT * FROM case_accused WHERE case_id = ?`,
    [id]
  );

  const auditLogs = await db.all(
    `SELECT a.*, u.username, u.email 
     FROM audit_logs a
     JOIN users u ON a.changed_by = u.id
     WHERE a.table_name = 'cases' AND a.record_id = ?
     ORDER BY a.changed_at DESC`,
    [String(id)]
  );

  return res.status(200).json(
    new ApiResponse(200, { case: target, customFields, accusedList, auditLogs }, 'Case details retrieved successfully')
  );
});

export const updateCase = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { customFields, submissionStatus = 'draft', ...updates } = req.body;

  const db = await getDB();
  const target = await db.get('SELECT * FROM cases WHERE id = ?', [id]);
  if (!target) throw new ApiError(404, 'Case record not found');

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
      `UPDATE cases SET 
        fir_no = ?, fir_date = ?, gd_no = ?, gd_date = ?, gd_time = ?, occurrence_date = ?, occurrence_time = ?, occurrence_place = ?, brief_facts = ?,
        case_head_id = ?, act_name = ?, section_text = ?, complainant_name = ?, complainant_address = ?, accused_name = ?, accused_address = ?,
        arrest_date = ?, io_name = ?, io_pis = ?, io_mobile = ?, property_description = ?, property_status = ?, stolen_property = ?, recovered_property = ?,
        status = ?, status_other = ?, remarks = ?, cctns_flag = ?, etheft_flag = ?, emvt_flag = ?, ncrp_flag = ?, zero_fir_flag = ?, case_type = ?, case_type_other = ?, sid_no = ?, beat_no = ?,
        rc_no = ?, theft_from = ?, time_of_theft = ?, motive = ?, hotspot = ?, agency = ?, agency_order_date = ?, pending_investigation_age = ?, victim_mobile = ?, io_position = ?,
        accused_count = ?, accused_victim_relation = ?, stolen_article_type = ?, weapon_used = ?, vehicle_used = ?, work_out = ?, date_of_work_out = ?, disposed_date = ?, pending_investigation_reason = ?,
        updated_by = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        updates.firNo !== undefined ? updates.firNo : target.fir_no,
        updates.firDate !== undefined ? updates.firDate : target.fir_date,
        updates.gdNo || target.gd_no,
        updates.gdDate || target.gd_date,
        updates.gdTime || target.gd_time,
        updates.occurrenceDate || target.occurrence_date,
        updates.occurrenceTime || target.occurrence_time,
        updates.occurrencePlace || target.occurrence_place,
        updates.briefFacts || target.brief_facts,
        updates.caseHeadId || target.case_head_id,
        updates.actName || target.act_name,
        updates.sectionText || target.section_text,
        updates.complainantName || target.complainant_name,
        updates.complainantAddress || target.complainant_address,
        updates.accusedName || target.accused_name,
        updates.accusedAddress || target.accused_address,
        updates.arrestDate !== undefined ? updates.arrestDate : target.arrest_date,
        updates.ioName || target.io_name,
        updates.ioPis || target.io_pis,
        updates.ioMobile || target.io_mobile,
        updates.propertyDescription !== undefined ? updates.propertyDescription : target.property_description,
        updates.propertyStatus || target.property_status,
        updates.stolenProperty !== undefined ? updates.stolenProperty : target.stolen_property,
        updates.recoveredProperty !== undefined ? updates.recoveredProperty : target.recovered_property,
        updates.status || target.status,
        updates.statusOther !== undefined ? updates.statusOther : target.status_other,
        updates.remarks !== undefined ? updates.remarks : target.remarks,
        updates.cctnsFlag !== undefined ? (updates.cctnsFlag ? 1 : 0) : target.cctns_flag,
        updates.etheftFlag !== undefined ? (updates.etheftFlag ? 1 : 0) : target.etheft_flag,
        updates.emvtFlag !== undefined ? (updates.emvtFlag ? 1 : 0) : target.emvt_flag,
        updates.ncrpFlag !== undefined ? (updates.ncrpFlag ? 1 : 0) : target.ncrp_flag,
        updates.zeroFirFlag !== undefined ? (updates.zeroFirFlag ? 1 : 0) : target.zero_fir_flag,
        updates.caseType || target.case_type,
        updates.caseTypeOther !== undefined ? updates.caseTypeOther : target.case_type_other,
        updates.sidNo !== undefined ? updates.sidNo : target.sid_no,
        updates.beatNo || target.beat_no,
        updates.rcNo !== undefined ? updates.rcNo : target.rc_no,
        updates.theftFrom !== undefined ? updates.theftFrom : target.theft_from,
        updates.timeOfTheft !== undefined ? updates.timeOfTheft : target.time_of_theft,
        updates.motive !== undefined ? updates.motive : target.motive,
        updates.hotspot !== undefined ? updates.hotspot : target.hotspot,
        updates.agency !== undefined ? updates.agency : target.agency,
        updates.agencyOrderDate !== undefined ? updates.agencyOrderDate : target.agency_order_date,
        updates.pendingInvestigationAge !== undefined ? updates.pendingInvestigationAge : target.pending_investigation_age,
        updates.victimMobile !== undefined ? updates.victimMobile : target.victim_mobile,
        updates.ioPosition !== undefined ? updates.ioPosition : target.io_position,
        updates.accusedCount !== undefined ? parseInt(updates.accusedCount || 0, 10) : target.accused_count,
        updates.accusedVictimRelation !== undefined ? updates.accusedVictimRelation : target.accused_victim_relation,
        updates.stolenArticleType !== undefined ? updates.stolenArticleType : target.stolen_article_type,
        updates.weaponUsed !== undefined ? updates.weaponUsed : target.weapon_used,
        updates.vehicleUsed !== undefined ? updates.vehicleUsed : target.vehicle_used,
        updates.workOut !== undefined ? updates.workOut : target.work_out,
        updates.dateOfWorkOut !== undefined ? updates.dateOfWorkOut : target.date_of_work_out,
        updates.disposedDate !== undefined ? updates.disposedDate : target.disposed_date,
        updates.pendingInvestigationReason !== undefined ? updates.pendingInvestigationReason : target.pending_investigation_reason,
        req.user.id,
        id
      ]
    );

    if (updates.accusedList && Array.isArray(updates.accusedList)) {
      await db.run('DELETE FROM case_accused WHERE case_id = ?', [id]);
      for (const acc of updates.accusedList) {
        await db.run(
          `INSERT INTO case_accused (case_id, name, father_name, address, arrest_date, age, state_origin, recovery_details)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, acc.name, acc.fatherName || '', acc.address || '', acc.arrestDate || null, acc.age ? parseInt(acc.age, 10) : null, acc.stateOrigin || '', acc.recoveryDetails || '']
        );
      }
    }

    if (customFields) {
      await saveCustomFields(id, 'Case', 'cases', req.user.district, customFields, req.user.id);
    }

    const updatedRecord = await db.get('SELECT * FROM cases WHERE id = ?', [id]);

    await db.run(
      `INSERT INTO audit_logs (table_name, record_id, action, changed_by, changed_by_role, old_value, new_value, ip_address, reason) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['cases', String(id), 'update', req.user.id, req.user.role, oldData, JSON.stringify(updatedRecord), req.ip || '127.0.0.1', 'Record details updated']
    );

    await db.run('COMMIT');
    return res.status(200).json(new ApiResponse(200, { case: updatedRecord }, 'Case updated successfully'));
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
});

export const overrideCaseHead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { caseHeadId, reason } = req.body;

  if (req.user.role !== 'dcp') {
    throw new ApiError(403, 'Only District DCPs can modify case head classifications.');
  }

  if (!caseHeadId) throw new ApiError(400, 'New Case Head ID is required.');
  if (!reason || reason.trim().length < 10) {
    throw new ApiError(400, 'A mandatory reason of at least 10 characters is required.');
  }

  const db = await getDB();
  const target = await db.get('SELECT * FROM cases WHERE id = ?', [id]);
  if (!target) throw new ApiError(404, 'Case record not found');

  await verifyRecordJurisdiction(target.meta_id, req.user);

  const oldCaseHeadId = target.case_head_dcp_override || target.case_head_id;

  await db.run('BEGIN TRANSACTION');

  try {
    await db.run(
      'UPDATE cases SET case_head_dcp_override = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [caseHeadId, req.user.id, id]
    );

    const oldHeadObj = await db.get('SELECT code FROM case_heads WHERE id = ?', [oldCaseHeadId]);
    const newHeadObj = await db.get('SELECT code FROM case_heads WHERE id = ?', [caseHeadId]);

    // Write synchronous Audit Log entry
    await db.run(
      `INSERT INTO audit_logs (table_name, record_id, action, changed_by, changed_by_role, field_name, old_value, new_value, ip_address, reason) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'cases', String(id), 'override', req.user.id, req.user.role, 'case_head_dcp_override',
        oldHeadObj ? oldHeadObj.code : String(oldCaseHeadId),
        newHeadObj ? newHeadObj.code : String(caseHeadId),
        req.ip || '127.0.0.1', reason.trim()
      ]
    );

    await db.run('COMMIT');

    const updatedRecord = await db.get('SELECT * FROM cases WHERE id = ?', [id]);
    return res.status(200).json(new ApiResponse(200, { case: updatedRecord }, 'Case Head overridden successfully'));
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
});
