import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../../config/db.js';
import { env } from '../../config/env.js';
import Redis from 'ioredis';

let redisClient = null;
const memoryTokenCache = new Map();

try {
  if (env.REDIS_URL) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        // Stop retrying and fall back to memory
        if (times > 3) return null;
        return 1000;
      }
    });
    redisClient.on('error', (err) => {
      console.warn('[Redis] Connection failed. Using memory fallback cache.');
      if (redisClient) {
        try {
          redisClient.disconnect();
        } catch (e) {}
      }
      redisClient = null;
    });
  }
} catch (e) {
  console.warn('[Redis] Client initialization skipped. Using memory fallback.');
}

async function storeRefreshToken(userId, token) {
  if (redisClient) {
    try {
      await redisClient.set(`refresh:${userId}`, token, 'EX', 7 * 24 * 60 * 60);
      return;
    } catch (e) {
      console.warn('[Redis] Failed to set token. Falling back to memory.');
    }
  }
  memoryTokenCache.set(userId, token);
}

async function getRefreshToken(userId) {
  if (redisClient) {
    try {
      return await redisClient.get(`refresh:${userId}`);
    } catch (e) {
      console.warn('[Redis] Failed to get token. Falling back to memory.');
    }
  }
  return memoryTokenCache.get(userId);
}

async function removeRefreshToken(userId) {
  if (redisClient) {
    try {
      await redisClient.del(`refresh:${userId}`);
      return;
    } catch (e) {
      console.warn('[Redis] Failed to delete token. Falling back to memory.');
    }
  }
  memoryTokenCache.delete(userId);
}

export const loginUser = async (badgeNo, password) => {
  const user = await db('users').where({ badge_no: badgeNo }).first();
  if (!user) {
    throw new Error('Invalid badge number or password');
  }

  if (!user.is_active) {
    throw new Error('User account is deactivated');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new Error('Invalid badge number or password');
  }

  const getLevelFromRole = (role) => {
    if (['HC', 'SHO'].includes(role)) return 'PS';
    if (role === 'DISTRICT_OFFICER') return 'DISTRICT';
    return 'HQ';
  };

  const level = getLevelFromRole(user.role);

  // Generate tokens with BOTH camelCase and snake_case properties
  const payload = {
    id: user.id,
    userId: user.id,
    username: user.username,
    badge_no: user.badge_no,
    badgeNo: user.badge_no,
    name: user.name_en,
    role: user.role,
    level: level,
    ps_id: user.station_id || null,
    psId: user.station_id || null,
    district_id: user.district_id || null,
    districtId: user.district_id || null,
    sub_div_id: user.sub_div_id || null
  };

  const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ id: user.id }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

  // Store refresh token
  await storeRefreshToken(user.id, refreshToken);

  // Update last login
  await db('users').where({ id: user.id }).update({ last_login: new Date().toISOString() });

  // Return token details with BOTH camelCase and snake_case keys
  return {
    accessToken,
    refreshToken,
    access_token: accessToken,
    refresh_token: refreshToken,
    user: {
      id: user.id,
      userId: user.id,
      username: user.username,
      badge_no: user.badge_no,
      badgeNo: user.badge_no,
      name_en: user.name_en,
      name_hi: user.name_hi,
      name: user.name_en,
      role: user.role,
      level: level,
      ps_id: user.station_id || null,
      psId: user.station_id || null,
      district_id: user.district_id || null,
      districtId: user.district_id || null,
      sub_div_id: user.sub_div_id || null
    }
  };
};

export const refreshUserToken = async (token) => {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    const savedToken = await getRefreshToken(decoded.id);
    
    if (!savedToken || savedToken !== token) {
      throw new Error('Invalid refresh token');
    }

    const user = await db('users').where({ id: decoded.id }).first();
    if (!user || !user.is_active) {
      throw new Error('User not found or inactive');
    }

    const getLevelFromRole = (role) => {
      if (['HC', 'SHO'].includes(role)) return 'PS';
      if (role === 'DISTRICT_OFFICER') return 'DISTRICT';
      return 'HQ';
    };

    const level = getLevelFromRole(user.role);

    const payload = {
      id: user.id,
      userId: user.id,
      username: user.username,
      badge_no: user.badge_no,
      badgeNo: user.badge_no,
      name: user.name_en,
      role: user.role,
      level: level,
      ps_id: user.station_id || null,
      psId: user.station_id || null,
      district_id: user.district_id || null,
      districtId: user.district_id || null,
      sub_div_id: user.sub_div_id || null
    };

    const newAccessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });
    return {
      accessToken: newAccessToken,
      access_token: newAccessToken
    };
  } catch (error) {
    throw new Error('Token refresh failed: ' + error.message);
  }
};

export const logoutUser = async (userId) => {
  await removeRefreshToken(userId);
};
