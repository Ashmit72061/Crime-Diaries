import ExcelJS from 'exceljs';
import path from 'path';

async function main() {
  const wbPath = path.resolve('../Daily dairy all tables NO MULTIVALUED.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(wbPath);
  
  const ws = workbook.getWorksheet('1.Manual FIR');
  console.log('1.Manual FIR rows count:', ws.rowCount);
  for (let r = 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const vals = [];
    for (let c = 1; c <= ws.columnCount; c++) {
      vals.push(row.getCell(c).value);
    }
    console.log(`Row ${r}:`, vals);
  }
}

main().catch(console.error);
