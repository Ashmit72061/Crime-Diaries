import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';
import db from '../../config/db.js';

// Styling definitions matching the template look
const thinBorder = {
  top: { style: 'thin', color: { argb: 'FFBFBFBF' } },
  left: { style: 'thin', color: { argb: 'FFBFBFBF' } },
  bottom: { style: 'thin', color: { argb: 'FFBFBFBF' } },
  right: { style: 'thin', color: { argb: 'FFBFBFBF' } }
};

const dataFont = { name: 'Arial', size: 10 };
const alignLeft = { vertical: 'top', horizontal: 'left', wrapText: true };
const categoryFont = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1A365D' } };
const noteFont = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF808080' } };

const datePattern = /\d{2}\.\d{2}\.\d{4}/g;

// Helper to format values correctly
function formatCellValue(val, columnName) {
  if (val === null || val === undefined) return '';
  
  const lowerCol = columnName.toLowerCase();
  
  // Keep these strictly as strings to preserve formatting, leading zeros, or date structures
  if (
    lowerCol.includes('fir') || 
    lowerCol.includes('mobile') || 
    lowerCol.includes('phone') || 
    lowerCol.includes('date') || 
    lowerCol.includes('time') || 
    lowerCol.includes('dd') || 
    lowerCol.includes('vehicle') ||
    lowerCol.includes('section') ||
    lowerCol.includes('u/s')
  ) {
    return String(val);
  }
  
  // If it's BigInt, cast to Number
  if (typeof val === 'bigint') {
    return Number(val);
  }
  
  // Parse small integers
  if (typeof val === 'string' && /^\d+$/.test(val) && val.length < 9) {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? val : parsed;
  }
  
  // Parse floats
  if (typeof val === 'string' && /^\d+\.\d+$/.test(val)) {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? val : parsed;
  }
  
  if (typeof val === 'number') {
    return val;
  }
  
  return val;
}

// Helper to format row cells
function applyStylesToRow(row, maxCol) {
  for (let c = 1; c <= maxCol; c++) {
    const cell = row.getCell(c);
    cell.font = dataFont;
    cell.border = thinBorder;
    cell.alignment = alignLeft;
  }
}

// Helper to resolve string/UUID psId or districtId into integer database IDs
async function resolveIntFilters(filters) {
  const resolved = {
    psIds: null, // Array of integers
    districtId: null // Single integer
  };

  if (!filters) return resolved;

  const rawPs = filters.ps_id || filters.psId;
  const rawDistrict = filters.district_id || filters.districtId;

  if (rawPs) {
    let rawPsArray = [];
    if (Array.isArray(rawPs)) {
      rawPsArray = rawPs;
    } else if (typeof rawPs === 'string') {
      rawPsArray = rawPs.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      rawPsArray = [String(rawPs)];
    }

    const matchedInts = [];
    for (const idVal of rawPsArray) {
      if (/^\d+$/.test(idVal)) {
        matchedInts.push(parseInt(idVal, 10));
        continue;
      }
      const node = await db('hierarchy_nodes').where('id', idVal).first();
      if (node) {
        let psRow = await db('ref_police_station').where('ps_name', node.name_en).first();
        if (!psRow) {
          const withPs = node.name_en.startsWith('PS ') ? node.name_en : `PS ${node.name_en}`;
          psRow = await db('ref_police_station').where('ps_name', withPs).first();
        }
        if (psRow) {
          matchedInts.push(psRow.ps_id);
        }
      }
    }
    if (matchedInts.length > 0) {
      resolved.psIds = matchedInts;
    }
  }

  if (rawDistrict) {
    if (/^\d+$/.test(rawDistrict)) {
      resolved.districtId = parseInt(rawDistrict, 10);
    } else {
      const node = await db('hierarchy_nodes').where('id', rawDistrict).first();
      if (node) {
        const distRow = await db('ref_district').where('district_name', node.name_en).first();
        if (distRow) {
          resolved.districtId = distRow.district_id;
        }
      }
    }
  }

  return resolved;
}

// Generic query helper — all report views expose ps_id, district_id, diary_record_date.
// joinTable is no longer used (all needed columns are now in the views directly).
async function queryViewData(viewName, _joinTable, date, filters, _baseSelectFields = []) {
  const resolved = await resolveIntFilters(filters);
  let query = db(`${viewName} as v`).select('v.*').where('v.diary_record_date', date);

  if (resolved.psIds && resolved.psIds.length > 0) {
    query = query.whereIn('v.ps_id', resolved.psIds);
  } else if (resolved.districtId) {
    query = query.where('v.district_id', resolved.districtId);
  }

  return query;
}

// Reusable block populator
async function populateBlockFromView({
  ws,
  viewName,
  joinTable,
  baseSelectFields,
  date,
  filters,
  startRow,
  endRow,
  colCount,
  colMapping,
  isSelected = true
}) {
  if (!ws) return;
  if (!isSelected) return;

  // Snapshot template capacity BEFORE any mutations (safe because we process
  // blocks bottom-to-top, so blocks above haven't been touched yet).
  const templateRows = endRow !== null
    ? Math.max(0, endRow - startRow + 1)
    : Math.max(0, ws.rowCount - startRow + 1);

  // Query data first — catch errors so one bad view never aborts the whole workbook.
  let rows = [];
  try {
    rows = await queryViewData(viewName, joinTable, date, filters, baseSelectFields);
    if (rows.length === 0) {
      console.log(`[ParallelReport] No rows from "${viewName}" for date=${date}`);
    }
  } catch (err) {
    console.error(`[ParallelReport] Query error "${viewName}":`, err.message);
    return;
  }

  // Write-in-place strategy: never DELETE rows (DELETE spliceRows corrupts merged
  // cell ranges in ExcelJS even when processed bottom-to-top). Instead:
  //   1. If data > template rows: INSERT only the extra rows with ONE spliceRows call.
  //   2. Overwrite template rows with real data cell-by-cell.
  //   3. Clear any leftover template rows (fewer data rows than template slots).
  // This keeps spliceRows calls to at most 1 per block (insert-only, never delete).

  const extraCount = rows.length - templateRows;

  if (extraCount > 0) {
    // Insert only the overflow rows right after the last template placeholder row.
    // Bottom-to-top processing means sections above startRow are unaffected by this.
    const insertAt = startRow + templateRows;
    const extraRowValues = rows.slice(templateRows).map((r, i) =>
      colMapping(r, templateRows + i + 1).map((val, idx) => formatCellValue(val, String(idx)))
    );
    ws.spliceRows(insertAt, 0, ...extraRowValues);
    for (let i = 0; i < extraCount; i++) {
      applyStylesToRow(ws.getRow(insertAt + i), colCount);
    }
  }

  // Overwrite template rows in-place (up to min(data, template) rows).
  const rowsToWrite = Math.min(rows.length, templateRows);
  for (let i = 0; i < rowsToWrite; i++) {
    const vals = colMapping(rows[i], i + 1).map((val, idx) => formatCellValue(val, String(idx)));
    const wsRow = ws.getRow(startRow + i);
    for (let j = 0; j < vals.length; j++) {
      wsRow.getCell(j + 1).value = vals[j];
    }
    applyStylesToRow(wsRow, colCount);
    wsRow.commit();
  }

  // Clear leftover template placeholder rows (when data < template capacity).
  for (let i = rows.length; i < templateRows; i++) {
    const wsRow = ws.getRow(startRow + i);
    wsRow.eachCell({ includeEmpty: true }, cell => { cell.value = null; });
    wsRow.commit();
  }
}

// Annotation for unmapped sheets
function annotateUnmappedSheet(ws) {
  if (!ws) return;
  const targetRow = ws.rowCount >= 2 ? ws.rowCount + 2 : 3;
  const cell = ws.getCell(targetRow, 1);
  cell.value = "This sheet needs data outside the 5 master tables (FIR, Arrest, PCR/Kalandra, Missing, UIDB) and is kept as a manual-entry template for now.";
  cell.font = noteFont;
}

// Format title date string
function stampTitleDate(ws, reportDateStr) {
  if (!ws) return;
  const parts = reportDateStr.split('-');
  if (parts.length !== 3) return;
  const formattedDate = `${parts[2]}.${parts[1]}.${parts[0]}`;
  
  const cell = ws.getCell('A1');
  if (cell.value && typeof cell.value === 'string' && datePattern.test(cell.value)) {
    cell.value = cell.value.replace(datePattern, formattedDate);
  }
}

// ----------------------------------------
// Dynamic row-location utilities (Bug 1 & 2 fix)
// ----------------------------------------

// Scan a worksheet for the first row containing a cell whose text starts with `prefix`.
// Checks both regular and merged-cell master values.
function findTitleRow(ws, prefix) {
  for (let r = 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    for (let c = 1; c <= 40; c++) {
      const cell = row.getCell(c);
      const master = cell.isMerged ? cell.master : cell;
      const val = master.value;
      if (typeof val === 'string' && val.trim().includes(prefix)) return r;
    }
  }
  return null;
}

// Starting from titleRow+1, find the first row that is NOT a header row.
// Header rows are identified by their first non-empty cell having bold font.
// Returns that first non-header row (= where data should be inserted).
function findDataStart(ws, titleRow) {
  // All section blocks in the consolidated templates have exactly 2 header rows after the title row.
  return titleRow + 3;
}

// Build a list of section block boundaries from an ordered array of title prefixes.
// Returns [{prefix, titleRow, dataStart, dataEnd}] sorted by titleRow ascending.
// dataEnd for each block = titleRow of the NEXT block minus 1 (null for the last block).
// All boundaries are computed BEFORE any row mutations so they remain valid for
// bottom-to-top processing (inserting rows at row N never shifts rows above N).
function findSectionBlocks(ws, prefixes) {
  const blocks = prefixes
    .map(prefix => {
      const titleRow = findTitleRow(ws, prefix);
      return titleRow !== null ? { prefix, titleRow } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.titleRow - b.titleRow);

  for (let i = 0; i < blocks.length; i++) {
    blocks[i].dataStart = findDataStart(ws, blocks[i].titleRow);
    blocks[i].dataEnd = i + 1 < blocks.length ? blocks[i + 1].titleRow - 1 : null;
  }
  return blocks;
}

// ----------------------------------------
// Custom Scoped Populaters for Merged/Summary Sheets
// ----------------------------------------

// 1. Manual FIR Custom populator
async function populateSheet1_ManualFIR(workbook, date, filters) {
  const ws = workbook.getWorksheet('1.Manual FIR');
  if (!ws) return;

  if (ws.rowCount >= 5) {
    const descriptorCell = ws.getRow(4).getCell(1).value;
    if (typeof descriptorCell === 'string' && descriptorCell.trim() === 'TEXT') {
      ws.spliceRows(4, 1);
    }
    ws.spliceRows(5, ws.rowCount - 4);
  }

  const resolved = await resolveIntFilters(filters);
  const psIds = resolved.psIds;
  const districtId = resolved.districtId;

  let rows = [];
  try {
    let query = db('fir_master')
      .join('ref_police_station', 'ref_police_station.ps_id', '=', 'fir_master.ps_id')
      .join('ref_case_reg_type', 'ref_case_reg_type.case_reg_type_id', '=', 'fir_master.case_reg_type_id')
      .leftJoin('arrest_master', 'arrest_master.linked_fir_record_uid', '=', 'fir_master.record_uid')
      .select([
        'ref_police_station.ps_name as ps_name',
        'fir_master.fir_number as fir_no',
        'fir_master.sections as sections',
        'fir_master.complainant_name as complainant_name',
        'fir_master.complainant_parent_name as complainant_parent_name',
        'fir_master.complainant_address as complainant_address',
        'fir_master.place_of_occurrence as place_of_occurrence',
        'fir_master.date_of_occurrence as date_of_occurrence',
        'fir_master.time_of_occurrence as time_of_occurrence',
        'fir_master.brief_facts as gist',
        'arrest_master.arrestee_name as arrestee_name',
        'arrest_master.arrestee_parent_name as arrestee_parent_name',
        'arrest_master.arrestee_address as arrestee_address',
        'arrest_master.arrestee_age as arrestee_age',
        'fir_master.io_name as io_name'
      ])
      .where('ref_case_reg_type.code', 'MANUAL_FIR')
      .where('fir_master.diary_record_date', date);

    if (psIds && psIds.length > 0) query = query.whereIn('fir_master.ps_id', psIds);
    if (districtId) query = query.where('ref_police_station.district_id', districtId);

    rows = await query.orderBy(['fir_master.fir_number', 'arrest_master.arrestee_name']);
  } catch (err) {
    console.error('[ParallelReport] Sheet 1 query error:', err.message);
    return;
  }

  // Group by case
  const casesMap = new Map();
  for (const r of rows) {
    if (!casesMap.has(r.fir_no)) {
      casesMap.set(r.fir_no, {
        ps_name: r.ps_name,
        fir_no: r.fir_no,
        sections: r.sections,
        complainant_name: r.complainant_name,
        complainant_parent_name: r.complainant_parent_name,
        complainant_address: r.complainant_address,
        place_of_occurrence: r.place_of_occurrence,
        date_of_occurrence: r.date_of_occurrence,
        time_of_occurrence: r.time_of_occurrence,
        gist: r.gist,
        io_name: r.io_name,
        arrests: []
      });
    }
    if (r.arrestee_name) {
      casesMap.get(r.fir_no).arrests.push({
        name: r.arrestee_name,
        parent: r.arrestee_parent_name,
        address: r.arrestee_address,
        age: r.arrestee_age
      });
    }
  }

  let rIdx = 5;
  for (const [_, c] of casesMap.entries()) {
    const arrests = c.arrests;
    if (arrests.length === 0) {
      const row = ws.getRow(rIdx);
      row.values = [
        c.ps_name,
        c.fir_no,
        c.sections,
        c.complainant_name,
        c.complainant_parent_name,
        c.complainant_address,
        c.place_of_occurrence,
        c.date_of_occurrence,
        c.time_of_occurrence,
        c.gist,
        '', '', '', '',
        c.io_name
      ].map((val, idx) => formatCellValue(val, String(idx)));
      applyStylesToRow(row, 15);
      rIdx++;
    } else {
      const startMergeRow = rIdx;
      for (const arr of arrests) {
        const row = ws.getRow(rIdx);
        row.values = [
          c.ps_name,
          c.fir_no,
          c.sections,
          c.complainant_name,
          c.complainant_parent_name,
          c.complainant_address,
          c.place_of_occurrence,
          c.date_of_occurrence,
          c.time_of_occurrence,
          c.gist,
          arr.name,
          arr.parent,
          arr.address,
          arr.age,
          c.io_name
        ].map((val, idx) => formatCellValue(val, String(idx)));
        applyStylesToRow(row, 15);
        rIdx++;
      }
      if (arrests.length > 1) {
        for (let col = 1; col <= 10; col++) {
          ws.mergeCells(startMergeRow, col, rIdx - 1, col);
        }
        ws.mergeCells(startMergeRow, 15, rIdx - 1, 15);
      }
    }
  }
}

// 14. Women and Children Missing Summary custom populator
async function populateSheet14_WomenChildrenMissing(workbook, date, filters, tableNames = null) {
  const ws = workbook.getWorksheet('14.Women, children Missing');
  if (!ws) return;

  const resolved = await resolveIntFilters(filters);
  const psIds = resolved.psIds;
  const districtId = resolved.districtId;

  // 14.1 Women Missing Aggregate
  const isWomenSelected = !tableNames || tableNames.includes('excel_22women_missing');
  const wRow = ws.getRow(4);
  if (isWomenSelected) {
    try {
      let wQuery = db('missing_master')
        .join('ref_missing_category', 'ref_missing_category.category_id', '=', 'missing_master.category_id')
        .where('ref_missing_category.code', 'MISSING')
        .where('missing_master.gender', 'Female')
        .where('missing_master.diary_record_date', date);
      if (psIds && psIds.length > 0) wQuery = wQuery.whereIn('missing_master.ps_id', psIds);
      if (districtId) wQuery = wQuery.where('missing_master.district_id', districtId);
      const wStats = await wQuery.select([
        db.raw("COUNT(*) FILTER (WHERE pcr_call = 'Yes') as pcr"),
        db.raw("COUNT(*) FILTER (WHERE pcr_call = 'No') as dd"),
        db.raw("COUNT(*) as total"),
        db.raw("COUNT(*) FILTER (WHERE current_status = 'Traced') as traced"),
        db.raw("COUNT(*) FILTER (WHERE case_registered = 'Yes') as case_reg"),
        db.raw("COUNT(*) FILTER (WHERE current_status IS DISTINCT FROM 'Traced') as pending")
      ]).first();
      wRow.values = [
        Number(wStats?.pcr || 0), Number(wStats?.dd || 0), Number(wStats?.total || 0),
        Number(wStats?.traced || 0), Number(wStats?.case_reg || 0), Number(wStats?.pending || 0)
      ];
    } catch (err) {
      console.error('[ParallelReport] Sheet 14 women query error:', err.message);
      wRow.values = [0, 0, 0, 0, 0, 0];
    }
  } else {
    wRow.values = [0, 0, 0, 0, 0, 0];
  }
  applyStylesToRow(wRow, 6);

  // 14.2 Children Missing Aggregate (under 18)
  const isChildrenSelected = !tableNames || tableNames.includes('excel_23children_missing');
  const cRow = ws.getRow(17);
  if (isChildrenSelected) {
    try {
      let cQuery = db('missing_master')
        .join('ref_missing_category', 'ref_missing_category.category_id', '=', 'missing_master.category_id')
        .where('ref_missing_category.code', 'MISSING')
        .where('missing_master.age_approx', '<', 18)
        .where('missing_master.diary_record_date', date);
      if (psIds && psIds.length > 0) cQuery = cQuery.whereIn('missing_master.ps_id', psIds);
      if (districtId) cQuery = cQuery.where('missing_master.district_id', districtId);
      const cStats = await cQuery.select([
        db.raw("COUNT(*) FILTER (WHERE gender='Male' AND pcr_call='Yes') as pcr_m"),
        db.raw("COUNT(*) FILTER (WHERE gender='Female' AND pcr_call='Yes') as pcr_f"),
        db.raw("COUNT(*) FILTER (WHERE gender='Male' AND pcr_call='No') as dd_m"),
        db.raw("COUNT(*) FILTER (WHERE gender='Female' AND pcr_call='No') as dd_f"),
        db.raw("COUNT(*) FILTER (WHERE gender='Male') as total_m"),
        db.raw("COUNT(*) FILTER (WHERE gender='Female') as total_f"),
        db.raw("COUNT(*) FILTER (WHERE gender='Male' AND current_status='Traced') as traced_m"),
        db.raw("COUNT(*) FILTER (WHERE gender='Female' AND current_status='Traced') as traced_f"),
        db.raw("COUNT(*) FILTER (WHERE gender='Male' AND case_registered='Yes') as case_m"),
        db.raw("COUNT(*) FILTER (WHERE gender='Female' AND case_registered='Yes') as case_f")
      ]).first();
      cRow.values = [
        Number(cStats?.pcr_m || 0), Number(cStats?.pcr_f || 0),
        Number(cStats?.dd_m || 0), Number(cStats?.dd_f || 0),
        Number(cStats?.total_m || 0), Number(cStats?.total_f || 0),
        Number(cStats?.traced_m || 0), Number(cStats?.traced_f || 0),
        Number(cStats?.case_m || 0), Number(cStats?.case_f || 0)
      ];
    } catch (err) {
      console.error('[ParallelReport] Sheet 14 children query error:', err.message);
      cRow.values = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }
  } else {
    cRow.values = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  }
  applyStylesToRow(cRow, 10);
}

// 17. Important Cases custom populator
const categories = [
  { key: '17.1', title: '17.1 All dcoity cases', filter: c => (c.local_head || '').toLowerCase() === 'dacoity' },
  { key: '17.2', title: '17.2 All Murder cases', filter: c => (c.local_head || '').toLowerCase() === 'murder' },
  { key: '17.3', title: '17.3 All Extortion  cases involving orga', filter: c => (c.local_head || '').toLowerCase() === 'extortion' && (c.brief_facts || '').toLowerCase().includes('gang') },
  { key: '17.4', title: '17.4 All cases relted to member of organ', filter: c => ['organised crime', 'maharashtra control of organised crime act-1999'].includes((c.local_head || '').toLowerCase()) },
  { key: '17.5', title: '17.5 Attempt to murder cases involving f', filter: c => (c.local_head || '').toLowerCase().includes('att. to murder') || (c.local_head || '').toLowerCase().includes('attempt to murder') },
  { key: '17.6', title: '17.6 Politically/communally/Religion sen', filter: c => {
      const facts = (c.brief_facts || '').toLowerCase();
      return facts.includes('political') || facts.includes('communal') || facts.includes('religious') || facts.includes('sensitive');
    }
  },
  { key: '17.7', title: '17.7 All Rape/Pocso cases in which accus', filter: c => ['rape', 'pocso act 2012'].includes((c.local_head || '').toLowerCase()) },
  { key: '17.8', title: '17.8 Robbery cases in which the victim ', filter: c => (c.local_head || '').toLowerCase() === 'robbery' && (c.brief_facts || '').toLowerCase().includes('grievous') },
  { key: '17.9', title: '17.9 All theft and burglary cases includ', filter: c => ['burglary', 'night burglary', 'day burglary', 'house theft', 'other theft', 'theft in shop', 'servant theft', 'stereo theft', 'cattle theft', 'm.v. accessories theft', 'theft', 'snatching', 'mobile phone theft', 'cycle theft', 'm.v. theft'].includes((c.local_head || '').toLowerCase()) && (c.brief_facts || '').toLowerCase().includes('lakh') },
  { key: '17.10', title: '17.10 Atm breking cases', filter: c => ['burglary', 'night burglary', 'day burglary'].includes((c.local_head || '').toLowerCase()) && (c.brief_facts || '').toLowerCase().includes('atm') },
  { key: '17.11', title: '17.11 All kidnapping for random cases', filter: c => (c.local_head || '').toLowerCase().includes('ransom') || (c.local_head || '').toLowerCase().includes('kid. for ransom') },
  { key: '17.12', title: '17.12 All MV theft cases in which...', filter: c => (c.local_head || '').toLowerCase() === 'm.v. theft' && (c.brief_facts || '').toLowerCase().includes('carjack') }
];

async function populateSheet17_ImportantCases(workbook, date, filters) {
  const ws = workbook.getWorksheet('17.Important Cases');
  if (!ws) return;

  const resolved = await resolveIntFilters(filters);
  const psIds = resolved.psIds;
  const districtId = resolved.districtId;

  let rows = [];
  try {
    let query = db('fir_master')
      .join('ref_police_station', 'ref_police_station.ps_id', '=', 'fir_master.ps_id')
      .join('ref_district', 'ref_district.district_id', '=', 'ref_police_station.district_id')
      .join('ref_crime_head', 'ref_crime_head.crime_head_id', '=', 'fir_master.crime_head_id')
      .leftJoin('arrest_master', 'arrest_master.linked_fir_record_uid', '=', 'fir_master.record_uid')
      .select([
        'ref_police_station.ps_name as ps_name',
        'ref_district.district_name as district_name',
        'fir_master.record_uid as record_uid',
        'fir_master.fir_number as fir_no',
        'fir_master.date_of_occurrence as occurrence_date',
        'fir_master.sections as sections',
        'fir_master.brief_facts as brief_facts',
        'ref_crime_head.crime_head_name as local_head',
        'arrest_master.arrestee_name as arrestee_name',
        'arrest_master.arrestee_parent_name as arrestee_parent_name',
        'arrest_master.seizure_desc as seizure_desc'
      ])
      .where('fir_master.diary_record_date', date);

    if (psIds && psIds.length > 0) query = query.whereIn('fir_master.ps_id', psIds);
    if (districtId) query = query.where('ref_police_station.district_id', districtId);

    rows = await query.orderBy(['fir_master.fir_number', 'arrest_master.arrestee_name']);
  } catch (err) {
    console.error('[ParallelReport] Sheet 17 query error:', err.message);
    return;
  }

  // Group by case
  const casesMap = new Map();
  for (const r of rows) {
    if (!casesMap.has(r.fir_no)) {
      casesMap.set(r.fir_no, {
        ps_name: r.ps_name, district_name: r.district_name,
        fir_no: r.fir_no, occurrence_date: r.occurrence_date,
        sections: r.sections, brief_facts: r.brief_facts,
        local_head: r.local_head, arrests: []
      });
    }
    if (r.arrestee_name) {
      casesMap.get(r.fir_no).arrests.push({
        name: r.arrestee_name, parent: r.arrestee_parent_name, seizure_desc: r.seizure_desc
      });
    }
  }
  const allCases = Array.from(casesMap.values());

  // Find all 12 section boundaries dynamically from the live template, then process bottom-to-top.
  // Prefixes match what's in the template cells (e.g. "17.1", "17.10" etc.).
  const prefixes = ['17.1','17.2','17.3','17.4','17.5','17.6','17.7','17.8','17.9','17.10','17.11','17.12'];
  const sectionBlocks = findSectionBlocks(ws, prefixes);

  const blocksWithFilter = sectionBlocks
    .map(b => {
      const idx = prefixes.indexOf(b.prefix);
      return idx >= 0 ? { ...b, filter: categories[idx].filter } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.titleRow - a.titleRow); // bottom-to-top so inserts don't shift earlier sections

  for (const block of blocksWithFilter) {
    // Snapshot template capacity BEFORE any mutations (never DELETE — DELETE corrupts merged cells)
    const templateRows = block.dataEnd !== null
      ? Math.max(0, block.dataEnd - block.dataStart + 1)
      : Math.max(0, ws.rowCount - block.dataStart + 1);

    const catCases = allCases.filter(block.filter);

    // Build a flat list of row-value arrays (one entry per visual row)
    const outputRows = [];
    const mergeRanges = []; // cols 1-7 merge for multi-arrest cases
    if (catCases.length === 0) {
      outputRows.push(['-', 'Nil', '-', '-', '-', '-', '-', '-', '-', '-'].map((v, i) => formatCellValue(v, String(i))));
    } else {
      let sn = 1;
      for (const c of catCases) {
        const numRows = Math.max(1, c.arrests.length);
        const caseStartRow = block.dataStart + outputRows.length;
        if (c.arrests.length > 1) mergeRanges.push({ startRow: caseStartRow, endRow: caseStartRow + numRows - 1 });

        if (c.arrests.length === 0) {
          outputRows.push([sn, c.ps_name, c.district_name, c.fir_no, c.occurrence_date, c.sections, c.brief_facts, '', '', ''].map((v, i) => formatCellValue(v, String(i))));
        } else {
          for (const arr of c.arrests) {
            outputRows.push([sn, c.ps_name, c.district_name, c.fir_no, c.occurrence_date, c.sections, c.brief_facts, arr.name, arr.parent, arr.seizure_desc].map((v, i) => formatCellValue(v, String(i))));
          }
        }
        sn++;
      }
    }

    // INSERT extra rows only (never DELETE)
    const extraCount = outputRows.length - templateRows;
    if (extraCount > 0) {
      const insertAt = block.dataStart + templateRows;
      ws.spliceRows(insertAt, 0, ...outputRows.slice(templateRows));
      for (let i = 0; i < extraCount; i++) applyStylesToRow(ws.getRow(insertAt + i), 10);
    }

    // Write in-place for template rows that have output data
    const writeable = Math.min(outputRows.length, templateRows);
    for (let i = 0; i < writeable; i++) {
      const wsRow = ws.getRow(block.dataStart + i);
      outputRows[i].forEach((v, j) => { wsRow.getCell(j + 1).value = v; });
      applyStylesToRow(wsRow, 10);
      wsRow.commit();
    }

    // Clear excess template rows
    for (let i = outputRows.length; i < templateRows; i++) {
      const wsRow = ws.getRow(block.dataStart + i);
      wsRow.eachCell({ includeEmpty: true }, cell => { cell.value = null; });
      wsRow.commit();
    }

    // Merge cols 1-7 for cases with multiple arrest rows
    for (const { startRow, endRow } of mergeRanges) {
      for (let col = 1; col <= 7; col++) ws.mergeCells(startRow, col, endRow, col);
    }
  }
}

// ----------------------------------------
// ----------------------------------------
// 15. Preventive Action custom populator
// ----------------------------------------
async function populateSheet15_PreventiveAction(workbook, date, filters) {
  const ws = workbook.getWorksheet('15.Preventive Action');
  if (!ws) return;

  if (ws.rowCount >= 3) {
    ws.spliceRows(3, ws.rowCount - 2);
  }

  const resolved = await resolveIntFilters(filters);
  const psIds = resolved.psIds;
  const districtId = resolved.districtId;

  let rows = [];
  try {
    let query = db('pcr_kalandra_master as p')
      .select(['p.gd_entry_number', 'p.pcr_call_category', 'p.pcr_dispatch_gist'])
      .where('p.diary_record_date', date)
      .whereRaw("p.gd_entry_time >= '21:00:00' AND p.gd_entry_time <= '23:59:59'");
    if (psIds && psIds.length > 0) query = query.whereIn('p.ps_id', psIds);
    else if (districtId) query = query.where('p.district_id', districtId);
    rows = await query;
  } catch (err) {
    console.error('[ParallelReport] Sheet 15 query error:', err.message);
    return;
  }

  const filterByUS = (items, pattern) => {
    return items.filter(r => {
      const gist = (r.pcr_dispatch_gist || '').toLowerCase();
      const cat = (r.pcr_call_category || '').toLowerCase();
      return gist.includes(pattern) || cat.includes(pattern);
    });
  };

  const filterByMultipleUS = (items, patterns) => {
    return items.filter(r => {
      const gist = (r.pcr_dispatch_gist || '').toLowerCase();
      const cat = (r.pcr_call_category || '').toLowerCase();
      return patterns.some(p => gist.includes(p) || cat.includes(p));
    });
  };

  const detainedTotal = rows.length;
  const detainedDDs = rows.map(r => r.gd_entry_number).filter(Boolean).join(', ');

  const r66 = filterByUS(rows, '66');
  const count66 = r66.length;
  const dd66 = r66.map(r => r.gd_entry_number).filter(Boolean).join(', ');

  const r129_128 = filterByMultipleUS(rows, ['129', '128']);
  const count129_128 = r129_128.length;
  const dd129_128 = r129_128.map(r => r.gd_entry_number).filter(Boolean).join(', ');

  const r40 = filterByMultipleUS(rows, ['40a', '40b']);
  const count40 = r40.length;
  const dd40 = r40.map(r => r.gd_entry_number).filter(Boolean).join(', ');

  const r126_169 = filterByUS(rows, '126/169');
  const count126_169 = r126_169.length;
  const dd126_169 = r126_169.map(r => r.gd_entry_number).filter(Boolean).join(', ');

  const r126_170 = filterByUS(rows, '126/170');
  const count126_170 = r126_170.length;
  const dd126_170 = r126_170.map(r => r.gd_entry_number).filter(Boolean).join(', ');

  const rBcCheck = filterByUS(rows, 'bc check');
  const countBcCheck = rBcCheck.length;
  const ddBcCheck = rBcCheck.map(r => r.gd_entry_number).filter(Boolean).join(', ');

  const r92_93_97 = filterByMultipleUS(rows, ['92', '93', '97']);
  const count92_93_97 = r92_93_97.length;
  const dd92_93_97 = r92_93_97.map(r => r.gd_entry_number).filter(Boolean).join(', ');

  const dataRow = [
    detainedTotal,
    detainedDDs,
    count66,
    dd66,
    count129_128,
    dd129_128,
    count40,
    dd40,
    count126_169,
    dd126_169,
    count126_170,
    dd126_170,
    countBcCheck,
    ddBcCheck,
    count92_93_97,
    dd92_93_97
  ].map((val, idx) => formatCellValue(val, String(idx)));

  ws.spliceRows(3, 0, dataRow);
  const row = ws.getRow(3);
  applyStylesToRow(row, 16);
}

// ----------------------------------------
// 19. Financial Fraud Arrest custom populator
// ----------------------------------------
async function populateSheet19_FinancialFraudArrest(workbook, date, filters) {
  const ws = workbook.getWorksheet('19.Financial Fraud Arrest');
  if (!ws) return;

  if (ws.rowCount >= 3) {
    ws.spliceRows(3, ws.rowCount - 2);
  }

  const resolved = await resolveIntFilters(filters);
  const psIds = resolved.psIds;
  const districtId = resolved.districtId;

  let cases = [];
  try {
    let query = db('arrest_master as am')
      .join('record_links as rl', 'rl.target_record_id', '=', 'am.record_uid')
      .join('link_type_registry as ltr', 'ltr.id', '=', 'rl.link_type_id')
      .join('fir_master as fm', 'fm.record_uid', '=', 'rl.source_record_id')
      .join('ref_police_station as ps', 'ps.ps_id', '=', 'fm.ps_id')
      .join('ref_district as d', 'd.district_id', '=', 'ps.district_id')
      .join('ref_crime_head as ch', 'ch.crime_head_id', '=', 'fm.crime_head_id')
      .select(['fm.record_uid as case_uid', 'fm.fir_number', 'fm.fir_date', 'fm.sections', 'fm.brief_facts', 'ps.ps_name', 'd.district_name'])
      .where('ltr.code', 'CASE_ARREST')
      .where(function() {
        this.whereIn('ch.crime_head_name', ['Cheating', 'Information Technology Act 2000', 'Criminal Breach of Trust', 'Counterfeiting', 'Forgery'])
            .orWhereIn('ch.crime_head_code', ['CHEATING', 'INFORMATION_TECHNOLOGY_ACT_2000', 'CRIMINAL_BREACH_OF_TRUST', 'COUNTERFEITING', 'FORGERY']);
      })
      .where('am.diary_record_date', date);
    if (psIds && psIds.length > 0) query = query.whereIn('fm.ps_id', psIds);
    else if (districtId) query = query.where('ps.district_id', districtId);
    cases = await query.groupBy(['fm.record_uid', 'fm.fir_number', 'fm.fir_date', 'fm.sections', 'fm.brief_facts', 'ps.ps_name', 'd.district_name']);
  } catch (err) {
    console.error('[ParallelReport] Sheet 19 query error:', err.message);
    return;
  }

  let rIdx = 3;
  for (const c of cases) {
    const totalArrestsRes = await db('arrest_master as am2')
      .join('record_links as rl2', 'rl2.target_record_id', '=', 'am2.record_uid')
      .where('rl2.source_record_id', c.case_uid)
      .count('* as count')
      .first();
    const countArrested = Number(totalArrestsRes?.count || 0);

    const arrestNamesRes = await db('arrest_master as am2')
      .join('record_links as rl2', 'rl2.target_record_id', '=', 'am2.record_uid')
      .where('rl2.source_record_id', c.case_uid)
      .select('am2.arrestee_name');
    const names = arrestNamesRes.map(a => a.arrestee_name).filter(Boolean).join(', ');

    const mo = c.brief_facts ? c.brief_facts.substring(0, 200) : '';

    const rowVals = [
      '', // ZONE
      '', // RANGE
      c.district_name,
      c.fir_number,
      c.sections,
      c.fir_date,
      c.ps_name,
      '', // CHEATED AMOUNT
      mo,
      countArrested,
      names
    ].map((val, idx) => formatCellValue(val, String(idx)));

    ws.spliceRows(rIdx, 0, rowVals);
    const row = ws.getRow(rIdx);
    applyStylesToRow(row, 11);
    rIdx++;
  }
}

// ----------------------------------------
// 21. NDPS Action custom populator
// ----------------------------------------
async function populateSheet21_NDPSAction(workbook, date, filters) {
  const ws = workbook.getWorksheet('21.NDPS Action');
  if (!ws) return;

  if (ws.rowCount >= 3) {
    ws.spliceRows(3, ws.rowCount - 2);
  }

  const resolved = await resolveIntFilters(filters);
  const psIds = resolved.psIds;
  const districtId = resolved.districtId;

  let cases = [], arrests = [], districts = [];
  try {
    let casesQuery = db('fir_master as fm')
      .join('ref_police_station as ps', 'ps.ps_id', '=', 'fm.ps_id')
      .join('ref_district as d', 'd.district_id', '=', 'ps.district_id')
      .join('ref_crime_head as ch', 'ch.crime_head_id', '=', 'fm.crime_head_id')
      .select(['d.district_name', 'ps.ps_name', 'fm.ps_id', 'fm.record_uid as case_uid'])
      .where('fm.diary_record_date', date)
      .where(function() {
        this.where('ch.crime_head_name', 'Narcotics Drugs & Psychotropic Substances Act')
            .orWhere('ch.crime_head_code', 'NDPS');
      });
    if (psIds && psIds.length > 0) casesQuery = casesQuery.whereIn('fm.ps_id', psIds);
    if (districtId) casesQuery = casesQuery.where('ps.district_id', districtId);
    cases = await casesQuery;

    let arrestsQuery = db('arrest_master as am')
      .join('ref_police_station as ps', 'ps.ps_id', '=', 'am.ps_id')
      .join('ref_district as d', 'd.district_id', '=', 'ps.district_id')
      .leftJoin('record_links as rl', 'rl.target_record_id', '=', 'am.record_uid')
      .leftJoin('fir_master as fm', 'fm.record_uid', '=', 'rl.source_record_id')
      .leftJoin('ref_crime_head as ch_case', 'ch_case.crime_head_id', '=', 'fm.crime_head_id')
      .leftJoin('ref_arrest_section_category as sc', 'sc.section_category_id', '=', 'am.section_category_id')
      .select(['d.district_name', 'ps.ps_name', 'am.ps_id', 'am.record_uid as arrest_uid'])
      .where('am.diary_record_date', date)
      .where(function() {
        this.where('ch_case.crime_head_name', 'Narcotics Drugs & Psychotropic Substances Act')
            .orWhere('ch_case.crime_head_code', 'NDPS')
            .orWhere('sc.code', 'S_NDPS')
            .orWhere('am.sections', 'like', '%NDPS%');
      });
    if (psIds && psIds.length > 0) arrestsQuery = arrestsQuery.whereIn('am.ps_id', psIds);
    if (districtId) arrestsQuery = arrestsQuery.where('ps.district_id', districtId);
    arrests = await arrestsQuery;

    districts = await db('ref_district').orderBy('district_name');
  } catch (err) {
    console.error('[ParallelReport] Sheet 21 query error:', err.message);
    return;
  }

  if (districtId) {
    districts = districts.filter(d => d.district_id === districtId);
  }

  const districtMap = new Map();
  for (const d of districts) {
    districtMap.set(d.district_name, {
      district_name: d.district_name,
      ps_set: new Set(),
      cases_count: 0,
      arrests_count: 0
    });
  }

  for (const c of cases) {
    if (districtMap.has(c.district_name)) {
      const entry = districtMap.get(c.district_name);
      entry.ps_set.add(c.ps_name);
      entry.cases_count++;
    }
  }

  for (const a of arrests) {
    if (districtMap.has(a.district_name)) {
      const entry = districtMap.get(a.district_name);
      entry.ps_set.add(a.ps_name);
      entry.arrests_count++;
    }
  }

  let rIdx = 3;
  let sNo = 1;
  for (const [distName, entry] of districtMap.entries()) {
    if (psIds && psIds.length > 0 && entry.ps_set.size === 0 && entry.cases_count === 0 && entry.arrests_count === 0) {
      continue;
    }

    const rowVals = [
      sNo,
      distName,
      entry.ps_set.size,
      entry.cases_count,
      '', // QTY RECOVERED (field gap)
      entry.arrests_count
    ].map((val, idx) => formatCellValue(val, String(idx)));

    ws.spliceRows(rIdx, 0, rowVals);
    const row = ws.getRow(rIdx);
    applyStylesToRow(row, 6);
    rIdx++;
    sNo++;
  }
}

const OLD_TABLE_TO_NEW_SHEET = {
  excel_1manual_fir: '1.Manual FIR',
  excel_2eburglary_cases: 'E-burglary,E-House E-theft, mvt',
  excel_3ehouse_theft_cases: 'E-burglary,E-House E-theft, mvt',
  excel_4eother_theft_cases: 'E-burglary,E-House E-theft, mvt',
  excel_5mvt_cases: 'E-burglary,E-House E-theft, mvt',
  excel_6arrested_all_heads: '3. Arrested All Heads',
  excel_7arrested_east_district: '4.Arrested East District',
  excel_8arrested_kalandara: '5.Arrested Kalandara',
  excel_9arrested_efir_theft: '6.Arrested E-FIR Theft',
  excel_10arrested_efir_mv_theft: '7.Arrested E-FIR MV Theft',
  excel_11proclaimed_offenders: '8.Proclaimed Offenders',
  excel_13arrested_24_hrs_list: '10.Arrested 24 Hrs List',
  excel_14pi_disposal_manual: '11.PI Dispose manual, prop. mvt',
  excel_15pi_disposal_eproperty: '11.PI Dispose manual, prop. mvt',
  excel_16pi_disposal_emvt: '11.PI Dispose manual, prop. mvt',
  excel_18missing_persons: '13.Missing, uidb, abandon,trace',
  excel_19uidb: '13.Missing, uidb, abandon,trace',
  excel_20abandoned_persons: '13.Missing, uidb, abandon,trace',
  excel_21traced_persons: '13.Missing, uidb, abandon,trace',
  excel_22women_missing: '14.Women, children Missing',
  excel_23children_missing: '14.Women, children Missing',
  excel_24preventive_action: '15.Preventive Action',
  excel_25inquest_registered: '16.Inquest Registered',
  excel_26inquest_acpsdm_disposal: '16.Inquest Registered',
  excel_27important_cases: '17.Important Cases',
  excel_28fir_goswara_summary: '18.FIR Goswara Summary',
  excel_29financial_fraud_arrest: '19.Financial Fraud Arrest',
  excel_31ndps_action: '21.NDPS Action'
};

const GENERATABLE_SHEETS = new Set([
  '1.Manual FIR',
  'E-burglary,E-House E-theft, mvt',
  '3. Arrested All Heads',
  '4.Arrested East District',
  '5.Arrested Kalandara',
  '6.Arrested E-FIR Theft',
  '7.Arrested E-FIR MV Theft',
  '8.Proclaimed Offenders',
  '10.Arrested 24 Hrs List',
  '13.Missing, uidb, abandon,trace',
  '14.Women, children Missing',
  '15.Preventive Action',
  '16.Inquest Registered',
  '17.Important Cases',
  '18.FIR Goswara Summary',
  '19.Financial Fraud Arrest',
  '21.NDPS Action'
]);

const ALWAYS_EXCLUDED_SHEETS = new Set([
  '9.Listed Criminals Action',
  '11.PI Dispose manual, prop. mvt',
  '12.Juveniles Conflict Law',
  '20.Patrolling Checking',
  '22.Servant Verification',
  '23.Mobile Recovered PS',
  '24.Mobile Recovered Summary',
  'Sheet1'
]);

// ----------------------------------------
// Main parallel generator entrypoint
// ----------------------------------------
export const generateParallelReport = async (jobId, filters, filePath, tableNames = null) => {
  console.log(`[ParallelReportService] Compiling jobId: ${jobId} to file: ${filePath} (tableNames: ${tableNames})`);
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const templatePath = path.resolve(__dirname, '../../../../Master/Daily_Diary_ProperHeaders template.xlsx');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template workbook not found at: ${templatePath}`);
  }
  
  // Copy template
  fs.copyFileSync(templatePath, filePath);
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  
  const date = filters.from || filters.date || new Date().toISOString().split('T')[0];
  const resolved = await resolveIntFilters(filters);
  const psIds = resolved.psIds;
  const districtId = resolved.districtId;

  // Determine sheets to keep
  let sheetsToKeep = GENERATABLE_SHEETS;
  if (tableNames && Array.isArray(tableNames)) {
    const selected = new Set();
    for (const tbl of tableNames) {
      const wsName = OLD_TABLE_TO_NEW_SHEET[tbl];
      if (wsName) {
        selected.add(wsName);
      }
    }
    sheetsToKeep = selected;
  }

  // Remove non-selected and always-excluded sheets
  workbook.worksheets.forEach(ws => {
    if (!sheetsToKeep.has(ws.name) || ALWAYS_EXCLUDED_SHEETS.has(ws.name)) {
      console.log(`[ParallelReportService] Removing worksheet: ${ws.name}`);
      workbook.removeWorksheet(ws.id);
    }
  });

  // Stamp title date on all remaining worksheets
  workbook.worksheets.forEach(ws => stampTitleDate(ws, date));

  // Helper check for sub-blocks
  const isSubBlockSelected = (oldTableName) => {
    if (!tableNames) return true;
    return tableNames.includes(oldTableName);
  };

  // 1. Manual FIR (custom populator)
  if (sheetsToKeep.has('1.Manual FIR')) {
    try {
      await populateSheet1_ManualFIR(workbook, date, filters);
    } catch (err) {
      console.error('[ParallelReport] Sheet 1 top-level error:', err.message);
    }
  }

  // 2. E-burglary,E-House E-theft, mvt (4 stacked sub-tables, processed bottom-to-top)
  if (sheetsToKeep.has('E-burglary,E-House E-theft, mvt')) {
    const ws2 = workbook.getWorksheet('E-burglary,E-House E-theft, mvt');
    if (ws2) {
      // Compute all section boundaries from the LIVE template before any mutation.
      // Bottom-to-top order ensures earlier insertions never shift later block rows.
      const s2blocks = findSectionBlocks(ws2, ['2.1', '2.2', '2.3', '2.4']);
      const b21 = s2blocks.find(b => b.prefix === '2.1');
      const b22 = s2blocks.find(b => b.prefix === '2.2');
      const b23 = s2blocks.find(b => b.prefix === '2.3');
      const b24 = s2blocks.find(b => b.prefix === '2.4');

      // Block 2.4: MVT (bottom — process first)
      if (b24) await populateBlockFromView({
        ws: ws2, viewName: 'rpt_05_mvt_cases', date, filters,
        startRow: b24.dataStart, endRow: b24.dataEnd, colCount: 15,
        colMapping: r => [
          r['SR.'], r['P.S.'], r['FIR NO.'], r['U/S'], r['NAME OF COMPLAINANT'],
          r['FATHER/ HUSBAND NAME OF COMPLAINANT'], r['ADDRESS OF COMPLAINANT'],
          r['DATE OF OCCURRENCE'], r['TIME OF OCCURRENCE'], r['VEHICLE NO.'],
          r['VEHICLE TYPE'], r['PLACE OF OCCURRENCE'], r['IO NAME'], r['IO MOBILE NO.'], r['BEAT NO.']
        ],
        isSelected: isSubBlockSelected('excel_5mvt_cases')
      });

      // Block 2.3: E-Other Theft
      if (b23) await populateBlockFromView({
        ws: ws2, viewName: 'rpt_04_e_other_theft_cases',
        joinTable: 'fir_master', baseSelectFields: ['date_of_occurrence'],
        date, filters, startRow: b23.dataStart, endRow: b23.dataEnd, colCount: 14,
        colMapping: r => [
          r['SR. NO.'], r['P.S.'], r['E-FIR NO.'], r['U/S'], r['NAME OF COMPLAINANT'],
          r['FATHER/ HUSBAND NAME OF COMPLAINANT'], r['ADDRESS OF COMPLAINANT'],
          r.date_of_occurrence, r['TIME OF OCCURRENCE'], r['STOLEN ITEMS'],
          r['PLACE OF OCCURRENCE'], r['IO NAME'], r['IO MOBILE NO.'], r['BEAT NO.']
        ],
        isSelected: isSubBlockSelected('excel_4eother_theft_cases')
      });

      // Block 2.2: E-House Theft
      if (b22) await populateBlockFromView({
        ws: ws2, viewName: 'rpt_03_e_house_theft_cases',
        joinTable: 'fir_master', baseSelectFields: ['date_of_occurrence'],
        date, filters, startRow: b22.dataStart, endRow: b22.dataEnd, colCount: 14,
        colMapping: r => [
          r['SR. NO.'], r['P.S.'], r['E-FIR NO.'], r['U/S'], r['NAME OF COMPLAINANT'],
          r['FATHER/ HUSBAND NAME OF COMPLAINANT'], r['ADDRESS OF COMPLAINANT'],
          r.date_of_occurrence, r['TIME OF OCCURRENCE'], r['STOLEN ITEMS'],
          r['PLACE OF OCCURRENCE'], r['IO NAME'], r['IO MOBILE NO.'], r['BEAT NO.']
        ],
        isSelected: isSubBlockSelected('excel_3ehouse_theft_cases')
      });

      // Block 2.1: E-Burglary (top — process last)
      if (b21) await populateBlockFromView({
        ws: ws2, viewName: 'rpt_02_e_burglary_cases',
        joinTable: 'fir_master', baseSelectFields: ['date_of_occurrence'],
        date, filters, startRow: b21.dataStart, endRow: b21.dataEnd, colCount: 14,
        colMapping: r => [
          r['SR. NO.'], r['P.S.'], r['E-FIR NO.'], r['U/S'], r['NAME OF COMPLAINANT'],
          r['FATHER/ HUSBAND NAME OF COMPLAINANT'], r['ADDRESS OF COMPLAINANT'],
          r.date_of_occurrence, r['TIME OF OCCURRENCE'], r['STOLEN ITEMS'],
          r['PLACE OF OCCURRENCE'], r['IO NAME'], r['IO MOBILE NO.'], r['BEAT NO.']
        ],
        isSelected: isSubBlockSelected('excel_2eburglary_cases')
      });
    }
  }

  // 3. Persons Arrested in All Heads (aggregate function)
  if (sheetsToKeep.has('3. Arrested All Heads')) {
    const ws3 = workbook.getWorksheet("3. Arrested All Heads");
    if (ws3) {
      if (ws3.rowCount >= 4) ws3.spliceRows(4, ws3.rowCount - 3);
      try {
        const rawRes = await db.raw(`SELECT * FROM rpt_06_arrested_all_heads_fn(?)`, [date]);
        let rows = rawRes.rows || [];
        if (psIds && psIds.length > 0) {
          const psRows = await db('ref_police_station').whereIn('ps_id', psIds);
          const psNames = psRows.map(p => p.ps_name);
          rows = rows.filter(r => psNames.includes(r['BNS/IPC']));
        } else if (districtId) {
          const psRows = await db('ref_police_station').where('district_id', districtId);
          const psNames = psRows.map(p => p.ps_name);
          rows = rows.filter(r => psNames.includes(r['BNS/IPC']));
        }
        let rIdx = 4;
        for (const r of rows) {
          const vals = [
            r['BNS/IPC'], r['TOTAL NO DD – 126/170 BNSS'], r['TOTAL NO DD – 126/169 BNSS'],
            r['TOTAL NO DD – 109 BNSS'], r['109 G'], r['TOTAL L NO DD – 110 BNSS'], r['110 G'],
            r['92/93/97 DP ACT'], r['TOTAL NO DD – 40 EX.'], r['40 EX.'], r['35.1D'],
            r['A.ACT'], r['G.ACT'], r['33 EX.'], r['NDPS'], r['OTHERS ACT'], r['OTHERS BNSS'], r['PO']
          ].map((v, idx) => formatCellValue(v, String(idx)));
          ws3.spliceRows(rIdx, 0, vals);
          applyStylesToRow(ws3.getRow(rIdx), 18);
          rIdx++;
        }
      } catch (err) {
        console.error('[ParallelReport] Sheet 3 query error:', err.message);
      }
    }
  }

  // 4. Persons Arrested of East District in all heads (S7)
  // rpt_07 already hard-filters WHERE district_name='East District'; don't apply
  // the PS/district filter here so all East District arrests always appear.
  if (sheetsToKeep.has('4.Arrested East District')) {
    await populateBlockFromView({
      ws: workbook.getWorksheet("4.Arrested East District"),
      viewName: "rpt_07_arrested_east_district",
      joinTable: "arrest_master",
      date,
      filters: {},
      startRow: 4,
      endRow: null,
      colCount: 18,
      colMapping: r => [
        r['S.N.'], r['FIR NO.'], r['U/S'], r['NAME '], r['FATHER/ HUSBAND NAME '], r['ADDRESS '],
        r['AGE'], r['NAME OF IO'], r['PC/JC/BAIL'], r['PREV. INVOLVEMENT (NO. OF CASES)'],
        r['RECOVERY'], r['WHETHER ACCUSED IS BC OR NOT'], r['INTEGRATED PI'], r['GROUP PATROLLING'],
        r['CYCLE PATROLLING'], r['BY ANTI-SNATCHING TEAM'], r['BY PRAHARI'], r['BY EYES & EARS SCHEME MEMBERS']
      ]
    });
  }

  // 5. Persons Arrested in Kalandara (S8)
  if (sheetsToKeep.has('5.Arrested Kalandara')) {
    await populateBlockFromView({
      ws: workbook.getWorksheet("5.Arrested Kalandara"),
      viewName: "rpt_08_arrested_kalandara",
      joinTable: "arrest_master",
      date,
      filters,
      startRow: 4,
      endRow: null,
      colCount: 18,
      colMapping: r => [
        r['S.N.'], r['FIR/DD NO.'], r['Under section (U/S)'], r['NAME '], r['FATHER/ HUSBAND NAME '], r['ADDRESS '],
        r['AGE'], r['PLACE OF OCCURRENCE'], r['IO'], r['BAIL'], r['PREV. INVOLVEMENT'],
        r['RECOVERY'], r['WHETHER ACCUSED IS BC OR NOT'], r['INTEGRATED PICK'], r['GROUP PATROLLING'],
        r['CYCLE PATROLLING'], r['BY ANTI-SNATCHING TEAM'], r['BY PRAHARI'], r['BY EYES & EARS SCHEME MEMBERS']
      ]
    });
  }

  // 6. Daily Persons Arrested in E-FIR of Theft (S9)
  if (sheetsToKeep.has('6.Arrested E-FIR Theft')) {
    await populateBlockFromView({
      ws: workbook.getWorksheet("6.Arrested E-FIR Theft"),
      viewName: "rpt_09_arrested_efir_theft",
      joinTable: "arrest_master",
      date,
      filters,
      startRow: 4,
      endRow: null,
      colCount: 17,
      colMapping: r => [
        r['S.N.'], r['FIR/DD NO.'], r['U/S'], r['NAME '], r['FATHER/ HUSBAND NAME '], r['ADDRESS '],
        r['AGE'], r['NAME OF IO'], r['PC/JC/BAIL'], r['PREV. INVOLVEMENT (NO. OF CASES) HEAD'],
        r['RECOVERY'], r['WHETHER ACCUSED IS BC OR NOT'], r['GROUP ROLLING'], r['CYCLE PATROLLING'],
        r['BY ANTI-SNATCHING TEAM'], r['BY PRAHARI'], r['BY EYES & EARS SCHEME MEMBERS']
      ]
    });
  }

  // 7. Daily Persons Arrested in E-FIR of MV Theft (S10)
  if (sheetsToKeep.has('7.Arrested E-FIR MV Theft')) {
    await populateBlockFromView({
      ws: workbook.getWorksheet("7.Arrested E-FIR MV Theft"),
      viewName: "rpt_10_arrested_efir_mv_theft",
      joinTable: "arrest_master",
      date,
      filters,
      startRow: 4,
      endRow: null,
      colCount: 16,
      colMapping: r => [
        r['FIR NO.'], r['U/S'], r['NAME '], r['FATHER/ HUSBAND NAME '], r['ADDRESS '], r['AGE'],
        r['NAME OF IO'], r['PC/JC/BAIL'], r['PREV. INVOLVEMENT'], r['RECOVERY'],
        r['WHETHER ACCUSED IS BC OR NOT'], r['GROUP PATROLLING'], r['CYCLE PATROLLING'],
        r['BY ANTI-SNATCHING TEAM'], r['BY PRAHARI'], r['BY EYES & EARS SCHEME MEMBERS']
      ]
    });
  }

  // 8. Proclaimed Offenders & PO Arrested (S11)
  if (sheetsToKeep.has('8.Proclaimed Offenders')) {
    await populateBlockFromView({
      ws: workbook.getWorksheet("8.Proclaimed Offenders"),
      viewName: "rpt_11_proclaimed_offenders",
      joinTable: "arrest_master",
      date,
      filters,
      startRow: 4,
      endRow: null,
      colCount: 9,
      colMapping: r => [
        r['S.N.'], r['P.S.'], r['DD NO./FIR NO.'], r['U/S'], r['DETAILS OF PO – NAME'],
        r['DETAILS OF PO – PARENTAL'], r['DETAILS OF PO –  ADDRESS'], r['CASE IN WHICH DECLARED PO'],
        r['NAME OF COURT WHICH DECLARED PO']
      ]
    });
  }

  // 10. District East – List of Arrested Persons for Last 24 Hours (S13)
  if (sheetsToKeep.has('10.Arrested 24 Hrs List')) {
    await populateBlockFromView({
      ws: workbook.getWorksheet("10.Arrested 24 Hrs List"),
      viewName: "rpt_13_arrested_24hrs_list",
      joinTable: "arrest_master",
      baseSelectFields: ['date_of_arrest'],
      date,
      filters,
      startRow: 5,
      endRow: null,
      colCount: 13,
      colMapping: r => [
        r['S. NO.'], r['NAME / NICK NAME'], r['FATHER NAME/HUSBAND NAME'], r['ADDRESS'], r['AGE'],
        r['FIR/DD NO.'], r.date_of_arrest, r['U/S'], r['POLICE STATION'], r['NAME OF IO'],
        r['RANK OF IO'], r['MOBILE NO. OF IO'], r['REMARKS (PC REMAND / FORMAL ARREST / BAIL ETC.)']
      ]
    });
  }

  // 13. Missing, uidb, abandon,trace (4 stacked sub-tables, processed bottom-to-top)
  if (sheetsToKeep.has('13.Missing, uidb, abandon,trace')) {
    const ws13 = workbook.getWorksheet('13.Missing, uidb, abandon,trace');
    if (ws13) {
      const s13blocks = findSectionBlocks(ws13, ['Missing Persons', 'UIDB', 'Abandoned', 'Traced Person']);
      const b131 = s13blocks.find(b => b.prefix === 'Missing Persons');
      const b132 = s13blocks.find(b => b.prefix === 'UIDB');
      const b133 = s13blocks.find(b => b.prefix === 'Abandoned');
      const b134 = s13blocks.find(b => b.prefix === 'Traced Person');

      // Block 13.4: Traced Persons (bottom)
      if (b134) await populateBlockFromView({
        ws: ws13, viewName: 'rpt_21_traced_persons', date, filters,
        startRow: b134.dataStart, endRow: b134.dataEnd, colCount: 8,
        colMapping: r => [
          r['S.NO.'], r['DD NO.'], r['DD DATE'], r['NAME OF OPERATOR TO WHOM MPS'],
          r['NAME OF TRACED PERSON'], r['FATHER/HUSBAND NAME OF TRACED PERSON'],
          r['ADDRESS OF TRACED PERSON'], r['NAME OF I.O.']
        ],
        isSelected: isSubBlockSelected('excel_21traced_persons')
      });

      // Block 13.3: Abandoned Persons
      if (b133) await populateBlockFromView({
        ws: ws13, viewName: 'rpt_20_abandoned_persons',
        joinTable: 'missing_master', baseSelectFields: ['reference_entry_date'],
        date, filters, startRow: b133.dataStart, endRow: b133.dataEnd, colCount: 17,
        colMapping: r => [
          r['S.NO.'], r['DD NO.'], r.reference_entry_date, r['FOUND PLACE'], r['FOUND DATE'],
          r['SEX'], r['AGE'], r['HEIGHT'], r['BUILT'], r['COMPLEXION'], r['FACE'],
          r['HAIR'], r['BEARD'], r['MUSTACHES'], r['UPPER DRESS COLOR'], r['LOWER DRESS COLOR'],
          r['NAME OF I.O.']
        ],
        isSelected: isSubBlockSelected('excel_20abandoned_persons')
      });

      // Block 13.2: UIDB
      if (b132) await populateBlockFromView({
        ws: ws13, viewName: 'rpt_19_uidb', date, filters,
        startRow: b132.dataStart, endRow: b132.dataEnd, colCount: 17,
        colMapping: r => [
          r['S.NO.'], r['DD NO.'], r['DD DATE'], r['FOUND PLACE'], r['FOUND DATE'],
          r['SEX'], r['AGE'], r['HEIGHT'], r['BUILT'], r['COMPLEXION'], r['FACE'],
          r['HAIR'], r['BEARD'], r['MUSTACHES'], r['UPPER DRESS COLOR'], r['LOWER DRESS COLOR'],
          r['NAME OF I.O.']
        ],
        isSelected: isSubBlockSelected('excel_19uidb')
      });

      // Block 13.1: Missing Persons (top — process last)
      if (b131) await populateBlockFromView({
        ws: ws13, viewName: 'rpt_18_missing_persons', date, filters,
        startRow: b131.dataStart, endRow: b131.dataEnd, colCount: 18,
        colMapping: r => [
          r['S.NO.'], r['DD NO.'], r['DD DATE'], r['NAME OF OPERATOR TO WHOM MPS'],
          r['NAME OF MISSING PERSON'], r['ADDRESS OF MISSING PERSON'], r['MISSING DATE'],
          r['AGE'], r['HEIGHT'], r['BUILT'], r['COMPLEXION'], r['FACE'], r['HAIR'],
          r['BEARD'], r['MUSTACHES'], r['UPPER DRESS COLOR'], r['LOWER DRESS COLOR'], r['NAME OF I.O.']
        ],
        isSelected: isSubBlockSelected('excel_18missing_persons')
      });
    }
  }

  // 14. Women and Children Missing Summary (custom aggregation mapping, fixed row writes)
  if (sheetsToKeep.has('14.Women, children Missing')) {
    try {
      await populateSheet14_WomenChildrenMissing(workbook, date, filters, tableNames);
    } catch (err) {
      console.error('[ParallelReport] Sheet 14 top-level error:', err.message);
    }
  }

  // 15. Preventive Action (custom populator)
  if (sheetsToKeep.has('15.Preventive Action')) {
    try {
      await populateSheet15_PreventiveAction(workbook, date, filters);
    } catch (err) {
      console.error('[ParallelReport] Sheet 15 top-level error:', err.message);
    }
  }

  // 16. Inquest Registered (2 stacked sub-tables, processed bottom-to-top)
  if (sheetsToKeep.has('16.Inquest Registered')) {
    const ws16 = workbook.getWorksheet('16.Inquest Registered');
    if (ws16) {
      const s16blocks = findSectionBlocks(ws16, ['Inquest Registered', 'Disposal of Inquest']);
      const b161 = s16blocks.find(b => b.prefix === 'Inquest Registered');
      const b162 = s16blocks.find(b => b.prefix === 'Disposal of Inquest');

      // Block 16.2: Disposal (bottom)
      if (b162) await populateBlockFromView({
        ws: ws16, viewName: 'rpt_26_inquest_acp_sdm_disposal', date, filters,
        startRow: b162.dataStart, endRow: b162.dataEnd, colCount: 11,
        colMapping: r => [
          r['S.NO.'], r['DD NO.'], r['DATE'], r['U/S'], r['NAME OF DECEASED'],
          r['FATHER/HUSBAND NAME OF DECEASED'], r['ADDRESS OF DECEASED'],
          r['SEX'], r['AGE'], r['CAUSE OF DEATH'], r['DATE OF FILED BY ACP/SDM']
        ],
        isSelected: isSubBlockSelected('excel_26inquest_acpsdm_disposal')
      });

      // Block 16.1: Registered (top — process last)
      if (b161) await populateBlockFromView({
        ws: ws16, viewName: 'rpt_25_inquest_registered', date, filters,
        startRow: b161.dataStart, endRow: b161.dataEnd, colCount: 12,
        colMapping: r => [
          r['S.N.'], r['DD NO.'], r['DATE'], r['U/S'], r['NAME OF DECEASED'],
          r['FATHER/HUSBAND NAME OF DECEASED'], r['ADDRESS OF DECEASED'],
          r['SEX'], r['AGE'], r['CAUSE OF DEATH'], r['PLACE OF OCCURRENCE'], r['IO']
        ],
        isSelected: isSubBlockSelected('excel_25inquest_registered')
      });
    }
  }

  // 17. Important Cases (custom populator)
  if (sheetsToKeep.has('17.Important Cases')) {
    try {
      await populateSheet17_ImportantCases(workbook, date, filters);
    } catch (err) {
      console.error('[ParallelReport] Sheet 17 top-level error:', err.message);
    }
  }

  // 18. FIR Goswara Summary (aggregate function)
  if (sheetsToKeep.has('18.FIR Goswara Summary')) {
    const ws18 = workbook.getWorksheet("18.FIR Goswara Summary");
    if (ws18) {
      if (ws18.rowCount >= 4) ws18.spliceRows(4, ws18.rowCount - 3);
      try {
        const rawRes = await db.raw(`SELECT * FROM rpt_28_fir_goswara_summary_fn(?)`, [date]);
        let rows = rawRes.rows || [];
        if (psIds && psIds.length > 0) {
          const psRows = await db('ref_police_station').whereIn('ps_id', psIds);
          const distIds = [...new Set(psRows.map(p => p.district_id))];
          const distRows = await db('ref_district').whereIn('district_id', distIds);
          const distNames = distRows.map(d => d.district_name);
          rows = rows.filter(r => distNames.includes(r['DISTRICT']));
        } else if (districtId) {
          const distRow = await db('ref_district').where('district_id', districtId).first();
          rows = distRow ? rows.filter(r => r['DISTRICT'] === distRow.district_name) : [];
        }
        let rIdx = 4;
        for (const r of rows) {
          const vals = [
            r['DISTRICT'], r['MANUAL FIR'], r['Theft (E-FIR)'],
            r['House Theft (E-FIR)'], r['Burglary (E-FIR)'], r['MVT'], r['TOTAL']
          ].map((v, idx) => formatCellValue(v, String(idx)));
          ws18.spliceRows(rIdx, 0, vals);
          applyStylesToRow(ws18.getRow(rIdx), 7);
          rIdx++;
        }
      } catch (err) {
        console.error('[ParallelReport] Sheet 18 query error:', err.message);
      }
    }
  }

  // 19. Financial Fraud Arrest (custom populator)
  if (sheetsToKeep.has('19.Financial Fraud Arrest')) {
    try {
      await populateSheet19_FinancialFraudArrest(workbook, date, filters);
    } catch (err) {
      console.error('[ParallelReport] Sheet 19 top-level error:', err.message);
    }
  }

  // 21. NDPS Action (custom populator)
  if (sheetsToKeep.has('21.NDPS Action')) {
    try {
      await populateSheet21_NDPSAction(workbook, date, filters);
    } catch (err) {
      console.error('[ParallelReport] Sheet 21 top-level error:', err.message);
    }
  }

  // Save workbook
  await workbook.xlsx.writeFile(filePath);
  console.log(`[ParallelReportService] Compiled report saved successfully for jobId: ${jobId}`);
};
