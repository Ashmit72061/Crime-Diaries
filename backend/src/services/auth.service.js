import { User } from '../models/User.model.js';
import { Token } from '../models/Token.model.js';
import { ApiError } from '../utils/ApiError.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/generateToken.js';
import { env } from '../config/env.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Register a new user.
 */
export const registerUser = async ({ username, email, password }) => {
  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    const field = existing.email === email ? 'Email' : 'Username';
    throw new ApiError(409, `${field} is already registered`);
  }

  const user = await User.create({ username, email, password });
  return user;
};

/**
 * Login — verify credentials, return access + refresh tokens.
 */
export const loginUser = async ({ email, password }, meta = {}) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) throw new ApiError(403, 'Account is deactivated');

  const payload = user.toTokenPayload();
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  const family = uuidv4();

  await Token.create({
    user: user._id,
    token: refreshToken,
    family,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    userAgent: meta.userAgent,
    ip: meta.ip,
  });

  user.lastLoginAt = new Date();
  await user.save();

  return { user, accessToken, refreshToken };
};

/**
 * Refresh access token using a valid refresh token (rotation).
 */
export const refreshTokens = async (oldRefreshToken, meta = {}) => {
  let payload;
  try {
    payload = verifyRefreshToken(oldRefreshToken);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const storedToken = await Token.findOne({ token: oldRefreshToken });
  if (!storedToken) throw new ApiError(401, 'Refresh token not recognised');

  // Token reuse detection — invalidate the whole family
  if (storedToken.isRevoked) {
    await Token.updateMany({ family: storedToken.family }, { isRevoked: true });
    throw new ApiError(401, 'Refresh token reuse detected. Please log in again.');
  }

  storedToken.isRevoked = true;
  await storedToken.save();

  const user = await User.findById(payload.id);
  if (!user || !user.isActive) throw new ApiError(401, 'User not found or inactive');

  const newPayload = user.toTokenPayload();
  const newAccessToken = generateAccessToken(newPayload);
  const newRefreshToken = generateRefreshToken(newPayload);

  await Token.create({
    user: user._id,
    token: newRefreshToken,
    family: storedToken.family,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    userAgent: meta.userAgent,
    ip: meta.ip,
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken, user };
};

/**
 * Logout — revoke the provided refresh token.
 */
export const logoutUser = async (refreshToken) => {
  if (!refreshToken) return;
  await Token.findOneAndUpdate({ token: refreshToken }, { isRevoked: true });
};
