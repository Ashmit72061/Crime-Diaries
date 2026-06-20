import ExcelJS from 'exceljs';
import path from 'path';

async function main() {
  const wbPath = path.resolve('../Daily dairy all tables NO MULTIVALUED.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(wbPath);
  
  workbook.worksheets.forEach((ws, i) => {
    if (i >= 34) return; // skip Sheet1
    console.log(`\n===================`);
    console.log(`Sheet ${i + 1}: "${ws.name}"`);
    for (let r = 1; r <= Math.min(ws.rowCount, 4); r++) {
      const row = ws.getRow(r);
      const vals = [];
      for (let c = 1; c <= ws.columnCount; c++) {
        const val = row.getCell(c).value;
        vals.push(val === null ? 'null' : typeof val === 'object' ? JSON.stringify(val) : val);
      }
      console.log(`  Row ${r}:`, vals.slice(0, 15));
    }
  });
}

main().catch(console.error);
