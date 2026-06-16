import * as compilationService from './compilation.service.js';

export const getCompilations = async (req, res, next) => {
  try {
    const districtId = req.query.districtId || req.user?.districtId;
    const { period, status } = req.query;
    
    const compilations = await compilationService.getCompilations(districtId, period, status);
    res.status(200).json({ status: 'success', data: compilations });
  } catch (error) {
    next(error);
  }
};

export const createCompilation = async (req, res, next) => {
  try {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
    const districtId = req.body.district_id || req.user?.districtId;
    const { period } = req.body;
    
    const compilation = await compilationService.createCompilation(districtId, period, userId);
    res.status(201).json({ status: 'success', data: compilation });
  } catch (error) {
    next(error);
  }
};

export const getCompilation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const compilation = await compilationService.getCompilation(id);
    if (!compilation) {
      return res.status(404).json({ status: 'error', message: 'Compilation not found' });
    }
    res.status(200).json({ status: 'success', data: compilation });
  } catch (error) {
    next(error);
  }
};

export const submitCompilation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
    
    const transition = await compilationService.submitCompilation(id, userId);
    res.status(200).json({ status: 'success', data: transition });
  } catch (error) {
    next(error);
  }
};
