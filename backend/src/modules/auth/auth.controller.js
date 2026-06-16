import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config/db.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setTokenCookies,
  clearTokenCookies,
} from '../../utils/generateToken.js';
import { logger } from '../../utils/logger.js';

/**
 * POST /api/auth/register
 * Creates a new user account.
 */
export const register = asyncHandler(async (req, res) => {
  const { badge_no, name_en, name_hi, role, ps_id, district_id, password, email } = req.body;

  // Use badge_no or email as unique identifier
  const identifier = badge_no || email;
  if (!identifier) {
    throw new ApiError(400, 'Badge number or email is required');
  }
  if (!password) {
    throw new ApiError(400, 'Password is required');
  }

  // Check for existing user
  const existing = await db('users').where('badge_no', identifier).first();
  if (existing) {
    throw new ApiError(409, 'User with this badge number already exists');
  }

  const password_hash = await bcrypt.hash(password, 10);
  const id = uuidv4();

  await db('users').insert({
    id,
    badge_no: identifier,
    name_en: name_en || identifier,
    name_hi: name_hi || '',
    role: role || 'HC',
    ps_id: ps_id || null,
    district_id: district_id || null,
    password_hash,
  });

  logger.info(`User registered: ${identifier}`);

  res.status(201).json({
    status: 'success',
    data: { message: 'Account created successfully' },
  });
});

/**
 * POST /api/auth/login
 * Authenticates a user and returns JWT tokens.
 * The frontend sends { email, password, selectedNodeId }.
 * We match `email` against `badge_no` in the users table.
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password, badge_no } = req.body;

  // The frontend uses 'email' field but we store badge_no
  const identifier = badge_no || email;
  if (!identifier || !password) {
    throw new ApiError(400, 'Badge number/email and password are required');
  }

  const user = await db('users').where('badge_no', identifier).first()
    || await db('users').whereRaw("LOWER(name_en) LIKE ?", [`%${identifier.split('@')[0].replace(/\./g, '%')}%`]).first();
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid credentials');
  }

  // Build JWT payload
  const tokenPayload = {
    id: user.id,
    badge_no: user.badge_no,
    role: user.role,
    ps_id: user.ps_id,
    district_id: user.district_id,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Set as HttpOnly cookies
  setTokenCookies(res, accessToken, refreshToken);

  // Also return in body for frontend localStorage usage
  const userData = {
    id: user.id,
    badge_no: user.badge_no,
    name_en: user.name_en,
    name_hi: user.name_hi,
    role: user.role,
    ps_id: user.ps_id,
    district_id: user.district_id,
    is_active: user.is_active,
  };

  logger.info(`User logged in: ${identifier}`);

  res.status(200).json({
    status: 'success',
    data: {
      user: userData,
      access_token: accessToken,
      refresh_token: refreshToken,
    },
  });
});

/**
 * POST /api/auth/logout
 * Clears token cookies.
 */
export const logout = asyncHandler(async (req, res) => {
  clearTokenCookies(res);
  res.status(200).json({
    status: 'success',
    data: { message: 'Logged out successfully' },
  });
});

/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile.
 * Requires a valid access_token (cookie or Authorization header).
 */
export const getMe = asyncHandler(async (req, res) => {
  // req.user is set by the protect middleware
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const user = await db('users')
    .select('id', 'badge_no', 'name_en', 'name_hi', 'role', 'ps_id', 'district_id', 'is_active', 'created_at')
    .where('id', userId)
    .first();

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

/**
 * POST /api/auth/refresh
 * Issues a new access token using a valid refresh token.
 */
export const refresh = asyncHandler(async (req, res) => {
  const refreshTokenValue =
    req.cookies?.refresh_token ||
    req.body?.refresh_token ||
    req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!refreshTokenValue) {
    throw new ApiError(401, 'Refresh token required');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshTokenValue);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  // Verify user still exists and is active
  const user = await db('users').where('id', decoded.id).first();
  if (!user || !user.is_active) {
    throw new ApiError(401, 'User account is deactivated or not found');
  }

  const tokenPayload = {
    id: user.id,
    badge_no: user.badge_no,
    role: user.role,
    ps_id: user.ps_id,
    district_id: user.district_id,
  };

  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);

  setTokenCookies(res, newAccessToken, newRefreshToken);

  res.status(200).json({
    status: 'success',
    data: {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    },
  });
});
