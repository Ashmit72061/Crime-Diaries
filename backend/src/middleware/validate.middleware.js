import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

/**
 * Run after express-validator check() chains.
 * Collects errors and forwards them as a 422 ApiError.
 *
 * Usage:
 *   router.post('/register', [...validators], validate, authController.register);
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return next(new ApiError(422, 'Validation failed', messages));
  }
  next();
};
