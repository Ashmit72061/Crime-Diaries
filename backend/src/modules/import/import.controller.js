import db from '../../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import ExcelJS from 'exceljs';
import { publish } from '../../events/eventBus.js';
import { computeRowHash } from '../../utils/hash.js';
import { logger } from '../../utils/logger.js';
import { generateUID } from '../records/records.service.js';
import { createLink } from '../record-links/record-links.service.js';


// Helper to check if a field is required
const isRequired = (field) => {
  if (!field.validation_rules) return false;
  try {
    const rules = typeof field.validation_rules === 'string'
      ? JSON.parse(field.validation_rules)
      : field.validation_rules;
    return !!rules.required;
  } catch (e) {
    return false;
  }
};

// Helper to determine the best record date for insertion
const getRecordDate = (recordType, rowData) => {
  if (recordType === 'CASE') {
    return rowData.fir_date || rowData.gd_date || rowData.occurrence_date;
  }
  if (recordType === 'ARREST') {
    return rowData.arrest_date || (rowData.date_and_time_of_arrest ? rowData.date_and_time_of_arrest.split(' ')[0] : null);
  }
  if (recordType === 'PCR_CALL') {
    return rowData.gd_date;
  }
  return null;
};

// Helpers for validators
const isValidDate = (val) => {
  if (val instanceof Date) return !isNaN(val.getTime());
  if (typeof val === 'string') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
    const d = new Date(val);
    return !isNaN(d.getTime());
  }
  return false;
};

const isValidTime = (val) => {
  if (typeof val === 'string') {
    return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(val);
  }
  if (val instanceof Date) {
    return true;
  }
  return false;
};

const isValidNumber = (val) => {
  if (typeof val === 'number') return true;
  if (typeof val === 'string') {
    return !isNaN(Number(val.trim()));
  }
  return false;
};

const isValidSelect = (field, val) => {
  let options = [];
  try {
    options = typeof field.options === 'string' ? JSON.parse(field.options) : field.options;
  } catch (e) {}
  if (!Array.isArray(options) || options.length === 0) return true;
  const allowedValues = options.map(o => (o && typeof o === 'object') ? o.value : o);
  return allowedValues.includes(val);
};

const checkMaxLength = (field, val) => {
  try {
    const rules = typeof field.validation_rules === 'string' ? JSON.parse(field.validation_rules) : field.validation_rules;
    if (rules && rules.maxLength && String(val).length > rules.maxLength) {
      return false;
    }
  } catch (e) {}
  return true;
};

const checkRegex = (field, val) => {
  try {
    const rules = typeof field.validation_rules === 'string' ? JSON.parse(field.validation_rules) : field.validation_rules;
    if (rules && rules.regex) {
      const regex = new RegExp(rules.regex);
      return regex.test(String(val));
    }
  } catch (e) {}
  return true;
};

// Generate template hints row
const getHint = (field) => {
  const reqStr = isRequired(field) ? '[Required] ' : '';
  if (field.field_type === 'SELECT') {
    let options = [];
    try {
      options = typeof field.options === 'string' ? JSON.parse(field.options) : field.options;
    } catch (e) {}
    const optList = Array.isArray(options) ? options.map(o => (o && typeof o === 'object') ? o.value : o).join(', ') : '';
    return `${reqStr}select: ${optList}`;
  }
  if (field.field_type === 'DATE') {
    return `${reqStr}date (YYYY-MM-DD)`;
  }
  if (field.field_type === 'TIME') {
    return `${reqStr}time (HH:MM)`;
  }
  if (field.field_type === 'NUMBER') {
    return `${reqStr}number`;
  }
  return `${reqStr}${field.field_type.toLowerCase()}`;
};

const CASE_CUSTOM_MAPPINGS = {
  'local head': 'local_head',
  'local head (crime)': 'local_head',
  'fir no.': 'fir_no',
  'fir no': 'fir_no',
  'fir number': 'fir_no',
  'fir date': 'fir_date',
  'under section': 'sections',
  'sections': 'sections',
  'date of occurance': 'occurrence_date',
  'date of occurrence': 'occurrence_date',
  'place of occurance': 'occurrence_place',
  'place of occurrence': 'occurrence_place',
  'brief fact of the case': 'brief_facts',
  'brief facts of the case': 'brief_facts',
  'property (stolen)': 'stolen_property',
  'property description': 'stolen_property',
  'property (recovered)': 'recovered_property',
  'recovery property': 'recovered_property',
  'name of complainant': 'complainant_name',
  'complainant name': 'complainant_name',
  'present address of complainant': 'complainant_address',
  'complainant address': 'complainant_address',
  'name of io name': 'io_name',
  'name of io': 'io_name',
};

const ARREST_CUSTOM_MAPPINGS = {
  'local head': 'crime_head',
  'crime head': 'crime_head',
  'fir no. (legacy only)': 'linked_fir_dd_no',
  'linked fir / dd no.': 'linked_fir_dd_no',
  'under section': 'sections',
  'sections': 'sections',
  'date of arrest': 'arrest_date',
  'name of io name': 'io_name',
  'name of io': 'io_name',
  'property (recovered)': 'recovery',
  'recovery': 'recovery',
  'name of arrested person': 'arrested_name',
  'address of arrested': 'arrested_address',
  'name & address of accused': 'name_and_address_of_accused'
};

const buildColumnMap = (worksheet, recordType, registryFields) => {
  const row1Values = [];
  const row2Values = [];
  worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
    row1Values.push(cell.value ? String(cell.value).trim() : '');
  });
  worksheet.getRow(2).eachCell({ includeEmpty: true }, (cell) => {
    row2Values.push(cell.value ? String(cell.value).trim() : '');
  });

  const registryKeysSet = new Set(registryFields.map(f => f.field_key));

  let hasHiddenKeys = false;
  let matchingKeysCount = 0;
  row1Values.forEach(val => {
    if (registryKeysSet.has(val)) matchingKeysCount++;
  });
  if (matchingKeysCount >= 3) {
    hasHiddenKeys = true;
  }

  const colMap = {};
  let dataStartRow = 4;

  if (hasHiddenKeys) {
    row1Values.forEach((val, idx) => {
      const colIdx = idx + 1;
      if (val) colMap[colIdx] = val;
    });
  } else {
    let headerRowIdx = 1;
    let headerValues = row1Values;

    let row1Matches = 0;
    let row2Matches = 0;

    const mappings = recordType === 'CASE' ? CASE_CUSTOM_MAPPINGS : ARREST_CUSTOM_MAPPINGS;

    row1Values.forEach(val => {
      const normVal = String(val).toLowerCase().trim();
      if (mappings[normVal] || registryKeysSet.has(normVal)) row1Matches++;
    });

    row2Values.forEach(val => {
      const normVal = String(val).toLowerCase().trim();
      if (mappings[normVal] || registryKeysSet.has(normVal)) row2Matches++;
    });

    if (row2Matches > row1Matches) {
      headerRowIdx = 2;
      headerValues = row2Values;
      dataStartRow = 3;
    } else {
      dataStartRow = 2;
    }

    headerValues.forEach((val, idx) => {
      const colIdx = idx + 1;
      if (!val) return;
      const cleanVal = String(val).trim();
      const normVal = cleanVal.toLowerCase();

      if (mappings[normVal]) {
        colMap[colIdx] = mappings[normVal];
        return;
      }

      if (registryKeysSet.has(cleanVal)) {
        colMap[colIdx] = cleanVal;
        return;
      }

      const fieldByLabel = registryFields.find(f => 
        String(f.label_en || '').toLowerCase().trim() === normVal ||
        String(f.label_hi || '').toLowerCase().trim() === normVal
      );
      if (fieldByLabel) {
        colMap[colIdx] = fieldByLabel.field_key;
        return;
      }
      
      colMap[colIdx] = normVal;
    });
  }

  return { colMap, dataStartRow, hasHiddenKeys };
};

const parseFirAndYear = (str) => {
  if (!str) return { firNo: '', year: null };
  const clean = String(str).trim();
  const match = clean.match(/(?:FIR[- ]*)?(\d+)\/(\d+)/i);
  if (match) {
    let seq = match[1];
    let yr = match[2];
    if (yr.length === 2) {
      yr = '20' + yr;
    }
    return { firNo: seq, year: parseInt(yr, 10) };
  }
  const simpleMatch = clean.match(/^(\d+)$/);
  if (simpleMatch) {
    return { firNo: simpleMatch[1], year: null };
  }
  return { firNo: clean, year: null };
};

const runAutoLinkageForArrests = async (trx, arrestRecords, psId, userId) => {
  const linkedDetails = [];
  const unmatchedDetails = [];

  const cases = await trx('records')
    .where({ record_type: 'CASE', ps_id: psId })
    .select('id', 'data');

  const parsedCases = cases.map(c => {
    let dataObj = {};
    try {
      dataObj = typeof c.data === 'string' ? JSON.parse(c.data) : c.data;
    } catch(e) {}
    const firNo = dataObj.fir_no || '';
    const firDate = dataObj.fir_date || '';
    const firYear = firDate ? new Date(firDate).getFullYear() : null;
    return {
      id: c.id,
      data: dataObj,
      firNo,
      firYear
    };
  });

  for (const arrest of arrestRecords) {
    const arrestData = arrest.data;
    const linkedFirDdNo = arrestData.linked_fir_dd_no;

    if (!linkedFirDdNo) {
      unmatchedDetails.push({
        arrest_uid: arrestData.uid,
        linked_fir_dd_no: null,
        reason: 'No Linked FIR / DD No. provided in arrest record'
      });
      continue;
    }

    const parsedArrest = parseFirAndYear(linkedFirDdNo);

    const candidates = parsedCases.filter(c => {
      const parsedCaseFir = parseFirAndYear(c.firNo);
      return parsedCaseFir.firNo === parsedArrest.firNo && parsedCaseFir.firNo !== '';
    });

    if (candidates.length === 0) {
      unmatchedDetails.push({
        arrest_uid: arrestData.uid,
        linked_fir_dd_no: linkedFirDdNo,
        reason: 'No matching CASE record found with this FIR number'
      });
      continue;
    }

    let yearFiltered = candidates;
    if (parsedArrest.year) {
      yearFiltered = candidates.filter(c => {
        const parsedCaseFir = parseFirAndYear(c.firNo);
        const caseYear = parsedCaseFir.year || c.firYear;
        return caseYear === parsedArrest.year;
      });
    }

    if (yearFiltered.length === 0) {
      unmatchedDetails.push({
        arrest_uid: arrestData.uid,
        linked_fir_dd_no: linkedFirDdNo,
        reason: `Case found but year mismatch (Expected FIR year: ${parsedArrest.year})`
      });
      continue;
    }

    let bestCase = null;
    if (yearFiltered.length === 1) {
      bestCase = yearFiltered[0];
    } else {
      let bestScore = -1;
      for (const candidate of yearFiltered) {
        let score = 0;
        const candidateData = candidate.data;

        if (candidateData.local_head && arrestData.crime_head) {
          if (String(candidateData.local_head).trim().toLowerCase() === String(arrestData.crime_head).trim().toLowerCase()) {
            score += 1;
          }
        }

        if (candidateData.sections && arrestData.sections) {
          if (String(candidateData.sections).trim().toLowerCase() === String(arrestData.sections).trim().toLowerCase()) {
            score += 1;
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestCase = candidate;
        }
      }
    }

    if (bestCase) {
      try {
        await createLink({
          sourceRecordId: bestCase.id,
          targetRecordId: arrest.id,
          linkTypeCode: 'CASE_ARREST',
          userId,
          metadata: { notes: 'Auto-linked during bulk import' }
        });

        const caseData = bestCase.data;
        linkedDetails.push({
          arrest_uid: arrestData.uid,
          case_uid: caseData.uid,
          fir_no: caseData.fir_no
        });
      } catch (err) {
        logger.error(`[AutoLinkage] Failed to create link: ${err.message}`);
        unmatchedDetails.push({
          arrest_uid: arrestData.uid,
          linked_fir_dd_no: linkedFirDdNo,
          reason: `Failed to link: ${err.message}`
        });
      }
    } else {
      unmatchedDetails.push({
        arrest_uid: arrestData.uid,
        linked_fir_dd_no: linkedFirDdNo,
        reason: 'Multiple matching cases found but secondary validation failed'
      });
    }
  }

  return {
    linkedCount: linkedDetails.length,
    unmatchedCount: unmatchedDetails.length,
    linkedDetails,
    unmatchedDetails
  };
};


// Generate transaction-safe import UIDs
const generateImportUID = async (trx, recordType, psId, dateStr) => {
  const ps = await trx('hierarchy_nodes').where({ id: psId }).first();
  const psCode = ps?.code || 'PS';
  const cleanDate = (dateStr || new Date().toISOString().split('T')[0]).replace(/[^0-9]/g, '').slice(0, 8);
  const countRow = await trx('records')
    .where({ ps_id: psId, record_type: recordType })
    .count('* as count')
    .first();
  const seq = String((parseInt(countRow.count, 10) || 0) + 1).padStart(4, '0');
  return `${recordType}-${psCode}-${cleanDate}-${seq}`;
};

// 1. GET /api/import/template/:record_type
export const downloadImportTemplate = async (req, res) => {
  const recordType = req.params.record_type.toUpperCase();
  const lang = req.query.lang || 'en';

  const validTypes = ['ARREST', 'PCR_CALL', 'CASE'];
  if (!validTypes.includes(recordType)) {
    return res.status(400).json({ success: false, message: `Invalid record type '${recordType}'` });
  }

  try {
    const allFields = await db('field_registry')
      .where('is_active', true)
      .orderBy('sort_order', 'asc');

    const fields = allFields.filter(f => {
      try {
        const types = typeof f.applicable_record_types === 'string'
          ? JSON.parse(f.applicable_record_types)
          : f.applicable_record_types;
        return Array.isArray(types) && types.map(t => t.toUpperCase()).includes(recordType);
      } catch (e) {
        return false;
      }
    });

    fields.sort((a, b) => {
      const reqA = isRequired(a) ? 1 : 0;
      const reqB = isRequired(b) ? 1 : 0;
      if (reqA !== reqB) {
        return reqB - reqA;
      }
      return (a.sort_order || 0) - (b.sort_order || 0);
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Import Template');

    // Row 1: field_keys (hidden)
    const row1 = fields.map(f => f.field_key);
    worksheet.addRow(row1);
    worksheet.getRow(1).hidden = true;

    // Row 2: English or Hindi labels
    const row2 = fields.map(f => lang === 'hi' ? f.label_hi : f.label_en);
    const headerRow = worksheet.addRow(row2);
    headerRow.height = 25;
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A8A' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Row 3: hint descriptors
    const row3 = fields.map(f => getHint(f));
    const hintRow = worksheet.addRow(row3);
    hintRow.height = 20;
    hintRow.font = { italic: true, color: { argb: 'FF6B7280' } };
    hintRow.eachCell(cell => {
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Data validations for drop-downs
    for (let colIdx = 0; colIdx < fields.length; colIdx++) {
      const field = fields[colIdx];
      if (field.field_type === 'SELECT') {
        let options = [];
        try {
          options = typeof field.options === 'string' ? JSON.parse(field.options) : field.options;
        } catch (e) {}
        if (Array.isArray(options) && options.length > 0) {
          const validValues = options.map(o => (o && typeof o === 'object') ? o.value : o);
          const formulaVal = `"${validValues.join(',')}"`;
          
          for (let rIdx = 4; rIdx <= 1000; rIdx++) {
            const cell = worksheet.getCell(rIdx, colIdx + 1);
            cell.dataValidation = {
              type: 'list',
              allowBlank: true,
              formulae: [formulaVal]
            };
          }
        }
      }
    }

    // Auto-fit column widths
    worksheet.columns.forEach(column => {
      let maxLen = 15;
      column.eachCell({ includeEmpty: true }, (cell, rowIdx) => {
        if (rowIdx === 1) return;
        const val = cell.value ? String(cell.value) : '';
        if (val.length > maxLen) maxLen = val.length;
      });
      column.width = Math.min(maxLen + 4, 45);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${recordType}_Import_Template.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    logger.error('[TemplateExport] Error generating template:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. POST /api/import/validate
export const validateImportBatch = async (req, res) => {
  const { record_type, is_legacy, ps_id } = req.body;
  const isLegacy = is_legacy === 'true' || is_legacy === true;

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  if (ext !== '.xlsx') {
    try { fs.unlinkSync(req.file.path); } catch (_) {}
    return res.status(400).json({
      success: false,
      message: 'Invalid file format. Only modern Excel spreadsheets (.xlsx) are supported. Please convert your file to .xlsx and try again.'
    });
  }

  const recordType = record_type ? record_type.toUpperCase() : null;
  const validTypes = ['ARREST', 'PCR_CALL', 'CASE'];
  if (!recordType || !validTypes.includes(recordType)) {
    // Clean up uploaded file immediately if basic input is invalid
    try { fs.unlinkSync(req.file.path); } catch (_) {}
    return res.status(400).json({ success: false, message: 'Invalid or missing record_type. Must be CASE, ARREST or PCR_CALL.' });
  }

  if (req.user.role === 'HC' && isLegacy) {
    try { fs.unlinkSync(req.file.path); } catch (_) {}
    return res.status(403).json({ success: false, message: 'Operators (HC) cannot import legacy data' });
  }

  let finalPsId = null;
  let finalDistrictId = null;

  if (req.user.role === 'HC') {
    finalPsId = req.user.ps_id || req.user.station_id;
    finalDistrictId = req.user.district_id;
    if (ps_id && ps_id !== finalPsId) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(403).json({ success: false, message: 'Operators are restricted to importing for their assigned Station only' });
    }
  } else {
    finalPsId = ps_id || null;
    if (finalPsId) {
      const node = await db('hierarchy_nodes').where({ id: finalPsId }).first();
      if (node) {
        let currentNode = node;
        while (currentNode && currentNode.node_type !== 'DISTRICT') {
          if (!currentNode.parent_id) break;
          currentNode = await db('hierarchy_nodes').where({ id: currentNode.parent_id }).first();
        }
        if (currentNode && currentNode.node_type === 'DISTRICT') {
          finalDistrictId = currentNode.id;
        }
      }
    } else {
      if (req.user.role === 'DISTRICT_OFFICER') {
        finalDistrictId = req.user.district_id;
      }
    }
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const worksheet = workbook.worksheets[0] || workbook.getWorksheet(1);

    if (!worksheet) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(400).json({ success: false, message: 'Invalid template: first worksheet not found' });
    }

    const allFields = await db('field_registry').where('is_active', true);
    const registryFields = allFields.filter(f => {
      try {
        const types = typeof f.applicable_record_types === 'string'
          ? JSON.parse(f.applicable_record_types)
          : f.applicable_record_types;
        return Array.isArray(types) && types.map(t => t.toUpperCase()).includes(recordType);
      } catch (e) {
        return false;
      }
    });

    const registryFieldsMap = {};
    for (const f of registryFields) {
      registryFieldsMap[f.field_key] = f;
    }

    const { colMap, dataStartRow } = buildColumnMap(worksheet, recordType, registryFields);

    if (Object.keys(colMap).length === 0) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(400).json({ success: false, message: 'Invalid template or column headers could not be mapped.' });
    }

    const errors = [];
    let totalRows = 0;
    let validRowsCount = 0;
    let invalidRowsCount = 0;

    const rowsToProcess = [];
    worksheet.eachRow((row, rowIdx) => {
      if (rowIdx < dataStartRow) return;
      let isEmpty = true;
      row.eachCell({ includeEmpty: false }, () => {
        isEmpty = false;
      });
      if (isEmpty) return; // skip entirely empty rows

      totalRows++;
      rowsToProcess.push({ row, rowIdx });
    });

    for (const { row, rowIdx } of rowsToProcess) {
      let rowHasErrors = false;
      const rowData = {};

      for (const f of registryFields) {
        rowData[f.field_key] = null;
      }

      row.eachCell({ includeEmpty: true }, (cell, colIdx) => {
        const key = colMap[colIdx];
        if (key && (registryFieldsMap[key] || key === 'name_and_address_of_accused')) {
          let cellVal = cell.value;
          if (cellVal && typeof cellVal === 'object' && 'result' in cellVal) {
            cellVal = cellVal.result;
          }
          if (cellVal && typeof cellVal === 'object' && 'text' in cellVal) {
            cellVal = cellVal.text;
          }
          if (typeof cellVal === 'string') {
            cellVal = cellVal.trim();
          }
          if (cellVal instanceof Date) {
            const field = registryFieldsMap[key];
            if (field) {
              if (field.field_type === 'DATE') {
                cellVal = cellVal.toISOString().split('T')[0];
              } else if (field.field_type === 'TIME') {
                const hours = String(cellVal.getUTCHours()).padStart(2, '0');
                const minutes = String(cellVal.getUTCMinutes()).padStart(2, '0');
                cellVal = `${hours}:${minutes}`;
              }
            }
          }
          if (key === 'name_and_address_of_accused') {
            const splitVal = String(cellVal || '');
            let arrested_name = '';
            let arrested_address = '';
            const lines = splitVal.split('\n');
            if (lines.length > 1) {
              arrested_name = lines[0].trim();
              arrested_address = lines.slice(1).join('\n').trim();
            } else {
              const commas = splitVal.split(',');
              if (commas.length > 1) {
                arrested_name = commas[0].trim();
                arrested_address = commas.slice(1).join(',').trim();
              } else {
                arrested_name = splitVal.trim();
                arrested_address = '';
              }
            }
            rowData['arrested_name'] = arrested_name;
            rowData['arrested_address'] = arrested_address;
          } else {
            rowData[key] = cellVal;
          }
        }
      });

      for (const field of registryFields) {
        const key = field.field_key;
        const val = rowData[key];
        const isReq = isRequired(field);

        if (isReq && (val === null || val === undefined || val === '')) {
          errors.push({
            row: rowIdx,
            field_key: key,
            code: 'REQUIRED_MISSING',
            message: `${field.label_en} is required`
          });
          rowHasErrors = true;
          continue;
        }

        if (val === null || val === undefined || val === '') {
          continue;
        }

        if (field.field_type === 'DATE') {
          if (!isValidDate(val)) {
            errors.push({
              row: rowIdx,
              field_key: key,
              code: 'INVALID_TYPE',
              message: `Must be a valid date (YYYY-MM-DD)`
            });
            rowHasErrors = true;
            continue;
          }
        }

        if (field.field_type === 'TIME') {
          if (!isValidTime(val)) {
            errors.push({
              row: rowIdx,
              field_key: key,
              code: 'INVALID_TYPE',
              message: `Must be a valid time (HH:MM)`
            });
            rowHasErrors = true;
            continue;
          }
        }

        if (field.field_type === 'NUMBER' && field.field_key !== 'linked_fir_dd_no') {
          if (!isValidNumber(val)) {
            errors.push({
              row: rowIdx,
              field_key: key,
              code: 'INVALID_TYPE',
              message: `Must be a number`
            });
            rowHasErrors = true;
            continue;
          }
        }

        if (field.field_type === 'SELECT') {
          if (!isValidSelect(field, val)) {
            let options = [];
            try { options = typeof field.options === 'string' ? JSON.parse(field.options) : field.options; } catch(e){}
            const optList = options.map(o => (o && typeof o === 'object') ? o.value : o).join(', ');
            errors.push({
              row: rowIdx,
              field_key: key,
              code: 'INVALID_VALUE',
              message: `'${val}' is not valid. Valid options: ${optList}`
            });
            rowHasErrors = true;
            continue;
          }
        }

        if (!checkMaxLength(field, val)) {
          errors.push({
            row: rowIdx,
            field_key: key,
            code: 'TOO_LONG',
            message: `Must be ${JSON.parse(field.validation_rules).maxLength} characters or less`
          });
          rowHasErrors = true;
          continue;
        }

        if (!checkRegex(field, val)) {
          errors.push({
            row: rowIdx,
            field_key: key,
            code: 'INVALID_FORMAT',
            message: `Value format is invalid`
          });
          rowHasErrors = true;
          continue;
        }
      }

      if (rowHasErrors) {
        invalidRowsCount++;
      } else {
        validRowsCount++;
      }
    }

    const batchId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);

    const userId = req.user.id || req.user.userId;

    await db('import_batches').insert({
      id: batchId,
      record_type: recordType,
      is_legacy: isLegacy ? 1 : 0,
      uploaded_by: userId,
      ps_id: finalPsId,
      district_id: finalDistrictId,
      file_path: req.file.path,
      total_rows: totalRows,
      valid_rows: validRowsCount,
      invalid_rows: invalidRowsCount,
      status: 'VALIDATION_DONE',
      created_at: new Date().toISOString()
    });

    if (errors.length > 0) {
      const errorPayloads = errors.map(err => ({
        id: uuidv4(),
        batch_id: batchId,
        row_number: err.row,
        field_key: err.field_key,
        error_code: err.code,
        error_message: err.message
      }));
      
      for (let i = 0; i < errorPayloads.length; i += 100) {
        await db('import_batch_errors').insert(errorPayloads.slice(i, i + 100));
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        batch_id: batchId,
        total_rows: totalRows,
        valid_rows: validRowsCount,
        invalid_rows: invalidRowsCount,
        expires_at: expiresAt.toISOString(),
        errors: errors
      }
    });
  } catch (error) {
    logger.error('[ValidateImport] Parsing/processing file error:', error.message);
    try { fs.unlinkSync(req.file.path); } catch (_) {}
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. POST /api/import/confirm/:batchId
export const confirmImportBatch = async (req, res) => {
  const { batchId } = req.params;

  try {
    const batch = await db('import_batches').where({ id: batchId }).first();
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    if (batch.status === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Batch has already been confirmed and imported' });
    }

    if (batch.status !== 'VALIDATION_DONE') {
      return res.status(400).json({ success: false, message: 'Batch is not ready for confirmation (status must be VALIDATION_DONE)' });
    }

    const userId = req.user.id || req.user.userId;
    if (batch.uploaded_by !== userId) {
      return res.status(403).json({ success: false, message: 'Only the user who uploaded the batch can confirm it' });
    }

    if (!fs.existsSync(batch.file_path)) {
      return res.status(410).json({ success: false, message: 'Physical temp file has expired or was removed' });
    }

    const errorRows = await db('import_batch_errors')
      .where({ batch_id: batchId })
      .pluck('row_number');
    const errorRowsSet = new Set(errorRows);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(batch.file_path);
    const worksheet = workbook.worksheets[0] || workbook.getWorksheet(1);

    const allFields = await db('field_registry').where('is_active', true);
    const registryFields = allFields.filter(f => {
      try {
        const types = typeof f.applicable_record_types === 'string'
          ? JSON.parse(f.applicable_record_types)
          : f.applicable_record_types;
        return Array.isArray(types) && types.map(t => t.toUpperCase()).includes(batch.record_type);
      } catch (e) {
        return false;
      }
    });
    const registryFieldsMap = {};
    for (const f of registryFields) {
      registryFieldsMap[f.field_key] = f;
    }

    const { colMap, dataStartRow } = buildColumnMap(worksheet, batch.record_type, registryFields);

    const rowsToInsert = [];
    worksheet.eachRow((row, rowIdx) => {
      if (rowIdx < dataStartRow) return;
      if (errorRowsSet.has(rowIdx)) return;

      let isEmpty = true;
      row.eachCell({ includeEmpty: false }, () => {
        isEmpty = false;
      });
      if (isEmpty) return;

      const rowData = {};
      for (const key of Object.keys(registryFieldsMap)) {
        rowData[key] = null;
      }

      row.eachCell({ includeEmpty: true }, (cell, colIdx) => {
        const key = colMap[colIdx];
        if (key && (registryFieldsMap[key] || key === 'name_and_address_of_accused')) {
          let cellVal = cell.value;
          if (cellVal && typeof cellVal === 'object' && 'result' in cellVal) {
            cellVal = cellVal.result;
          }
          if (cellVal && typeof cellVal === 'object' && 'text' in cellVal) {
            cellVal = cellVal.text;
          }
          if (typeof cellVal === 'string') {
            cellVal = cellVal.trim();
          }
          if (cellVal instanceof Date) {
            const field = registryFieldsMap[key];
            if (field) {
              if (field.field_type === 'DATE') {
                cellVal = cellVal.toISOString().split('T')[0];
              } else if (field.field_type === 'TIME') {
                const hours = String(cellVal.getUTCHours()).padStart(2, '0');
                const minutes = String(cellVal.getUTCMinutes()).padStart(2, '0');
                cellVal = `${hours}:${minutes}`;
              }
            }
          }
          if (key === 'name_and_address_of_accused') {
            const splitVal = String(cellVal || '');
            let arrested_name = '';
            let arrested_address = '';
            const lines = splitVal.split('\n');
            if (lines.length > 1) {
              arrested_name = lines[0].trim();
              arrested_address = lines.slice(1).join('\n').trim();
            } else {
              const commas = splitVal.split(',');
              if (commas.length > 1) {
                arrested_name = commas[0].trim();
                arrested_address = commas.slice(1).join(',').trim();
              } else {
                arrested_name = splitVal.trim();
                arrested_address = '';
              }
            }
            rowData['arrested_name'] = arrested_name;
            rowData['arrested_address'] = arrested_address;
          } else {
            rowData[key] = cellVal;
          }
        }
      });
      rowsToInsert.push(rowData);
    });

    let sub_div_id = null;
    if (batch.ps_id) {
      const psNode = await db('hierarchy_nodes').where({ id: batch.ps_id }).first();
      if (psNode && psNode.parent_id) {
        const parentNode = await db('hierarchy_nodes').where({ id: psNode.parent_id }).first();
        if (parentNode && parentNode.node_type === 'SUB_DIVISION') {
          sub_div_id = parentNode.id;
        }
      }
    }

    let importedRowsCount = 0;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const newlyInsertedRecords = [];

      for (let i = 0; i < rowsToInsert.length; i += 100) {
        const chunk = rowsToInsert.slice(i, i + 100);
        await db.transaction(async (trx) => {
          for (const rowData of chunk) {
            let recordDate = getRecordDate(batch.record_type, rowData) || new Date().toISOString().split('T')[0];
            if (recordDate instanceof Date) {
              recordDate = recordDate.toISOString().split('T')[0];
            } else if (typeof recordDate === 'string' && recordDate.includes('T')) {
              recordDate = recordDate.split('T')[0];
            }

            const recordId = uuidv4();
            const uid = await generateUID(batch.record_type, batch.ps_id, recordDate, trx);
            const finalData = { ...rowData, uid };
            delete finalData.name_and_address_of_accused;

            const status = batch.is_legacy ? 'LEGACY_IMPORTED' : 'DRAFT';
            const level = batch.is_legacy ? 'HQ' : 'PS';

            await trx('records').insert({
              id: recordId,
              record_type: batch.record_type,
              ps_id: batch.ps_id,
              district_id: batch.district_id,
              sub_div_id: sub_div_id,
              data: JSON.stringify(finalData),
              current_status: status,
              current_level: level,
              record_date: recordDate,
              created_by: batch.uploaded_by,
              updated_by: batch.uploaded_by,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

            const fieldChanges = Object.keys(finalData).map(key => ({
              field_key: key,
              old_value: '',
              new_value: finalData[key] ?? ''
            }));

            const revisionId = uuidv4();
            const revisionPayload = {
              id: revisionId,
              record_id: recordId,
              revision_number: 1,
              changed_by: batch.uploaded_by,
              changed_at: new Date().toISOString(),
              level: level,
              change_type: 'CREATE',
              field_changes: JSON.stringify(fieldChanges),
              ip_address: ipAddress
            };

            const prev_hash = null;
            const row_hash = computeRowHash({
              record_id: recordId,
              revision_number: 1,
              changed_by: batch.uploaded_by,
              changed_at: revisionPayload.changed_at,
              field_changes: revisionPayload.field_changes
            }, prev_hash);

            revisionPayload.prev_hash = prev_hash;
            revisionPayload.row_hash = row_hash;

            await trx('record_revisions').insert(revisionPayload);

            await trx('audit_logs').insert({
              id: uuidv4(),
              table_name: 'records',
              record_id: recordId,
              action: 'CREATE',
              changed_by_id: batch.uploaded_by,
              changed_by_role: req.user.role,
              changed_at: new Date().toISOString(),
              new_value: JSON.stringify(finalData),
              ip_address: ipAddress
            });

            newlyInsertedRecords.push({ id: recordId, data: finalData });
            importedRowsCount++;
          }
        });
      }

      // Auto-Linkage runner after all insertions are committed
      let autoLinkageResult = {
        linkedCount: 0,
        unmatchedCount: 0,
        linkedDetails: [],
        unmatchedDetails: []
      };

      await db.transaction(async (trx) => {
        let arrestsToLink = [];
        if (batch.record_type === 'ARREST') {
          arrestsToLink = newlyInsertedRecords;
        } else if (batch.record_type === 'CASE') {
          const unmatchedArrests = await trx('records')
            .where({ record_type: 'ARREST', ps_id: batch.ps_id })
            .whereNotExists(function() {
              this.select('*').from('record_links')
                .whereRaw('record_links.target_record_id = records.id');
            })
            .select('id', 'data');
          
          arrestsToLink = unmatchedArrests.map(a => ({
            id: a.id,
            data: typeof a.data === 'string' ? JSON.parse(a.data) : a.data
          }));
        }

        autoLinkageResult = await runAutoLinkageForArrests(trx, arrestsToLink, batch.ps_id, batch.uploaded_by);
      });

    // Clean up temp file
    try {
      if (fs.existsSync(batch.file_path)) {
        fs.unlinkSync(batch.file_path);
      }
    } catch (e) {
      logger.warn('[ConfirmImport] Temp file deletion failed:', e.message);
    }

    await db('import_batches')
      .where({ id: batchId })
      .update({
        status: 'COMPLETED',
        imported_rows: importedRowsCount,
        confirmed_at: new Date().toISOString()
      });

    await publish('record.batch_imported', {
      batch_id: batchId,
      count: importedRowsCount,
      is_legacy: !!batch.is_legacy,
      record_type: batch.record_type
    });

    const failedRows = await db('import_batch_errors')
      .where({ batch_id: batchId })
      .orderBy('row_number', 'asc');
    
    const failedDetails = failedRows.map(e => ({
      row: e.row_number,
      field_key: e.field_key,
      code: e.error_code,
      message: e.error_message
    }));

    const report = {
      total_processed: batch.total_rows,
      imported_count: importedRowsCount,
      linked_count: autoLinkageResult.linkedCount,
      unmatched_arrests_count: autoLinkageResult.unmatchedCount,
      failed_count: batch.invalid_rows,
      linked_details: autoLinkageResult.linkedDetails,
      unmatched_arrest_details: autoLinkageResult.unmatchedDetails,
      failed_details: failedDetails
    };

    return res.status(200).json({
      success: true,
      data: {
        batch_id: batchId,
        imported_rows: importedRowsCount,
        skipped_rows: batch.invalid_rows,
        status: 'COMPLETED',
        linked_count: autoLinkageResult.linkedCount,
        unmatched_arrests_count: autoLinkageResult.unmatchedCount,
        report
      }
    });
  } catch (error) {
    logger.error('[ConfirmImport] Database transaction confirm error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. GET /api/import/batches
export const listBatches = async (req, res) => {
  const page = parseInt(req.query.page || 1, 10);
  const limit = parseInt(req.query.limit || 20, 10);
  const offset = (page - 1) * limit;

  try {
    const userId = req.user.id || req.user.userId;
    const countRes = await db('import_batches').where({ uploaded_by: userId }).count('* as count').first();
    const total = parseInt(countRes.count || 0, 10);

    const list = await db('import_batches')
      .where({ uploaded_by: userId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const data = list.map(b => ({
      id: b.id,
      record_type: b.record_type,
      is_legacy: !!b.is_legacy,
      total_rows: b.total_rows,
      valid_rows: b.valid_rows,
      invalid_rows: b.invalid_rows,
      status: b.status,
      created_at: b.created_at
    }));

    return res.status(200).json({
      success: true,
      data,
      meta: { page, limit, total }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. GET /api/import/batches/:batchId
export const getBatchDetail = async (req, res) => {
  const { batchId } = req.params;

  try {
    const userId = req.user.id || req.user.userId;
    const batch = await db('import_batches')
      .where({ id: batchId, uploaded_by: userId })
      .first();

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const errors = await db('import_batch_errors')
      .where({ batch_id: batchId })
      .orderBy('row_number', 'asc');

    const formattedErrors = errors.map(e => ({
      row: e.row_number,
      field_key: e.field_key,
      code: e.error_code,
      message: e.error_message
    }));

    return res.status(200).json({
      success: true,
      data: {
        id: batch.id,
        record_type: batch.record_type,
        is_legacy: !!batch.is_legacy,
        total_rows: batch.total_rows,
        valid_rows: batch.valid_rows,
        invalid_rows: batch.invalid_rows,
        status: batch.status,
        created_at: batch.created_at,
        errors: formattedErrors
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
