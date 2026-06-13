import { User } from '../models/User.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, paginate, pick } from '../utils/helpers.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/upload.service.js';

/**
 * GET /api/users/profile  (own profile — protected)
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, 'User not found');

  return res.status(200).json(new ApiResponse(200, { user }, 'Profile fetched'));
});

/**
 * PATCH /api/users/profile  (update own profile — protected)
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = pick(req.body, ['username', 'bio']);

  // Handle avatar upload
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'crime-diaries/avatars',
    });
    allowed.avatar = result.secure_url;
  }

  const user = await User.findByIdAndUpdate(req.user.id, allowed, {
    new: true,
    runValidators: true,
  });

  return res.status(200).json(new ApiResponse(200, { user }, 'Profile updated'));
});

/**
 * PATCH /api/users/change-password  (protected)
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');
  if (!user) throw new ApiError(404, 'User not found');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new ApiError(400, 'Current password is incorrect');

  user.password = newPassword;
  await user.save();

  return res.status(200).json(new ApiResponse(200, null, 'Password changed successfully'));
});

/**
 * GET /api/users  (admin only — paginated list)
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = req.query.role ? { role: req.query.role } : {};

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, { users, pagination: paginate(total, page, limit) }, 'Users fetched')
  );
});

/**
 * GET /api/users/:id  (public — get user by ID)
 */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  return res.status(200).json(new ApiResponse(200, { user }, 'User fetched'));
});

/**
 * DELETE /api/users/:id  (admin only)
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  return res.status(200).json(new ApiResponse(200, null, 'User deleted'));
});
