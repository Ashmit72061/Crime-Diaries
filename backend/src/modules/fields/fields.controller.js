import * as fieldsService from './fields.service.js';
import { logger } from '../../utils/logger.js';

export const getFields = async (req, res, next) => {
  try {
    const { record_type, is_active } = req.query;
    const fields = await fieldsService.getFields(record_type, is_active);
    res.status(200).json({ status: 'success', data: fields });
  } catch (error) {
    next(error);
  }
};

export const getFormFields = async (req, res, next) => {
  try {
    const { record_type } = req.params;
    const formLayout = await fieldsService.getFormFields(record_type);
    res.status(200).json({ status: 'success', data: formLayout });
  } catch (error) {
    next(error);
  }
};

export const createField = async (req, res, next) => {
  try {
    const newField = await fieldsService.createField(req.body);
    res.status(201).json({ status: 'success', data: newField });
  } catch (error) {
    next(error);
  }
};

export const updateField = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedField = await fieldsService.updateField(id, req.body);
    res.status(200).json({ status: 'success', data: updatedField });
  } catch (error) {
    next(error);
  }
};

export const toggleFieldStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const updatedField = await fieldsService.toggleFieldStatus(id, is_active);
    res.status(200).json({ status: 'success', data: updatedField });
  } catch (error) {
    next(error);
  }
};
