import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimiter.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerValidator, loginValidator } from '../validators/auth.validator.js';

const router = Router();

router.post('/register', authLimiter, registerValidator, validate, authController.register);
router.post('/login',    authLimiter, loginValidator,    validate, authController.login);
router.post('/refresh',  authController.refresh);
router.post('/logout',   authController.logout);
router.get('/me',        protect, authController.getMe);

export default router;
