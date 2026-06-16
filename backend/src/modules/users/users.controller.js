import db from '../../config/db.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { logoutUser } from '../auth/auth.service.js';

export const getUsers = async (req, res) => {
  try {
    const role = req.query.role;
    const psId = req.query.psId || req.query.station_id;
    const districtId = req.query.districtId || req.query.district_id;
    const page = parseInt(req.query.page || 1, 10);
    const limit = parseInt(req.query.limit || 20, 10);
    const offset = (page - 1) * limit;

    let query = db('users')
      .select('users.*', 'ps.name_en as ps_name', 'ps.name_hi as ps_name_hi', 'dist.name_en as district_name', 'dist.name_hi as district_name_hi')
      .leftJoin('hierarchy_nodes as ps', 'users.station_id', 'ps.id')
      .leftJoin('hierarchy_nodes as dist', 'users.district_id', 'dist.id');

    let countQuery = db('users');

    if (role) {
      query = query.where('users.role', role);
      countQuery = countQuery.where('role', role);
    }
    if (psId) {
      query = query.where('users.station_id', psId);
      countQuery = countQuery.where('station_id', psId);
    }
    if (districtId) {
      query = query.where('users.district_id', districtId);
      countQuery = countQuery.where('district_id', districtId);
    }

    const totalRes = await countQuery.count('* as count').first();
    const total = parseInt(totalRes.count || 0, 10);

    const list = await query.orderBy('users.created_at', 'desc').limit(limit).offset(offset);

    const sanitized = list.map(u => {
      const { password_hash, station_id, ...rest } = u;
      return {
        ...rest,
        userId: rest.id,
        psId: station_id || null,
        ps_id: station_id || null,
        station_id: station_id || null,
        districtId: rest.district_id || null,
        district_id: rest.district_id || null
      };
    });

    return res.status(200).json({
      status: 'success',
      success: true,
      data: sanitized,
      meta: { page, limit, total }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
};

export const getUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await db('users')
      .select('users.*', 'ps.name_en as ps_name_en', 'ps.name_hi as ps_name_hi', 'dist.name_en as district_name_en', 'dist.name_hi as district_name_hi')
      .leftJoin('hierarchy_nodes as ps', 'users.station_id', 'ps.id')
      .leftJoin('hierarchy_nodes as dist', 'users.district_id', 'dist.id')
      .where('users.id', id)
      .first();

    if (!user) {
      return res.status(404).json({
        status: 'error',
        success: false,
        code: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    const { password_hash, station_id, ...rest } = user;
    const sanitized = {
      ...rest,
      userId: rest.id,
      psId: station_id || null,
      ps_id: station_id || null,
      station_id: station_id || null,
      districtId: rest.district_id || null,
      district_id: rest.district_id || null
    };

    return res.status(200).json({
      status: 'success',
      success: true,
      data: sanitized
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
};

export const createUser = async (req, res) => {
  const badgeNo = req.body.badgeNo || req.body.badge_no;
  const name_en = req.body.name_en;
  const name_hi = req.body.name_hi;
  const role = req.body.role;
  const psId = req.body.psId || req.body.station_id;
  const districtId = req.body.districtId || req.body.district_id;
  const subDivId = req.body.subDivId || req.body.sub_div_id;
  const username = req.body.username || badgeNo;
  const password = req.body.password;

  if (!badgeNo || !password || !role) {
    return res.status(400).json({
      status: 'error',
      success: false,
      code: 'BAD_REQUEST',
      message: 'badgeNo, password, and role are required'
    });
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    const id = uuidv4();

    await db('users').insert({
      id,
      username,
      badge_no: badgeNo,
      name_en: name_en || username,
      name_hi: name_hi || username,
      password_hash: hash,
      role,
      station_id: psId || null,
      district_id: districtId || null,
      sub_div_id: subDivId || null,
      is_active: true,
      created_at: new Date().toISOString()
    });

    const user = {
      id,
      userId: id,
      username,
      badge_no: badgeNo,
      badgeNo,
      role,
      name_en: name_en || username,
      name_hi: name_hi || username,
      psId: psId || null,
      ps_id: psId || null,
      districtId: districtId || null,
      district_id: districtId || null
    };

    return res.status(201).json({
      status: 'success',
      success: true,
      data: user
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name_en, name_hi, role, psId, station_id, districtId, district_id, is_active } = req.body;

  try {
    const updatePayload = {};
    if (name_en !== undefined) updatePayload.name_en = name_en;
    if (name_hi !== undefined) updatePayload.name_hi = name_hi;
    if (role !== undefined) updatePayload.role = role;
    if (psId !== undefined || station_id !== undefined) updatePayload.station_id = psId || station_id;
    if (districtId !== undefined || district_id !== undefined) updatePayload.district_id = districtId || district_id;
    if (is_active !== undefined) updatePayload.is_active = !!is_active;

    await db('users').where({ id }).update(updatePayload);

    const updatedUser = await db('users').where({ id }).first();
    const { password_hash, station_id: finalStationId, ...rest } = updatedUser;
    const sanitized = {
      ...rest,
      userId: rest.id,
      psId: finalStationId || null,
      ps_id: finalStationId || null,
      station_id: finalStationId || null,
      districtId: rest.district_id || null,
      district_id: rest.district_id || null
    };

    return res.status(200).json({
      status: 'success',
      success: true,
      data: sanitized
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    await db('users').where({ id }).update({ is_active: false });
    return res.status(200).json({
      status: 'success',
      success: true,
      data: { message: 'User deactivated' }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
};

export const resetPassword = async (req, res) => {
  const { id } = req.params;
  const newPassword = req.body.newPassword || req.body.new_password;

  if (!newPassword) {
    return res.status(400).json({
      status: 'error',
      success: false,
      code: 'BAD_REQUEST',
      message: 'newPassword is required'
    });
  }

  try {
    const hash = await bcrypt.hash(newPassword, 12);
    await db('users').where({ id }).update({ password_hash: hash });

    // Invalidate refresh token
    await logoutUser(id);

    return res.status(200).json({
      status: 'success',
      success: true,
      data: { message: 'Password reset' }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
};
