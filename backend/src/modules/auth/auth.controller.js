import * as authService from './auth.service.js';
import db from '../../config/db.js';
import bcrypt from 'bcryptjs';

export const login = async (req, res) => {
  const badgeNo = req.body.badgeNo || req.body.badge_no || req.body.email;
  const password = req.body.password;

  if (!badgeNo || !password) {
    return res.status(400).json({
      status: 'error',
      success: false,
      code: 'BAD_REQUEST',
      message: 'Badge number and password are required'
    });
  }

  try {
    const data = await authService.loginUser(badgeNo, password);
    return res.status(200).json({
      status: 'success',
      success: true,
      data
    });
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      success: false,
      code: 'INVALID_CREDENTIALS',
      message: error.message
    });
  }
};

export const refresh = async (req, res) => {
  const refreshToken = req.body.refresh_token || req.body.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({
      status: 'error',
      success: false,
      code: 'BAD_REQUEST',
      message: 'Refresh token is required'
    });
  }

  try {
    const data = await authService.refreshUserToken(refreshToken);
    return res.status(200).json({
      status: 'success',
      success: true,
      data
    });
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      success: false,
      code: 'UNAUTHORIZED',
      message: error.message
    });
  }
};

export const logout = async (req, res) => {
  try {
    const userId = req.user ? (req.user.userId || req.user.id) : null;
    if (userId) {
      await authService.logoutUser(userId);
    }
    return res.status(200).json({
      status: 'success',
      success: true,
      data: { message: 'Logged out' }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
};

export const me = async (req, res) => {
  try {
    const userId = req.user ? (req.user.userId || req.user.id) : null;
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Unauthorized'
      });
    }

    const user = await db('users')
      .select('users.*', 'ps.name_en as ps_name_en', 'ps.name_hi as ps_name_hi', 'dist.name_en as district_name_en', 'dist.name_hi as district_name_hi')
      .leftJoin('hierarchy_nodes as ps', 'users.station_id', 'ps.id')
      .leftJoin('hierarchy_nodes as dist', 'users.district_id', 'dist.id')
      .where('users.id', userId)
      .first();

    if (!user) {
      return res.status(404).json({
        status: 'error',
        success: false,
        code: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    const getLevelFromRole = (role) => {
      if (['HC', 'SHO'].includes(role)) return 'PS';
      if (role === 'DISTRICT_OFFICER') return 'DISTRICT';
      return 'HQ';
    };

    const level = getLevelFromRole(user.role);

    return res.status(200).json({
      status: 'success',
      success: true,
      data: {
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
          sub_div_id: user.sub_div_id || null,
          is_active: !!user.is_active,
          last_login: user.last_login,
          ps_name_en: user.ps_name_en || null,
          ps_name_hi: user.ps_name_hi || null,
          district_name_en: user.district_name_en || null,
          district_name_hi: user.district_name_hi || null
        },
        jurisdiction: {
          station: user.station_id ? { id: user.station_id, name_en: user.ps_name_en, name_hi: user.ps_name_hi, code: user.ps_code } : null,
          district: user.district_id ? { id: user.district_id, name_en: user.district_name_en, name_hi: user.district_name_hi, code: user.district_code } : null
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
};

export const changePassword = async (req, res) => {
  const oldPassword = req.body.oldPassword || req.body.old_password;
  const newPassword = req.body.newPassword || req.body.new_password;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({
      status: 'error',
      success: false,
      code: 'BAD_REQUEST',
      message: 'Old and new passwords are required'
    });
  }

  try {
    const userId = req.user ? (req.user.userId || req.user.id) : null;
    const user = await db('users').where({ id: userId }).first();
    if (!user) {
      return res.status(404).json({
        status: 'error',
        success: false,
        code: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({
        status: 'error',
        success: false,
        code: 'BAD_REQUEST',
        message: 'Incorrect old password'
      });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await db('users').where({ id: userId }).update({ password_hash: newHash });

    // Force re-login by deleting refresh token from Redis
    await authService.logoutUser(userId);

    return res.status(200).json({
      status: 'success',
      success: true,
      data: { message: 'Password updated' }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user ? (req.user.userId || req.user.id) : null;
    const list = await db('notifications')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(50);
    return res.status(200).json({
      status: 'success',
      success: true,
      data: { notifications: list }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
};

export const markNotificationRead = async (req, res) => {
  const { id } = req.params;
  try {
    const userId = req.user ? (req.user.userId || req.user.id) : null;
    await db('notifications')
      .where({ id, user_id: userId })
      .update({ is_read: true });
    return res.status(200).json({
      status: 'success',
      success: true,
      data: { message: 'Notification marked as read' }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
};
