import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

/**
 * Global Express error handler.
 * Must be the LAST middleware registered in app.js.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  logger.error(`${err.statusCode || 500} — ${err.message}`, {
    method: req.method,
    url: req.originalUrl,
    stack: err.stack,
  });

  // Known operational error
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
      timestamp: err.timestamp,
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(422).json({
      success: false,
      statusCode: 422,
      message: 'Validation failed',
      errors,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      statusCode: 409,
      message: `${field} already exists`,
      errors: [],
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: `Invalid ${err.path}: ${err.value}`,
      errors: [],
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: 'Invalid or expired token',
      errors: [],
    });
  }

  // Fallback — 500 Internal Server Error
  return res.status(500).json({
    success: false,
    statusCode: 500,
    message: 'Internal server error',
    errors: [],
  });
};

/**
 * 404 Not Found handler — register AFTER all routes.
 */
export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    errors: [],
  });
};
