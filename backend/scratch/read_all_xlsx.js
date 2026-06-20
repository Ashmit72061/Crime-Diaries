import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

const files = [
  'Sample Case Reg..xlsx',
  'Sample master Arrest.xlsx',
  'Sample master UIDB.xlsx',
  'Sample master missing.xlsx'
];

const baseDir = 'c:/Users/raja2/Crime-Diaries';

async function run() {
  for (const file of files) {
    const filePath = path.join(baseDir, file);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      continue;
    }
    
    console.log(`\n=========================================`);
    console.log(`FILE: ${file}`);
    console.log(`=========================================`);
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    for (const sheet of workbook.worksheets) {
      console.log(`\n--- Sheet: ${sheet.name} ---`);
      
      const rows = [];
      sheet.eachRow((row, rowNumber) => {
        rows.push({ number: rowNumber, values: row.values });
      });
      
      console.log(`Total Rows: ${rows.length}`);
      
      for (let r = 0; r < Math.min(5, rows.length); r++) {
        console.log(`Row ${rows[r].number}:`, JSON.stringify(rows[r].values));
      }
    }
  }
}

run().catch(console.error);
