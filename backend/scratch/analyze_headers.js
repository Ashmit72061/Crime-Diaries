import ExcelJS from 'exceljs';
import path from 'path';

async function main() {
  const wbPath = path.resolve('../Daily dairy all tables NO MULTIVALUED.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(wbPath);
  
  workbook.worksheets.forEach((ws, i) => {
    if (i >= 34) return; // skip Sheet1
    // We want to detect how many header rows.
    // Usually:
    // Row 1 is a merged title cell.
    // Row 2 is the first header row.
    // Row 3: Is it part of the header? Let's check if the first cell (col 1) is 'S. NO.' or 'SR. NO.' or similar.
    // If Row 3 contains subheaders, Row 4 starts the data.
    // Let's print rows 2, 3, and 4 cell values to see the pattern.
    const r2 = ws.getRow(2).values;
    const r3 = ws.getRow(3).values;
    const r4 = ws.getRow(4).values;
    
    // Let's see if row 3 first column is 'S. NO.', 'SR. NO.', etc.
    console.log(`Sheet ${i+1} (${ws.name}):`);
    console.log(`  Row 2:`, r2.slice(1, 6));
    console.log(`  Row 3:`, r3.slice(1, 6));
    console.log(`  Row 4:`, r4.slice(1, 6));
  });
}

main().catch(console.error);
