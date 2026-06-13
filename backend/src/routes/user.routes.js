import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { upload, handleUploadError } from '../middleware/upload.middleware.js';

const router = Router();

// Own profile
router.get('/profile',  protect, userController.getProfile);
router.patch('/profile', protect, upload.single('avatar'), handleUploadError, userController.updateProfile);
router.patch('/change-password', protect, userController.changePassword);

// Public
router.get('/:id', userController.getUserById);

// Admin only
router.get('/',    protect, authorize('admin'), userController.getAllUsers);
router.delete('/:id', protect, authorize('admin'), userController.deleteUser);

export default router;
