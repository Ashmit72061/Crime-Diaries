import jwt from 'jsonwebtoken';
import { getDB } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized: No token provided');
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const db = await getDB();
    const user = await db.get(
      `SELECT id, username, email, role, district_id as district, sub_division_id as subDivision, station_id as policeStation, is_active as isActive 
       FROM users WHERE id = ?`,
      [decoded.id]
    );

    if (!user) {
      throw new ApiError(401, 'Not authorized: User no longer exists');
    }

    if (!user.isActive) {
      throw new ApiError(401, 'Not authorized: Account has been deactivated');
    }

    req.user = user;
    next();
  } catch (err) {
    throw new ApiError(401, 'Not authorized: Invalid or expired token');
  }
});
