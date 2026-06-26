import * as dailyDiaryService from './daily-diary.service.js';
import db from '../../config/db.js';
import { logger } from '../../utils/logger.js';

// Helper to validate and default date
const getValidatedDate = (req) => {
  let dateStr = req.query.date;
  if (dateStr) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw {
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Invalid date format. Expected YYYY-MM-DD.'
      };
    }
  } else {
    // Today's date in local server time format YYYY-MM-DD
    const localDate = new Date();
    const offset = localDate.getTimezoneOffset();
    const localTime = new Date(localDate.getTime() - (offset * 60 * 1000));
    dateStr = localTime.toISOString().split('T')[0];
  }
  return dateStr;
};

// Helper to resolve scoping boundaries based on user and queries
const resolveScope = (user, query) => {
  const scope = {
    psId: null,
    districtId: null,
    subDivId: null
  };

  const role = user.role;
  
  if (role === 'HC' || role === 'SHO') {
    scope.psId = user.ps_id || null;
  } else if (role === 'DISTRICT_OFFICER') {
    scope.districtId = user.district_id || null;
    if (query.psId) {
      scope.psId = query.psId;
    }
  } else if (role === 'ACP') {
    scope.subDivId = user.sub_div_id || null;
    if (query.psId) {
      scope.psId = query.psId;
    }
  } else {
    // HQ_ANALYST, HQ_ADMIN, SYSTEM_ADMIN
    if (query.psId) scope.psId = query.psId;
    if (query.districtId) scope.districtId = query.districtId;
  }

  return scope;
};

export const getPreview = async (req, res, next) => {
  try {
    const date = getValidatedDate(req);
    const scope = resolveScope(req.user, req.query);

    const data = await dailyDiaryService.getDailyDiaryPreview(
      req.user,
      date,
      scope.psId,
      scope.districtId,
      scope.subDivId
    );

    return res.status(200).json({
      status: 'success',
      success: true,
      data
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        status: 'error',
        success: false,
        code: error.code,
        message: error.message
      });
    }
    next(error);
  }
};

export const exportExcel = async (req, res, next) => {
  try {
    const date = getValidatedDate(req);
    const scope = resolveScope(req.user, req.query);
    const tableNames = req.query.tableNames ? req.query.tableNames.split(',') : null;
    const dateTo = req.query.dateTo || null;

    const { jobId } = await dailyDiaryService.queueDailyDiaryExport(
      req.user,
      date,
      scope.psId,
      scope.districtId,
      scope.subDivId,
      tableNames,
      dateTo
    );

    // Process in Node.js immediately — no Python/RabbitMQ required.
    setImmediate(async () => {
      try {
        const job = await db('report_jobs').where({ id: jobId }).first();
        if (!job) return;
        const def = JSON.parse(job.custom_definition || '{}');
        await dailyDiaryService.buildDailyDiaryExcel(
          def.sheets,
          def.reports,
          def.report_columns,
          job.file_path,
          def.column_labels  // undefined falls back to module-level COLUMN_LABELS
        );
        await db('report_jobs').where({ id: jobId }).update({
          status: 'READY',
          updated_at: new Date().toISOString(),
        });
        logger.info(`[DailyDiary] Job ${jobId} completed — file written to ${job.file_path}`);
      } catch (err) {
        logger.error(`[DailyDiary] Job ${jobId} failed: ${err.message}`);
        await db('report_jobs').where({ id: jobId }).update({
          status: 'FAILED',
          updated_at: new Date().toISOString(),
        }).catch(() => {});
      }
    });

    return res.status(202).json({
      status: 'accepted',
      success: true,
      data: {
        job_id: jobId,
        status_url: `/api/reports/status/${jobId}`,
        message: 'Daily diary export queued. Poll status_url to check progress.',
      }
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        status: 'error',
        success: false,
        code: error.code,
        message: error.message
      });
    }
    next(error);
  }
};

export const getDataAll = async (req, res, next) => {
  try {
    const date = getValidatedDate(req);
    const scope = resolveScope(req.user, req.query);

    const data = await dailyDiaryService.getDailyDiaryData(
      req.user,
      date,
      scope.psId,
      scope.districtId,
      scope.subDivId
    );

    return res.status(200).json({
      status: 'success',
      success: true,
      data
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        status: 'error',
        success: false,
        code: error.code,
        message: error.message
      });
    }
    next(error);
  }
};

export const getDataByTable = async (req, res, next) => {
  try {
    const date = getValidatedDate(req);
    const scope = resolveScope(req.user, req.query);
    const { tableName } = req.params;

    const data = await dailyDiaryService.getDailyDiaryData(
      req.user,
      date,
      scope.psId,
      scope.districtId,
      scope.subDivId,
      tableName
    );

    return res.status(200).json({
      status: 'success',
      success: true,
      data: data[tableName] || []
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        status: 'error',
        success: false,
        code: error.code,
        message: error.message
      });
    }
    next(error);
  }
};
