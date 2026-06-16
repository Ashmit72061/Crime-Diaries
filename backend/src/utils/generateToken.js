import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Generate a short-lived JWT access token.
 */
export const generateAccessToken = (payload) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN });

/**
 * Generate a long-lived JWT refresh token.
 */
export const generateRefreshToken = (payload) =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });

/**
 * Verify an access token. Returns decoded payload or throws.
 */
export const verifyAccessToken = (token) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET);

/**
 * Verify a refresh token. Returns decoded payload or throws.
 */
export const verifyRefreshToken = (token) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET);

/**
 * Set access + refresh tokens as HttpOnly secure cookies.
 */
export const setTokenCookies = (res, accessToken, refreshToken) => {
  const secure = env.isProd;
  const sameSite = env.isProd ? 'strict' : 'lax';

  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * Clear token cookies.
 */
export const clearTokenCookies = (res) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
};
