import db from '../src/config/db.js';
import * as dailyDiaryService from '../src/modules/daily-diary/daily-diary.service.js';
import * as excelBuilder from '../src/modules/daily-diary/excel-builder.js';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('--- Daily Diary Excel Generation Verification ---');
  
  // Mock SYSTEM_ADMIN user context
  const mockUser = {
    id: 'U_SA001',
    username: 'system_admin',
    role: 'SYSTEM_ADMIN',
    name_en: 'System Admin'
  };

  // We have mock records around May 2026 as per our database check
  const targetDate = '2026-05-28';
  console.log(`Querying records for date: ${targetDate}...`);

  const records = await dailyDiaryService.getDailyDiaryData(targetDate, {}, mockUser);
  console.log(`Fetched ${records.length} records matching search scope.`);

  console.log('Distributing records into sheet datasets...');
  const sheetsData = dailyDiaryService.mapRecordsToSheets(records, mockUser);
  
  // Log count summaries of worksheets populated
  Object.keys(sheetsData).forEach(key => {
    const rowCount = sheetsData[key].length;
    if (rowCount > 0) {
      console.log(`- Sheet "${key}": ${rowCount} row(s) populated.`);
    }
  });

  console.log('Building Excel spreadsheet...');
  const workbook = await excelBuilder.buildDailyDiaryExcel(sheetsData);

  const outputDir = path.resolve('scratch');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `Daily_Diary_${targetDate}.xlsx`);
  await workbook.xlsx.writeFile(outputPath);
  
  console.log(`Excel report successfully written to: ${outputPath}`);
  console.log('--- Verification Complete ---');
  
  await db.destroy();
}

main().catch(async (err) => {
  console.error('Verification failed:', err);
  await db.destroy();
});
