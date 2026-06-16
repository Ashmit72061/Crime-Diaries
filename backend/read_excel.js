import exceljs from 'exceljs';
import path from 'path';

async function run() {
  const wb = new exceljs.Workbook();
  const filePath = 'd:/DPI/FIR/master Sheet1.xlsx';
  await wb.xlsx.readFile(filePath);
  console.log('Sheets found:', wb.worksheets.map(w => w.name));
  
  wb.worksheets.forEach(ws => {
    console.log(`\nSheet: ${ws.name}`);
    for (let r = 1; r <= 40; r++) {
      const row = ws.getRow(r);
      const cells = [];
      for (let c = 1; c <= 30; c++) {
        const val = row.getCell(c).value;
        if (val !== null && val !== undefined && val !== '') {
          cells.push(`${c}: ${JSON.stringify(val)}`);
        }
      }
      if (cells.length > 0) {
        console.log(`Row ${r}:`, cells.join(' | '));
      }
    }
  });
}

run().catch(console.error);
