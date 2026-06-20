import ExcelJS from 'exceljs';
import path from 'path';

async function main() {
  const filePath = path.resolve('../docs/master Sheet.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const ws = workbook.getWorksheet(1);
  console.log(`Sheet Name: "${ws.name}", Row Count: ${ws.rowCount}, Column Count: ${ws.columnCount}`);
  for (let r = 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const vals = [];
    for (let c = 1; c <= ws.columnCount; c++) {
      vals.push(row.getCell(c).value || '');
    }
    console.log(`Row ${r}:`, vals);
  }
}

main().catch(console.error);
