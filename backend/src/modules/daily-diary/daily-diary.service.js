import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import db from '../../config/db.js';
import { publish } from '../../events/eventBus.js';
import { logger } from '../../utils/logger.js';
import { parseJsonField } from './formatters.js';
import { REPORTS, REPORT_COLUMNS, COLUMN_LABELS } from './reports/index.js';

// Re-export so controllers / tests can reference without knowing the internal path
export { REPORTS, REPORT_COLUMNS, COLUMN_LABELS };

// ─── DB Fetch ─────────────────────────────────────────────────────────────────
const getRawRecords = async (date, psId, districtId, subDivId, dateTo = null) => {
  const isRange = dateTo && dateTo !== date;

  // For single-date district requests, use the compiled snapshot if one exists
  let recordIds = null;
  if (!isRange && districtId) {
    const compilation = await db('compilations')
      .where({ source_entity_id: districtId, period: date })
      .first();
    if (compilation) {
      recordIds = typeof compilation.record_ids === 'string'
        ? JSON.parse(compilation.record_ids)
        : (compilation.record_ids || []);
    }
  }

  let query = db('records')
    .select(
      'records.*',
      'ps.name_en   as ps_name',
      'ps.code      as ps_code',
      'dist.name_en as district_name',
      'dist.code    as district_code'
    )
    .leftJoin('hierarchy_nodes as ps',   'records.ps_id',       'ps.id')
    .leftJoin('hierarchy_nodes as dist', 'records.district_id', 'dist.id')
    .whereNot('records.current_status', 'DRAFT');

  if (recordIds && recordIds.length > 0) {
    query = query.whereIn('records.id', recordIds);
  } else if (isRange) {
    query = query.whereBetween('records.record_date', [date, dateTo]);
  } else {
    if (fromDate && toDate) {
      query = query.where('records.record_date', '>=', fromDate)
                   .where('records.record_date', '<=', toDate);
    } else {
      query = query.where('records.record_date', date);
    }
  }

  if (psId) {
    if (typeof psId === 'string' && psId.includes(',')) {
      query = query.whereIn('records.ps_id', psId.split(','));
    } else if (Array.isArray(psId)) {
      query = query.whereIn('records.ps_id', psId);
    } else {
      query = query.where('records.ps_id', psId);
    }
  }
  if (districtId) query = query.where('records.district_id', districtId);
  if (subDivId)   query = query.where('records.sub_div_id',  subDivId);

  const rows = await query.orderBy('records.created_at', 'asc');
  return rows.map(r => ({ ...r, data: parseJsonField(r.data) }));
};

// ─── Classify raw records by type ────────────────────────────────────────────
const classify = (records) => ({
  cases:   records.filter(r => r.record_type === 'CASE' || r.record_type === 'CASES'),
  arrests: records.filter(r => r.record_type === 'ARREST'),
  missing: records.filter(r => r.record_type === 'MISSING'),
  uidb:    records.filter(r => r.record_type === 'UIDB'),
  records,
});

// ─── Sheet Mapper ─────────────────────────────────────────────────────────────
// Runs each report's filter+mapRow (or summarize) to produce per-sheet row arrays.
export const mapRecordsToSheets = (records) => {
  const classified = classify(records);
  const mapped = {};

  for (const report of REPORTS) {
    try {
      if (report.summarize) {
        mapped[report.tableName] = report.summarize(classified);
      } else {
        const subset = report.filter(classified);
        mapped[report.tableName] = subset.map((r, idx) => report.mapRow(r, idx));
      }
    } catch (err) {
      logger.warn(`[DailyDiary] Sheet "${report.tableName}" mapper threw: ${err.message}`);
      mapped[report.tableName] = [];
    }
  }

  return mapped;
};

// ─── Preview (counts only, no file) ──────────────────────────────────────────
export const getDailyDiaryPreview = async (user, date, psId, districtId, subDivId) => {
  const records = await getRawRecords(date, psId, districtId, subDivId);
  const mapped  = mapRecordsToSheets(records);

  const sheetsPreview = {};
  for (const rep of REPORTS) {
    sheetsPreview[rep.tableName.replace('excel_', '').replace(/_/g, ' ')] = {
      tableName: rep.tableName,
      count:     mapped[rep.tableName]?.length || 0,
    };
  }
  return { date, totalRecordsFetched: records.length, sheetsPreview };
};

// ─── Data fetch (for frontend preview tables) ─────────────────────────────────
export const getDailyDiaryData = async (user, date, psId, districtId, subDivId, tableName = null) => {
  const records = await getRawRecords(date, psId, districtId, subDivId);
  const mapped  = mapRecordsToSheets(records);
  if (tableName) return { [tableName]: mapped[tableName] || [] };
  return mapped;
};

// ─── Queue Export Job ─────────────────────────────────────────────────────────
export const queueDailyDiaryExport = async (user, date, psId, districtId, subDivId, tableNamesFilter = null, dateTo = null) => {
  const records    = await getRawRecords(date, psId, districtId, subDivId, dateTo);
  const allSheets  = mapRecordsToSheets(records);
  const activeTables = tableNamesFilter || REPORTS.map(r => r.tableName);

  const sheets = {};
  for (const tableName of activeTables) {
    if (allSheets[tableName] !== undefined) sheets[tableName] = allSheets[tableName];
  }

  const customDefinition = {
    type:           'DAILY_DIARY',
    date,
    reports:        REPORTS,
    report_columns: REPORT_COLUMNS,
    column_labels:  COLUMN_LABELS,
    sheets,
  };

  const jobId      = uuidv4();
  const reportsDir = process.env.REPORTS_DIR || './generated-reports';
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  const filePath   = path.join(reportsDir, `${jobId}.xlsx`);
  const userId     = user?.userId || user?.id || null;

  await db('report_jobs').insert({
    id:                jobId,
    template_id:       null,
    custom_definition: JSON.stringify(customDefinition),
    filters:           JSON.stringify({ date, ps_id: psId, district_id: districtId }),
    format:            'EXCEL',
    status:            'PENDING',
    file_path:         filePath,
    created_by:        userId,
    created_at:        new Date().toISOString(),
    updated_at:        new Date().toISOString(),
  });

  try {
    await publish('report.requested', {
      job_id:            jobId,
      custom_definition: customDefinition,
      filters:           { date },
      format:            'EXCEL',
      user_id:           userId,
    });
  } catch {
    // Non-fatal — in-process setImmediate in the controller handles the job
  }

  return { jobId };
};

// ─── Excel Builder ────────────────────────────────────────────────────────────
// Builds the workbook from already-mapped sheet data.
// columnLabels defaults to the aggregated labels from all report files.
export const buildDailyDiaryExcel = async (sheetsData, reports, reportColumns, filePath, columnLabels = COLUMN_LABELS) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PHAROS';
  workbook.created = new Date();

  const resolveHeader = (key) =>
    columnLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const COMBINED_KEYS = new Set(['complainant_details', 'arrested_details', 'accused_details', 'po_details', 'deceased_details', 'traced_person_details']);

  for (const report of reports) {
    const { tableName, label } = report;
    const rows = sheetsData[tableName];
    if (!rows || rows.length === 0) continue;

    const cols = reportColumns[tableName] || [];
    if (cols.length === 0) continue;

    const ws = workbook.addWorksheet(label.slice(0, 31));

    const headerRow = ws.addRow(cols.map(resolveHeader));
    headerRow.font = { bold: true };
    headerRow.eachCell(cell => {
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1D5DB' } };
      cell.border    = { bottom: { style: 'thin', color: { argb: 'FF9CA3AF' } } };
      cell.alignment = { wrapText: true, vertical: 'middle' };
    });
    ws.getRow(1).height = 30;

    for (const row of rows) {
      ws.addRow(cols.map(col => row[col] ?? ''));
    }

    ws.columns.forEach((col, i) => {
      const key        = cols[i];
      const isCombined = COMBINED_KEYS.has(key);
      let maxLen = isCombined ? 40 : 10;
      col.eachCell({ includeEmpty: true }, cell => {
        const v = cell.value ? String(cell.value) : '';
        if (v.length > maxLen) maxLen = v.length;
      });
      col.width = Math.min(maxLen + 2, isCombined ? 80 : 50);
    });
  }

  if (workbook.worksheets.length === 0) {
    workbook.addWorksheet('No Data').addRow(['No records found for the selected date and station filters.']);
  }

  await workbook.xlsx.writeFile(filePath);
};
