import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import * as authService from '../services/auth.service.js';
import { setTokenCookies, clearTokenCookies } from '../utils/generateToken.js';

/**
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  const user = await authService.registerUser({ username, email, password });

  return res.status(201).json(
    new ApiResponse(201, { user }, 'Account created successfully')
  );
});

/**
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const meta = { userAgent: req.headers['user-agent'], ip: req.ip };

  const { user, accessToken, refreshToken } = await authService.loginUser(
    { email, password },
    meta
  );

  setTokenCookies(res, accessToken, refreshToken);

  return res.status(200).json(
    new ApiResponse(200, { user, accessToken }, 'Login successful')
  );
});

/**
 * POST /api/auth/refresh
 */
export const refresh = asyncHandler(async (req, res) => {
  const oldRefreshToken = req.cookies?.refresh_token;
  if (!oldRefreshToken) throw new ApiError(401, 'No refresh token provided');

  const meta = { userAgent: req.headers['user-agent'], ip: req.ip };
  const { accessToken, refreshToken, user } = await authService.refreshTokens(
    oldRefreshToken,
    meta
  );

  setTokenCookies(res, accessToken, refreshToken);

  return res.status(200).json(
    new ApiResponse(200, { accessToken, user }, 'Token refreshed')
  );
});

/**
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refresh_token;
  await authService.logoutUser(refreshToken);
  clearTokenCookies(res);

  return res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});

/**
 * GET /api/auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, { user: req.user }, 'Authenticated user')
  );
});
