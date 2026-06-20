import ExcelJS from 'exceljs';
import path from 'path';

const masterFiles = [
  'Sample Case Reg..xlsx',
  'Sample master Arrest.xlsx',
  'Sample master missing.xlsx',
  'Sample master UIDB.xlsx'
];

async function inspect(fileName) {
  const filePath = path.resolve('../Master', fileName);
  console.log(`\n===================`);
  console.log(`File: ${fileName}`);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  
  const ws = workbook.getWorksheet(1);
  console.log(`Sheet Name: "${ws.name}", Row Count: ${ws.rowCount}, Column Count: ${ws.columnCount}`);
  
  // Print the first 5 rows to see what is in them
  for (let r = 1; r <= Math.min(ws.rowCount, 6); r++) {
    const row = ws.getRow(r);
    const cellValues = [];
    for (let c = 1; c <= ws.columnCount; c++) {
      const val = row.getCell(c).value;
      cellValues.push(val === null ? 'null' : typeof val === 'object' ? JSON.stringify(val) : val);
    }
    console.log(`  Row ${r}:`, cellValues);
  }
}

async function main() {
  for (const file of masterFiles) {
    try {
      await inspect(file);
    } catch (err) {
      console.error(`Error inspecting ${file}:`, err.message);
    }
  }
}

main();
