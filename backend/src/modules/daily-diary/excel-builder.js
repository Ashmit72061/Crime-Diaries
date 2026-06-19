import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const TEMPLATE_PATH = path.resolve(__dirname, 'templates', 'Daily dairy all tables NO MULTIVALUED (1).xlsx');
const MAPPING_PATH = path.resolve(__dirname, '../../../scratch', 'schema_mapping.json');

/**
 * Loads the Excel template and populates the worksheets with mapped data.
 * @param {Object} sheetsData - An object of tableName -> array of row objects
 * @returns {ExcelJS.Workbook} - The populated workbook
 */
export const buildDailyDiaryExcel = async (sheetsData) => {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(`Excel template file not found at: ${TEMPLATE_PATH}`);
  }
  
  if (!fs.existsSync(MAPPING_PATH)) {
    throw new Error(`Schema mapping file not found at: ${MAPPING_PATH}`);
  }

  const mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf8'));
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(TEMPLATE_PATH);

  // Map each sheet defined in the schema mapping
  for (const sheetConf of mapping) {
    const { sheetName, tableName, columns, headerRowIndex } = sheetConf;
    const worksheet = workbook.getWorksheet(sheetName);
    
    if (!worksheet) {
      console.warn(`[ExcelBuilder] Worksheet "${sheetName}" not found in template.`);
      continue;
    }

    const dataRows = sheetsData[tableName] || [];
    let currentRowNum = headerRowIndex + 1;

    // Clear any existing template values below the headers
    const rowCount = worksheet.rowCount;
    if (rowCount > headerRowIndex) {
      for (let r = currentRowNum; r <= rowCount; r++) {
        const row = worksheet.getRow(r);
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.value = null;
        });
      }
    }

    // Populate data
    for (const rowData of dataRows) {
      const rowValues = [];
      
      // Map columns in the exact order they exist in schema_mapping.json
      for (const colName of columns) {
        let val = rowData[colName];
        
        // Handle dates, nulls or undefined values
        if (val === undefined || val === null) {
          val = '';
        } else if (val instanceof Date) {
          val = val.toISOString().split('T')[0];
        } else if (typeof val === 'boolean') {
          val = val ? 'YES' : 'NO';
        }
        
        rowValues.push(val);
      }

      const row = worksheet.getRow(currentRowNum);
      
      // Write cells to the row to preserve cell borders and fonts
      rowValues.forEach((val, idx) => {
        const cell = row.getCell(idx + 1);
        cell.value = val;
        
        // Inherit layout styling from the header cell if blank (except header fill/font weight)
        const headerCell = worksheet.getRow(headerRowIndex).getCell(idx + 1);
        if (headerCell && headerCell.border) {
          cell.border = headerCell.border;
        }
        if (headerCell && headerCell.alignment) {
          cell.alignment = headerCell.alignment;
        }
      });
      
      row.commit();
      currentRowNum++;
    }
  }

  return workbook;
};
