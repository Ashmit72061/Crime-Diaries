<<<<<<< HEAD
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Authentication required: Bearer token is missing'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired authentication token'
    });
  }
};

export const requireAuth = () => authMiddleware;

=======
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
>>>>>>> 050d70686de07c389fe62cdcf8820253124b8856
