import * as dailyDiaryService from './daily-diary.service.js';

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
    const { fromDate, toDate } = req.query;
    const scope = resolveScope(req.user, req.query);
    const tableNames = req.query.tableNames ? req.query.tableNames.split(',') : null;

    const { buffer, filename } = await dailyDiaryService.exportDailyDiaryExcel(
      req.user,
      date,
      scope.psId,
      scope.districtId,
      scope.subDivId,
      tableNames,
      fromDate,
      toDate
    );

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    return res.end(buffer);
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
