import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

// Since we cannot run seed.js directly without DB, we can read seed.js file content
// and extract the fields array, or simply write a script that imports it.
// Wait, we can import Knex seeds? Knex seed files export a seed function.
// Let's parse backend/seeds/seed.js to get the fields array.
// Alternatively, let's write a quick script that executes it by mocking the knex object!

const FILES = {
  CASE: 'Sample Case Reg..xlsx',
  ARREST: 'Sample master Arrest.xlsx',
  MISSING: 'Sample master missing.xlsx',
  UIDB: 'Sample master UIDB.xlsx'
};

async function getSeededFields() {
  const seedFileContent = fs.readFileSync(path.resolve('seeds/seed.js'), 'utf-8');
  // We can mock knex insert to capture fields.
  let capturedFields = [];
  const mockKnex = (tableName) => {
    return {
      del: () => {},
      insert: (data) => {
        if (tableName === 'field_registry') {
          capturedFields = data;
        }
      }
    };
  };
  mockKnex.fn = { now: () => new Date() };

  // Run the seed function from seeds/seed.js
  const { seed } = await import('../seeds/seed.js');
  await seed(mockKnex);
  return capturedFields;
}

function cleanHeader(val) {
  if (!val) return '';
  return String(val).trim().replace(/\s+/g, ' ');
}

async function runAudit() {
  const fields = await getSeededFields();
  
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
      registeredFields: registry[type]
    };
  }

  // Generate a clean markdown gap report
  let output = `# Field Coverage Audit Report\n\n`;
  output += `This report compares columns in the four master spreadsheets under the \`Master/\` directory with the fields defined in the database seed (\`seeds/seed.js\`).\n\n`;

  for (const [type, data] of Object.entries(report)) {
    output += `## Record Type: ${type} (File: ${data.file})\n`;
    output += `- Total Excel Columns: ${data.totalColumns}\n`;
    output += `- Total Registered Fields in DB Seed: ${Object.keys(data.registeredFields).length}\n\n`;
    
    output += `### Column Gaps & Mappings\n\n`;
    output += `| Excel Column Index | Excel Column Name | Mapped DB Field Key | Status / Action | Detail / Match |\n`;
    output += `| --- | --- | --- | --- | --- |\n`;
    
    data.columns.forEach(col => {
      // Find matching field by key or label
      let matchedKey = null;
      let matchedField = null;
      
      // Let's do simple matching heuristic
      for (const [key, f] of Object.entries(data.registeredFields)) {
        const keyMatch = col.fullName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(col.fullName.toLowerCase());
        const labelMatch = col.fullName.toLowerCase().includes(f.label_en.toLowerCase()) || f.label_en.toLowerCase().includes(col.fullName.toLowerCase());
        if (keyMatch || labelMatch) {
          matchedKey = key;
          matchedField = f;
          break;
        }
      }
      
      let status = '';
      let matchDetail = '';
      if (matchedField) {
        status = 'MATCHED';
        matchDetail = `Maps to \`${matchedKey}\` (label: "${matchedField.label_en}")`;
      } else {
        status = 'GAP';
        matchDetail = 'No matching field found in seed';
      }
      
      output += `| ${col.colIdx} | ${col.fullName} | \`${matchedKey || 'N/A'}\` | **${status}** | ${matchDetail} |\n`;
    });
    
    output += `\n### Unmapped DB Fields\n`;
    output += `Fields present in DB seed but not mapped to any column in the Excel:\n`;
    let unmappedCount = 0;
    for (const [key, f] of Object.entries(data.registeredFields)) {
      const isMapped = data.columns.some(col => {
        const keyMatch = col.fullName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(col.fullName.toLowerCase());
        const labelMatch = col.fullName.toLowerCase().includes(f.label_en.toLowerCase()) || f.label_en.toLowerCase().includes(col.fullName.toLowerCase());
        return keyMatch || labelMatch;
      });
      if (!isMapped) {
        output += `- \`${key}\` (${f.field_type}): "${f.label_en}"\n`;
        unmappedCount++;
      }
    }
    if (unmappedCount === 0) {
      output += `- None\n`;
    }
    
    output += `\n--------------------------------------------------\n\n`;
  }
  
  fs.writeFileSync(path.resolve('scratch/gap_report.md'), output, 'utf-8');
  console.log('Gap report successfully written to scratch/gap_report.md');
  process.exit(0);
}

runAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
