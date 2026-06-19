import * as dailyDiaryService from './daily-diary.service.js';
import * as excelBuilder from './excel-builder.js';
import { logger } from '../../utils/logger.js';

/**
 * Endpoint to compile and export the Daily Diary Excel workbook.
 * GET /api/daily-diary/export
 */
export const exportDailyDiary = async (req, res, next) => {
  try {
    const { date, psId, districtId } = req.query;
    
    // Validate target date
    let targetDate = date;
    if (!targetDate) {
      targetDate = new Date().toISOString().split('T')[0];
    }
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(targetDate)) {
      return res.status(400).json({
        status: 'error',
        success: false,
        code: 'BAD_REQUEST',
        message: 'Invalid date format. Expected YYYY-MM-DD.'
      });
    }

    logger.info(`[DailyDiaryController] Initiating Daily Diary Excel export for date: ${targetDate} requested by user: ${req.user.username}`);

    const filters = { psId, districtId };
    
    // Fetch transaction records matching jurisdiction and date
    const records = await dailyDiaryService.getDailyDiaryData(targetDate, filters, req.user);
    
    // Map transaction records to sheet-based row objects
    const sheetsData = dailyDiaryService.mapRecordsToSheets(records, req.user);
    
    // Populate Excel workbook
    const workbook = await excelBuilder.buildDailyDiaryExcel(sheetsData);

    // Set headers and stream response
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Daily_Diary_${targetDate}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
    
    logger.info(`[DailyDiaryController] Daily Diary Excel export completed successfully for date: ${targetDate}`);
  } catch (error) {
    logger.error(`[DailyDiaryController] Daily Diary Excel export failed: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Endpoint to preview counts of records per sheet.
 * GET /api/daily-diary/records-preview
 */
export const getDailyDiaryPreview = async (req, res, next) => {
  try {
    const { date, psId, districtId } = req.query;
    
    let targetDate = date;
    if (!targetDate) {
      targetDate = new Date().toISOString().split('T')[0];
    }
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(targetDate)) {
      return res.status(400).json({
        status: 'error',
        success: false,
        code: 'BAD_REQUEST',
        message: 'Invalid date format. Expected YYYY-MM-DD.'
      });
    }

    const filters = { psId, districtId };
    const records = await dailyDiaryService.getDailyDiaryData(targetDate, filters, req.user);
    const sheetsData = dailyDiaryService.mapRecordsToSheets(records, req.user);

    // Construct preview count summary
    const previewSummary = {};
    Object.keys(sheetsData).forEach(sheetTableKey => {
      const sheetName = sheetTableKey.replace('excel_', '').replace(/_/g, ' ');
      previewSummary[sheetName] = {
        tableName: sheetTableKey,
        count: sheetsData[sheetTableKey].length
      };
    });

    return res.status(200).json({
      status: 'success',
      success: true,
      data: {
        date: targetDate,
        totalRecordsFetched: records.length,
        sheetsPreview: previewSummary
      }
    });
  } catch (error) {
    logger.error(`[DailyDiaryController] Daily Diary preview generation failed: ${error.message}`);
    next(error);
  }
};
