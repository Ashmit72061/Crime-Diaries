import db from '../../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import ExcelJS from 'exceljs';
import { publish } from '../../events/eventBus.js';
import { computeRowHash } from '../../utils/hash.js';
import { logger } from '../../utils/logger.js';

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
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(400).json({ success: false, message: 'Invalid template: first worksheet not found' });
    }

    const colMap = {};
    worksheet.getRow(1).eachCell((cell, colIdx) => {
      if (cell.value) colMap[colIdx] = String(cell.value).trim();
    });

    if (Object.keys(colMap).length === 0) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(400).json({ success: false, message: 'Invalid template: row 1 field metadata missing' });
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

    const errors = [];
    let totalRows = 0;
    let validRowsCount = 0;
    let invalidRowsCount = 0;

    const rowsToProcess = [];
    worksheet.eachRow((row, rowIdx) => {
      if (rowIdx < 4) return;
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
        if (key && registryFieldsMap[key]) {
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
            if (field.field_type === 'DATE') {
              cellVal = cellVal.toISOString().split('T')[0];
            } else if (field.field_type === 'TIME') {
              const hours = String(cellVal.getUTCHours()).padStart(2, '0');
              const minutes = String(cellVal.getUTCMinutes()).padStart(2, '0');
              cellVal = `${hours}:${minutes}`;
            }
          }
          rowData[key] = cellVal;
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

        if (field.field_type === 'NUMBER') {
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
    const worksheet = workbook.getWorksheet(1);

    const colMap = {};
    worksheet.getRow(1).eachCell((cell, colIdx) => {
      if (cell.value) colMap[colIdx] = String(cell.value).trim();
    });

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

    const rowsToInsert = [];
    worksheet.eachRow((row, rowIdx) => {
      if (rowIdx < 4) return;
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
        if (key && registryFieldsMap[key]) {
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
            if (field.field_type === 'DATE') {
              cellVal = cellVal.toISOString().split('T')[0];
            } else if (field.field_type === 'TIME') {
              const hours = String(cellVal.getUTCHours()).padStart(2, '0');
              const minutes = String(cellVal.getUTCMinutes()).padStart(2, '0');
              cellVal = `${hours}:${minutes}`;
            }
          }
          rowData[key] = cellVal;
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
          const uid = await generateImportUID(trx, batch.record_type, batch.ps_id, recordDate);
          const finalData = { ...rowData, uid };
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

          importedRowsCount++;
        }
      });
    }

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

    return res.status(200).json({
      success: true,
      data: {
        batch_id: batchId,
        imported_rows: importedRowsCount,
        skipped_rows: batch.invalid_rows,
        status: 'COMPLETED'
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
