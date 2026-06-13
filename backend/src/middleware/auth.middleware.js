import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/generateToken.js';

/**
 * Protect routes — verifies the access_token cookie (or Authorization header).
 */
export const protect = (req, res, next) => {
  try {
    const token =
      req.cookies?.access_token ||
      req.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (!token) throw new ApiError(401, 'Authentication required');

    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Token expired'));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Invalid token'));
    }
    next(err);
  }
};

/**
 * Role-based access control — call after `protect`.
 * Usage: router.delete('/:id', protect, authorize('admin', 'superadmin'), handler)
 */
export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return next(new ApiError(403, 'You do not have permission to perform this action'));
  }
  next();
};
