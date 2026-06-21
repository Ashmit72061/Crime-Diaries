import ExcelJS from 'exceljs';
import path from 'path';
import db from '../src/config/db.js';

// We want to map Excel column headers to field keys or descriptions
// Let's load the spreadsheets and the field registry and compare them.

const FILES = {
  CASE: 'Sample Case Reg..xlsx',
  ARREST: 'Sample master Arrest.xlsx',
  MISSING: 'Sample master missing.xlsx',
  UIDB: 'Sample master UIDB.xlsx'
};

async function getFieldRegistry() {
  const fields = await db('field_registry').select('*');
  // Group by record type
  const registry = {
    CASE: {},
    ARREST: {},
    MISSING: {},
    UIDB: {},
    PCR_CALL: {}
  };
  
  fields.forEach(f => {
    let types = [];
    try {
      types = JSON.parse(f.applicable_record_types);
    } catch (e) {
      types = [f.applicable_record_types];
    }
    
    types.forEach(t => {
      if (registry[t]) {
        registry[t][f.field_key] = f;
      }
    });
  });
  return registry;
}

function cleanHeader(val) {
  if (!val) return '';
  return String(val).trim().replace(/\s+/g, ' ');
}

async function runAudit() {
  const registry = await getFieldRegistry();
  const report = {};

  for (const [type, fileName] of Object.entries(FILES)) {
    const filePath = path.resolve('../Master', fileName);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const ws = workbook.getWorksheet(1);
    
    const columns = [];
    const r1 = ws.getRow(1);
    const r2 = ws.getRow(2);
    
    for (let c = 1; c <= ws.columnCount; c++) {
      const h1 = r1.getCell(c).value;
      const h2 = r2.getCell(c).value;
      
      let label = cleanHeader(h1);
      let subLabel = cleanHeader(h2);
      
      let colName = label;
      if (subLabel && subLabel !== 'null') {
        colName = `${label} (${subLabel})`;
      }
      
      if (colName) {
        columns.push({
          colIdx: c,
          header: label,
          subHeader: subLabel,
          fullName: colName
        });
      }
    }
    
    report[type] = {
      file: fileName,
      totalColumns: columns.length,
      columns: columns,
      registeredFields: Object.keys(registry[type])
    };
  }

  // Let's print out the analysis
  console.log("# Field Coverage Audit Results\n");
  
  for (const [type, data] of Object.entries(report)) {
    console.log(`## Record Type: ${type} (File: ${data.file})`);
    console.log(`Total Excel Columns: ${data.totalColumns}`);
    console.log(`Total Registered Fields in DB: ${data.registeredFields.length}`);
    console.log(`\n### Excel Columns List:`);
    data.columns.forEach(col => {
      console.log(`- Column ${col.colIdx}: "${col.fullName}"`);
    });
    
    console.log(`\n### DB Fields List:`);
    data.registeredFields.forEach(k => {
      const f = registry[type][k];
      console.log(`- ${k} (${f.field_type}): "${f.label_en}"`);
    });
    
    console.log("\n--------------------------------------------------\n");
  }
  
  process.exit(0);
}

runAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
