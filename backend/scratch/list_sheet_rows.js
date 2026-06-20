import ExcelJS from 'exceljs';
import path from 'path';

async function main() {
  const wbPath = path.resolve('../Daily dairy all tables NO MULTIVALUED.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(wbPath);
  
  workbook.worksheets.forEach((ws, i) => {
    console.log(`Sheet ${i + 1}: Name="${ws.name}" count=${ws.rowCount}`);
  });
}

main().catch(console.error);
