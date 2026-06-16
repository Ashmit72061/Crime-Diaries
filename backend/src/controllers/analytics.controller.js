import { getDB } from '../config/db.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import exceljs from 'exceljs';

export const getSummaryCounts = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo } = req.query;
  const db = await getDB();

  // Helper to build WHERE conditions
  let whereClause = " WHERE m.submission_status = 'submitted'";
  const params = [];

  if (req.jurisdictionQuery.ps_id) {
    whereClause += ' AND m.ps_id = ?';
    params.push(req.jurisdictionQuery.ps_id);
  }
  if (req.jurisdictionQuery.district_id) {
    whereClause += ' AND m.district_id = ?';
    params.push(req.jurisdictionQuery.district_id);
  }
  if (req.jurisdictionQuery.sub_division_id) {
    whereClause += ' AND ps.sub_division_id = ?';
    params.push(req.jurisdictionQuery.sub_division_id);
  }

  const explicitDistricts = req.query.districts ? req.query.districts.split(',') : null;
  if (explicitDistricts && explicitDistricts.length > 0) {
    whereClause += ` AND m.district_id IN (${explicitDistricts.map(() => '?').join(',')})`;
    params.push(...explicitDistricts);
  }

  const explicitSubDivs = req.query.subDivisions ? req.query.subDivisions.split(',') : null;
  if (explicitSubDivs && explicitSubDivs.length > 0) {
    whereClause += ` AND ps.sub_division_id IN (${explicitSubDivs.map(() => '?').join(',')})`;
    params.push(...explicitSubDivs);
  }

  const explicitStations = req.query.stations ? req.query.stations.split(',') : null;
  if (explicitStations && explicitStations.length > 0) {
    whereClause += ` AND m.ps_id IN (${explicitStations.map(() => '?').join(',')})`;
    params.push(...explicitStations);
  }

  if (dateFrom) {
    whereClause += ' AND m.record_date >= ?';
    params.push(dateFrom);
  }
  if (dateTo) {
    whereClause += ' AND m.record_date <= ?';
    params.push(dateTo);
  }

  // Count Cases
  let casesWhere = whereClause;
  let casesParams = [...params];
  const explicitBeats = req.query.beats ? req.query.beats.split(',').map(b => b.trim()) : null;
  if (explicitBeats && explicitBeats.length > 0) {
    casesWhere += ` AND c.beat_no IN (${explicitBeats.map(() => '?').join(',')})`;
    casesParams.push(...explicitBeats);
  }
  const casesQuery = `
    SELECT COUNT(*) as count FROM cases c 
    JOIN daily_records_meta m ON c.meta_id = m.id
    JOIN police_stations ps ON m.ps_id = ps.id
    ${casesWhere}
  `;
  const casesResult = await db.get(casesQuery, casesParams);

  // Count Arrests
  const arrestsQuery = `
    SELECT COUNT(*) as count FROM arrests a 
    JOIN daily_records_meta m ON a.meta_id = m.id
    JOIN police_stations ps ON m.ps_id = ps.id
    ${whereClause}
  `;
  const arrestsResult = await db.get(arrestsQuery, params);

  // Count PCR
  const pcrQuery = `
    SELECT COUNT(*) as count FROM pcr_klandras p 
    JOIN daily_records_meta m ON p.meta_id = m.id
    JOIN police_stations ps ON m.ps_id = ps.id
    ${whereClause}
  `;
  const pcrResult = await db.get(pcrQuery, params);

  // Count Missing
  const missingQuery = `
    SELECT COUNT(*) as count FROM missing_persons mp 
    JOIN daily_records_meta m ON mp.meta_id = m.id
    JOIN police_stations ps ON m.ps_id = ps.id
    ${whereClause}
  `;
  const missingResult = await db.get(missingQuery, params);

  return res.status(200).json(
    new ApiResponse(200, {
      summary: {
        cases: casesResult ? casesResult.count : 0,
        arrests: arrestsResult ? arrestsResult.count : 0,
        pcr: pcrResult ? pcrResult.count : 0,
        missing: missingResult ? missingResult.count : 0,
      }
    }, 'Summary counts retrieved successfully')
  );
});

export const getTrends = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo, recordType = 'cases' } = req.query;
  const db = await getDB();

  let tableName = 'cases';
  let classField = 'c.case_head_id';
  let overrideJoin = 'LEFT JOIN case_heads ch_override ON c.case_head_dcp_override = ch_override.id';
  
  if (recordType === 'arrests') {
    tableName = 'arrests';
    classField = 'c.crime_head_id';
    overrideJoin = 'LEFT JOIN case_heads ch_override ON c.crime_head_dcp_override = ch_override.id';
  } else if (recordType === 'pcr') {
    tableName = 'pcr_klandras';
  } else if (recordType === 'missing') {
    tableName = 'missing_persons';
  }

  let whereClause = " WHERE m.submission_status = 'submitted'";
  const params = [];

  if (req.jurisdictionQuery.ps_id) {
    whereClause += ' AND m.ps_id = ?';
    params.push(req.jurisdictionQuery.ps_id);
  }
  if (req.jurisdictionQuery.district_id) {
    whereClause += ' AND m.district_id = ?';
    params.push(req.jurisdictionQuery.district_id);
  }
  if (req.jurisdictionQuery.sub_division_id) {
    whereClause += ' AND ps.sub_division_id = ?';
    params.push(req.jurisdictionQuery.sub_division_id);
  }

  const explicitDistricts = req.query.districts ? req.query.districts.split(',') : null;
  if (explicitDistricts && explicitDistricts.length > 0) {
    whereClause += ` AND m.district_id IN (${explicitDistricts.map(() => '?').join(',')})`;
    params.push(...explicitDistricts);
  }

  const explicitSubDivs = req.query.subDivisions ? req.query.subDivisions.split(',') : null;
  if (explicitSubDivs && explicitSubDivs.length > 0) {
    whereClause += ` AND ps.sub_division_id IN (${explicitSubDivs.map(() => '?').join(',')})`;
    params.push(...explicitSubDivs);
  }

  const explicitStations = req.query.stations ? req.query.stations.split(',') : null;
  if (explicitStations && explicitStations.length > 0) {
    whereClause += ` AND m.ps_id IN (${explicitStations.map(() => '?').join(',')})`;
    params.push(...explicitStations);
  }

  if (dateFrom) {
    whereClause += ' AND m.record_date >= ?';
    params.push(dateFrom);
  }
  if (dateTo) {
    whereClause += ' AND m.record_date <= ?';
    params.push(dateTo);
  }

  const explicitBeats = req.query.beats ? req.query.beats.split(',').map(b => b.trim()) : null;
  if (explicitBeats && explicitBeats.length > 0 && recordType === 'cases') {
    whereClause += ` AND c.beat_no IN (${explicitBeats.map(() => '?').join(',')})`;
    params.push(...explicitBeats);
  }

  let query = '';
  if (recordType === 'cases' || recordType === 'arrests') {
    query = `
      SELECT strftime('%Y', c.created_at) as year,
             strftime('%m', c.created_at) as month,
             COALESCE(ch_override.code, ch.code) as classification,
             COALESCE(ch_override.description, ch.description) as classification_desc,
             COUNT(*) as count
      FROM ${tableName} c
      JOIN daily_records_meta m ON c.meta_id = m.id
      JOIN police_stations ps ON m.ps_id = ps.id
      JOIN case_heads ch ON ${classField} = ch.id
      ${overrideJoin}
      ${whereClause}
      GROUP BY year, month, classification
      ORDER BY year ASC, month ASC
    `;
  } else if (recordType === 'pcr') {
    query = `
      SELECT strftime('%Y', c.created_at) as year,
             strftime('%m', c.created_at) as month,
             c.call_head as classification,
             c.call_head as classification_desc,
             COUNT(*) as count
      FROM pcr_klandras c
      JOIN daily_records_meta m ON c.meta_id = m.id
      JOIN police_stations ps ON m.ps_id = ps.id
      ${whereClause}
      GROUP BY year, month, classification
      ORDER BY year ASC, month ASC
    `;
  } else { // missing
    query = `
      SELECT strftime('%Y', c.created_at) as year,
             strftime('%m', c.created_at) as month,
             c.record_subtype as classification,
             c.record_subtype as classification_desc,
             COUNT(*) as count
      FROM missing_persons c
      JOIN daily_records_meta m ON c.meta_id = m.id
      JOIN police_stations ps ON m.ps_id = ps.id
      ${whereClause}
      GROUP BY year, month, classification
      ORDER BY year ASC, month ASC
    `;
  }

  const trends = await db.all(query, params);

  // Format response matching original format
  const formattedTrends = trends.map(t => ({
    _id: {
      year: parseInt(t.year),
      month: parseInt(t.month),
      classification: {
        code: t.classification,
        description: t.classification_desc
      }
    },
    count: t.count
  }));

  return res.status(200).json(
    new ApiResponse(200, { trends: formattedTrends }, 'Trends retrieved successfully')
  );
});

export const getComparisons = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo, recordType = 'cases', compareAxis: explicitAxis } = req.query;
  const { role } = req.user;
  const db = await getDB();

  let compareAxis = explicitAxis || 'station';
  if (!explicitAxis) {
    if (role === 'hq') {
      compareAxis = 'district';
    } else if (role === 'ps') {
      compareAxis = 'beat';
    }
  }

  let tableName = 'cases';
  let classField = 'c.case_head_id';
  let overrideJoin = 'LEFT JOIN case_heads ch_override ON c.case_head_dcp_override = ch_override.id';
  
  if (recordType === 'arrests') {
    tableName = 'arrests';
    classField = 'c.crime_head_id';
    overrideJoin = 'LEFT JOIN case_heads ch_override ON c.crime_head_dcp_override = ch_override.id';
  } else if (recordType === 'pcr') {
    tableName = 'pcr_klandras';
  } else if (recordType === 'missing') {
    tableName = 'missing_persons';
  }

  let whereClause = " WHERE m.submission_status = 'submitted'";
  const params = [];

  if (req.jurisdictionQuery.ps_id) {
    whereClause += ' AND m.ps_id = ?';
    params.push(req.jurisdictionQuery.ps_id);
  }
  if (req.jurisdictionQuery.district_id) {
    whereClause += ' AND m.district_id = ?';
    params.push(req.jurisdictionQuery.district_id);
  }
  if (req.jurisdictionQuery.sub_division_id) {
    whereClause += ' AND ps.sub_division_id = ?';
    params.push(req.jurisdictionQuery.sub_division_id);
  }

  const explicitDistricts = req.query.districts ? req.query.districts.split(',') : null;
  if (explicitDistricts && explicitDistricts.length > 0) {
    whereClause += ` AND m.district_id IN (${explicitDistricts.map(() => '?').join(',')})`;
    params.push(...explicitDistricts);
  }

  const explicitSubDivs = req.query.subDivisions ? req.query.subDivisions.split(',') : null;
  if (explicitSubDivs && explicitSubDivs.length > 0) {
    whereClause += ` AND ps.sub_division_id IN (${explicitSubDivs.map(() => '?').join(',')})`;
    params.push(...explicitSubDivs);
  }

  const explicitStations = req.query.stations ? req.query.stations.split(',') : null;
  if (explicitStations && explicitStations.length > 0) {
    whereClause += ` AND m.ps_id IN (${explicitStations.map(() => '?').join(',')})`;
    params.push(...explicitStations);
  }

  if (dateFrom) {
    whereClause += ' AND m.record_date >= ?';
    params.push(dateFrom);
  }
  if (dateTo) {
    whereClause += ' AND m.record_date <= ?';
    params.push(dateTo);
  }

  const explicitBeats = req.query.beats ? req.query.beats.split(',').map(b => b.trim()) : null;
  if (explicitBeats && explicitBeats.length > 0 && recordType === 'cases') {
    whereClause += ` AND c.beat_no IN (${explicitBeats.map(() => '?').join(',')})`;
    params.push(...explicitBeats);
  }

  // 1. Fetch all matching records
  let query = '';
  if (recordType === 'cases' || recordType === 'arrests') {
    query = `
      SELECT c.*, 
             m.district_id, m.ps_id, ps.name as ps_name, d.name as district_name,
             ps.sub_division_id, sd.name as sub_division_name,
             COALESCE(ch_override.code, ch.code) as active_class_code
      FROM ${tableName} c
      JOIN daily_records_meta m ON c.meta_id = m.id
      JOIN police_stations ps ON m.ps_id = ps.id
      JOIN districts d ON m.district_id = d.id
      LEFT JOIN sub_divisions sd ON ps.sub_division_id = sd.id
      JOIN case_heads ch ON ${classField} = ch.id
      ${overrideJoin}
      ${whereClause}
    `;
  } else if (recordType === 'pcr') {
    query = `
      SELECT c.*, 
             m.district_id, m.ps_id, ps.name as ps_name, d.name as district_name,
             ps.sub_division_id, sd.name as sub_division_name,
             c.call_head as active_class_code
      FROM pcr_klandras c
      JOIN daily_records_meta m ON c.meta_id = m.id
      JOIN police_stations ps ON m.ps_id = ps.id
      JOIN districts d ON m.district_id = d.id
      LEFT JOIN sub_divisions sd ON ps.sub_division_id = sd.id
      ${whereClause}
    `;
  } else { // missing
    query = `
      SELECT c.*, 
             m.district_id, m.ps_id, ps.name as ps_name, d.name as district_name,
             ps.sub_division_id, sd.name as sub_division_name,
             c.record_subtype as active_class_code
      FROM missing_persons c
      JOIN daily_records_meta m ON c.meta_id = m.id
      JOIN police_stations ps ON m.ps_id = ps.id
      JOIN districts d ON m.district_id = d.id
      LEFT JOIN sub_divisions sd ON ps.sub_division_id = sd.id
      ${whereClause}
    `;
  }

  const records = await db.all(query, params);

  // 2. Perform in-memory roll-up based on axis
  const rollups = {};

  // Pre-seed rollups so zero-count entities show up
  if (compareAxis === 'district') {
    const districts = await db.all('SELECT id, name FROM districts');
    districts.forEach(d => {
      rollups[d.id] = { key: d.id, label: d.name, total: 0, classifications: {} };
    });
  } else if (compareAxis === 'sub_division') {
    let sdQuery = 'SELECT id, name FROM sub_divisions WHERE 1=1';
    let sdParams = [];
    if (req.jurisdictionQuery.district_id) {
      sdQuery += ' AND district_id = ?';
      sdParams.push(req.jurisdictionQuery.district_id);
    }
    const subDivs = await db.all(sdQuery, sdParams);
    subDivs.forEach(sd => {
      rollups[sd.id] = { key: sd.id, label: sd.name, total: 0, classifications: {} };
    });
  } else if (compareAxis === 'station') {
    let psQuery = 'SELECT id, name FROM police_stations WHERE 1=1';
    let psParams = [];
    if (req.jurisdictionQuery.district_id) {
      psQuery += ' AND district_id = ?';
      psParams.push(req.jurisdictionQuery.district_id);
    }
    if (req.jurisdictionQuery.sub_division_id) {
      psQuery += ' AND sub_division_id = ?';
      psParams.push(req.jurisdictionQuery.sub_division_id);
    }
    if (explicitStations && explicitStations.length > 0) {
      psQuery += ` AND id IN (${explicitStations.map(() => '?').join(',')})`;
      psParams.push(...explicitStations);
    }
    const stations = await db.all(psQuery, psParams);
    stations.forEach(ps => {
      rollups[ps.id] = { key: ps.id, label: ps.name, total: 0, classifications: {} };
    });
  } else if (compareAxis === 'beat' && recordType === 'cases') {
    const uniqueBeats = new Set();
    records.forEach(r => {
      if (r.beat_no) uniqueBeats.add(r.beat_no);
    });
    uniqueBeats.forEach(b => {
      rollups[b] = { key: b, label: `Beat ${b}`, total: 0, classifications: {} };
    });
  }

  records.forEach((rec) => {
    let groupKey = '';
    let groupLabel = '';

    if (compareAxis === 'district') {
      groupKey = rec.district_id;
      groupLabel = rec.district_name;
    } else if (compareAxis === 'sub_division') {
      groupKey = rec.sub_division_id;
      groupLabel = rec.sub_division_name;
    } else if (compareAxis === 'station') {
      groupKey = rec.ps_id;
      groupLabel = rec.ps_name;
    } else if (compareAxis === 'beat' && recordType === 'cases') {
      groupKey = rec.beat_no || 'unknown';
      groupLabel = rec.beat_no ? `Beat ${rec.beat_no}` : 'No Beat Assigned';
      if (!rollups[groupKey]) {
          rollups[groupKey] = { key: groupKey, label: groupLabel, total: 0, classifications: {} };
      }
    } else {
      groupKey = rec.beat_no || 'Unassigned';
      groupLabel = `Beat ${groupKey}`;
    }

    if (!rollups[groupKey]) {
      rollups[groupKey] = {
        key: groupKey,
        label: groupLabel,
        total: 0,
        classifications: {},
      };
    }

    const classification = rec.active_class_code || 'Unclassified';

    rollups[groupKey].total += 1;
    rollups[groupKey].classifications[classification] = (rollups[groupKey].classifications[classification] || 0) + 1;
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { comparisons: Object.values(rollups), axis: compareAxis },
      'Comparisons retrieved successfully'
    )
  );
});

export const exportAnalytics = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo, recordType = 'cases' } = req.query;
  const db = await getDB();

  let whereClause = " WHERE m.submission_status = 'submitted'";
  const params = [];

  if (req.jurisdictionQuery.ps_id) {
    whereClause += ' AND m.ps_id = ?';
    params.push(req.jurisdictionQuery.ps_id);
  }
  if (req.jurisdictionQuery.district_id) {
    whereClause += ' AND m.district_id = ?';
    params.push(req.jurisdictionQuery.district_id);
  }
  if (req.jurisdictionQuery.sub_division_id) {
    whereClause += ' AND ps.sub_division_id = ?';
    params.push(req.jurisdictionQuery.sub_division_id);
  }

  const explicitDistricts = req.query.districts ? req.query.districts.split(',') : null;
  if (explicitDistricts && explicitDistricts.length > 0) {
    whereClause += ` AND m.district_id IN (${explicitDistricts.map(() => '?').join(',')})`;
    params.push(...explicitDistricts);
  }

  const explicitSubDivs = req.query.subDivisions ? req.query.subDivisions.split(',') : null;
  if (explicitSubDivs && explicitSubDivs.length > 0) {
    whereClause += ` AND ps.sub_division_id IN (${explicitSubDivs.map(() => '?').join(',')})`;
    params.push(...explicitSubDivs);
  }

  const explicitStations = req.query.stations ? req.query.stations.split(',') : null;
  if (explicitStations && explicitStations.length > 0) {
    whereClause += ` AND m.ps_id IN (${explicitStations.map(() => '?').join(',')})`;
    params.push(...explicitStations);
  }

  if (dateFrom) {
    whereClause += ' AND m.record_date >= ?';
    params.push(dateFrom);
  }
  if (dateTo) {
    whereClause += ' AND m.record_date <= ?';
    params.push(dateTo);
  }

  const explicitBeats = req.query.beats ? req.query.beats.split(',').map(b => b.trim()) : null;
  if (explicitBeats && explicitBeats.length > 0 && recordType === 'cases') {
    whereClause += ` AND c.beat_no IN (${explicitBeats.map(() => '?').join(',')})`;
    params.push(...explicitBeats);
  }

  let standardHeaders = [];
  let query = '';
  let rowMapper = null;
  let recordTypeCamelCase = '';

  if (recordType === 'cases') {
    recordTypeCamelCase = 'Case';
    standardHeaders = [
      'UID', 'District', 'Police Station', 'Beat No', 'SID No', 'FIR No', 'FIR Date', 'GD No', 'GD Date', 'GD Time', 
      'Occurrence Date', 'Occurrence Time', 'Occurrence Place', 'Brief Facts', 'Case Head', 'DCP Override', 'Act', 'Sections',
      'Complainant Name', 'Complainant Address', 'Accused Name', 'Accused Address', 'Arrest Date', 'IO Name', 'IO PIS', 'IO Mobile',
      'Property Description', 'Property Status', 'Stolen Property Value', 'Recovered Property Value', 'Status', 'Status Other', 
      'CCTNS Flag', 'e-Theft Flag', 'e-MVT Flag', 'NCRP Flag', 'Zero FIR Flag', 'Case Type', 'Case Type Other',
      'RC No', 'Theft From', 'Time of Theft', 'Motive', 'Hotspot', 'Agency', 'Agency Order & Date', 'Pending Investigation Age', 'Victim Mobile', 'Position of IO',
      'Person Involved (Accused Count)', 'Relation', 'Articles', 'Weapon Used', 'Vehicle Used', 'Work Out', 'Date of Work Out', 'Disposed Date', 'Reason of PI',
      'Remarks'
    ];
    query = `
      SELECT c.*, 
             m.district_id, ps.name as ps_name,
             ch.code as case_head_code,
             ch_override.code as override_code
      FROM cases c
      JOIN daily_records_meta m ON c.meta_id = m.id
      JOIN police_stations ps ON m.ps_id = ps.id
      JOIN case_heads ch ON c.case_head_id = ch.id
      LEFT JOIN case_heads ch_override ON c.case_head_dcp_override = ch_override.id
      ${whereClause}
      ORDER BY c.created_at DESC
    `;
    rowMapper = (rec) => [
      rec.uid, rec.district_id, rec.ps_name, rec.beat_no, rec.sid_no || 'N/A', rec.fir_no || 'N/A', rec.fir_date || 'N/A',
      rec.gd_no, rec.gd_date, rec.gd_time, rec.occurrence_date, rec.occurrence_time || 'N/A', rec.occurrence_place,
      rec.brief_facts || '', rec.case_head_code, rec.override_code || 'None', rec.act_name, rec.section_text,
      rec.complainant_name, rec.complainant_address || 'N/A', rec.accused_name, rec.accused_address || 'N/A',
      rec.arrest_date || 'N/A', rec.io_name, rec.io_pis || 'N/A', rec.io_mobile || 'N/A',
      rec.property_description || 'None', rec.property_status || 'N/A', rec.stolen_property || 'N/A', rec.recovered_property || 'N/A',
      rec.status, rec.status_other || 'N/A',
      rec.cctns_flag ? 'Yes' : 'No', rec.etheft_flag ? 'Yes' : 'No', rec.emvt_flag ? 'Yes' : 'No',
      rec.ncrp_flag ? 'Yes' : 'No', rec.zero_fir_flag ? 'Yes' : 'No',
      rec.case_type || 'N/A', rec.case_type_other || 'N/A',
      rec.rc_no || 'N/A', rec.theft_from || 'N/A', rec.time_of_theft || 'N/A', rec.motive || 'N/A', rec.hotspot || 'No',
      rec.agency || 'N/A', rec.agency_order_date || 'N/A', rec.pending_investigation_age || 'N/A', rec.victim_mobile || 'N/A',
      rec.io_position || 'N/A', rec.accused_count || 0, rec.accused_victim_relation || 'N/A', rec.stolen_article_type || 'N/A',
      rec.weapon_used || 'N/A', rec.vehicle_used || 'N/A', rec.work_out || 'No', rec.date_of_work_out || 'N/A',
      rec.disposed_date || 'N/A', rec.pending_investigation_reason || 'N/A',
      rec.remarks || ''
    ];
  } else if (recordType === 'arrests') {
    recordTypeCamelCase = 'Arrest';
    standardHeaders = [
      'Seq No', 'District', 'Police Station', 'Arrested Person', 'Address', 'Arrest Date', 'Arrest Time',
      'Arrest Place', 'Linked Case UID', 'Linked FIR/DD No', 'Linked FIR/DD Date', 'Linked FIR/DD Time',
      'Act', 'Sections', 'Informant Name', 'Informant Address', 'Informant Telephone',
      'NAFIS Prepared', 'Dossier Prepared', 'Search Slip Prepared', 'Address Verified',
      'Verifying Officer Name', 'Verifying Officer Rank', 'Crime Head', 'DCP Override',
      'Status', 'Status Other', 'Recovered Material', 'Special Scheme'
    ];
    query = `
      SELECT a.*, 
             m.district_id, ps.name as ps_name,
             ch.code as crime_head_code,
             ch_override.code as override_code,
             c.uid as linked_case_uid
      FROM arrests a
      JOIN daily_records_meta m ON a.meta_id = m.id
      JOIN police_stations ps ON m.ps_id = ps.id
      JOIN case_heads ch ON a.crime_head_id = ch.id
      LEFT JOIN case_heads ch_override ON a.crime_head_dcp_override = ch_override.id
      LEFT JOIN cases c ON a.linked_case_id = c.id
      ${whereClause}
      ORDER BY a.created_at DESC
    `;
    rowMapper = (rec) => [
      rec.seq_no, rec.district_id, rec.ps_name, rec.arrested_name, rec.arrested_address,
      rec.arrest_date, rec.arrest_time, rec.arrest_place, rec.linked_case_uid || 'None',
      rec.linked_fir_dd_no || 'N/A', rec.linked_fir_dd_date || 'N/A', rec.linked_fir_dd_time || 'N/A',
      rec.act_name, rec.act_sections, rec.informant_name, rec.informant_address, rec.informant_tel,
      rec.nafis_prepared, rec.dossier_prepared, rec.search_slip_prepared, rec.address_verified,
      rec.verifying_officer_name || 'N/A', rec.verifying_officer_rank || 'N/A',
      rec.crime_head_code, rec.override_code || 'None', rec.status, rec.status_other_text || 'N/A',
      rec.recovered_material || 'None', rec.special_scheme
    ];
  } else if (recordType === 'pcr') {
    recordTypeCamelCase = 'PCRKalandra';
    standardHeaders = [
      'Seq No', 'District', 'Police Station', 'GD No', 'GD Date', 'GD Time', 'Call Head', 'Complainant Name',
      'Complainant Address', 'Gist', 'IO Name', 'EO Name', 'Action Taken', 'Arrival DD No', 'Arrival Date', 'Arrival Time',
      'Latitude', 'Longitude', 'Beat No', 'Status'
    ];
    query = `
      SELECT p.*, 
             m.district_id, ps.name as ps_name
      FROM pcr_klandras p
      JOIN daily_records_meta m ON p.meta_id = m.id
      JOIN police_stations ps ON m.ps_id = ps.id
      ${whereClause}
      ORDER BY p.created_at DESC
    `;
    rowMapper = (rec) => [
      rec.seq_no, rec.district_id, rec.ps_name, rec.gd_no, rec.gd_date, rec.gd_time,
      rec.call_head, rec.complainant_name, rec.complainant_address, rec.call_gist,
      rec.io_name, rec.eo_name || 'N/A', rec.action_taken, rec.arrival_dd_no,
      rec.arrival_date, rec.arrival_time, rec.latitude || 'N/A', rec.longitude || 'N/A',
      rec.beat_no || 'N/A', rec.status
    ];
  } else { // missing
    recordTypeCamelCase = 'MissingPerson';
    standardHeaders = [
      'Subtype', 'District', 'Police Station', 'DD No', 'DD Date', 'DD Time', 'Duty Officer',
      'Assigned IO', 'Informed By', 'Informant Contact', 'Missing Place', 'Found Place',
      'Missing Date', 'Missing Time', 'Track Child No', 'Track Child Date', 'Major/Minor',
      'Age', 'Gender', 'Physical Description', 'Status', 'ZIPNET No', 'If Traced DD No',
      'FIR No/Year', 'FIR Date', 'Is Identified', 'Remarks'
    ];
    query = `
      SELECT mp.*, 
             m.district_id, ps.name as ps_name
      FROM missing_persons mp
      JOIN daily_records_meta m ON mp.meta_id = m.id
      JOIN police_stations ps ON m.ps_id = ps.id
      ${whereClause}
      ORDER BY mp.created_at DESC
    `;
    rowMapper = (rec) => [
      rec.record_subtype, rec.district_id, rec.ps_name, rec.dd_fir_no, rec.dd_fir_date, rec.dd_fir_time || 'N/A', rec.duty_officer || 'N/A',
      rec.io_name, rec.informant_name, rec.informant_contact, rec.last_seen_location || 'N/A', rec.found_location || 'N/A',
      rec.date_missing_recovered, rec.time_missing_recovered, rec.track_child_no || 'N/A', rec.track_child_date || 'N/A', rec.major_minor || 'Unknown',
      rec.age, rec.gender, rec.physical_description, rec.status, rec.zipnet_no || 'N/A', rec.traced_dd_no || 'N/A',
      rec.fir_no_year || 'N/A', rec.fir_date || 'N/A', rec.is_identified || 'No', rec.remarks || ''
    ];
  }

  const records = await db.all(query, params);

  // Fetch custom fields configuration and values
  const customFieldDefs = await db.all(
    `SELECT id, field_key, field_label FROM custom_field_definitions WHERE module = ? AND is_active = 1`,
    [recordType]
  );

  const headers = [...standardHeaders, ...customFieldDefs.map(d => d.field_label)];

  const recordIds = records.map(r => r.id);
  const customValuesMap = {};
  if (recordIds.length > 0 && customFieldDefs.length > 0) {
    const placeholders = recordIds.map(() => '?').join(',');
    const values = await db.all(
      `SELECT record_id, field_definition_id, value_text 
       FROM custom_field_values 
       WHERE record_type = ? AND record_id IN (${placeholders})`,
      [recordTypeCamelCase, ...recordIds]
    );
    values.forEach(v => {
      if (!customValuesMap[v.record_id]) {
        customValuesMap[v.record_id] = {};
      }
      customValuesMap[v.record_id][v.field_definition_id] = v.value_text;
    });
  }

  const workbook = new exceljs.Workbook();
  const worksheet = workbook.addWorksheet(`${recordType.toUpperCase()} Report`);

  worksheet.addRow(headers);
  records.forEach((rec) => {
    const standardRow = rowMapper(rec);
    const customRow = customFieldDefs.map(def => customValuesMap[rec.id]?.[def.id] || '');
    worksheet.addRow([...standardRow, ...customRow]);
  });

  // Style headers
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1E3A8A' } // Dark blue theme
  };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=delhi-police-${recordType}-export.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
});
