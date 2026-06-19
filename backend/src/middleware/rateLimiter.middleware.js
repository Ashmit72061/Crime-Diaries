import rateLimit from 'express-rate-limit';
import { ApiError } from '../utils/ApiError.js';

const makeHandler = (message) => (req, res, next) => {
  next(new ApiError(429, message));
};

/**
 * General API rate limiter — 100 requests per 15 minutes.
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeHandler('Too many requests, please try again later.'),
});

/**
 * Strict limiter for auth routes — 10 attempts per 15 minutes.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeHandler('Too many login attempts, please try again after 15 minutes.'),
});
