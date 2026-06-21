import ExcelJS from 'exceljs';
import path from 'path';

async function main() {
  const wbPath = path.resolve('../Daily dairy all tables NO MULTIVALUED.xlsx');
  console.log('Loading workbook from:', wbPath);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(wbPath);
  console.log('Number of sheets:', workbook.worksheets.length);
  workbook.worksheets.forEach((ws, i) => {
    console.log(`Sheet ${i + 1}: Name="${ws.name}"`);
    // Let's print first 3 rows
    for (let r = 1; r <= 5; r++) {
      const row = ws.getRow(r);
      const values = [];
      row.eachCell((cell) => {
        values.push(cell.value);
      });
      if (values.length > 0) {
        console.log(`  Row ${r}:`, values.slice(0, 10).map(v => typeof v === 'object' ? JSON.stringify(v) : v));
      }
    }
  });
}

main().catch(console.error);
