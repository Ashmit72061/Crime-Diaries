import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDB } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new ApiError(400, 'Username and password are required');
  }

  const db = await getDB();
  
  // Retrieve user with district, sub-division, and station info
  const user = await db.get(
    `SELECT u.*, 
            d.name as district_name, 
            sd.name as subdivision_name, 
            ps.name as station_name
     FROM users u
     LEFT JOIN districts d ON u.district_id = d.id
     LEFT JOIN sub_divisions sd ON u.sub_division_id = sd.id
     LEFT JOIN police_stations ps ON u.station_id = ps.id
     WHERE u.username = ?`,
    [username]
  );

  if (!user) {
    throw new ApiError(401, 'Invalid username or password');
  }

  if (!user.is_active) {
    throw new ApiError(403, 'Account is deactivated. Contact administrator.');
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordMatch) {
    throw new ApiError(401, 'Invalid username or password');
  }

  // Create token
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  // Exclude password hash from response
  const { password_hash, ...cleanUser } = user;

  res.cookie('token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000 // 8 hours
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: {
          id: cleanUser.id,
          username: cleanUser.username,
          email: cleanUser.email,
          role: cleanUser.role,
          district: cleanUser.district_id,
          districtName: cleanUser.district_name,
          subDivision: cleanUser.sub_division_id,
          subDivisionName: cleanUser.subdivision_name,
          policeStation: cleanUser.station_id,
          policeStationName: cleanUser.station_name,
        },
        token
      },
      'Logged in successfully'
    )
  );
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  return res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});

export const getMe = asyncHandler(async (req, res) => {
  const db = await getDB();
  const user = await db.get(
    `SELECT u.id, u.username, u.email, u.role, u.district_id as district, u.sub_division_id as subDivision, u.station_id as policeStation,
            d.name as districtName, sd.name as subDivisionName, ps.name as policeStationName
     FROM users u
     LEFT JOIN districts d ON u.district_id = d.id
     LEFT JOIN sub_divisions sd ON u.sub_division_id = sd.id
     LEFT JOIN police_stations ps ON u.station_id = ps.id
     WHERE u.id = ?`,
    [req.user.id]
  );

  return res.status(200).json(new ApiResponse(200, { user }, 'User details retrieved'));
});
