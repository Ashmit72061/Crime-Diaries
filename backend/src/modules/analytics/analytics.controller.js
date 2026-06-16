import * as analyticsService from './analytics.service.js';

export const getOverview = async (req, res, next) => {
  try {
    const filters = {
      from: req.query.from,
      to: req.query.to,
      psId: req.query.psId || req.user?.psId,
      districtId: req.query.districtId || req.user?.districtId
    };
    const data = await analyticsService.getOverview(filters);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const getByCrimeHead = async (req, res, next) => {
  try {
    const filters = {
      psId: req.query.psId || req.user?.psId,
      districtId: req.query.districtId || req.user?.districtId
    };
    const data = await analyticsService.getByCrimeHead(filters);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const getByPS = async (req, res, next) => {
  try {
    const districtId = req.query.districtId || req.user?.districtId;
    const data = await analyticsService.getByPS(districtId, req.query);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const getTrends = async (req, res, next) => {
  try {
    const filters = {
      metric: req.query.metric,
      period: req.query.period,
      from: req.query.from,
      to: req.query.to,
      psId: req.query.psId || req.user?.psId,
      districtId: req.query.districtId || req.user?.districtId
    };
    const data = await analyticsService.getTrends(filters);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const getStatusBreakdown = async (req, res, next) => {
  try {
    const filters = {
      psId: req.query.psId || req.user?.psId,
      districtId: req.query.districtId || req.user?.districtId
    };
    const data = await analyticsService.getStatusBreakdown(filters);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};
