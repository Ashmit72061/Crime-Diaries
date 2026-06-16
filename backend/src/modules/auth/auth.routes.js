import express from 'express';
import * as authController from './auth.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints — register, login, logout, token refresh, and profile fetch.
 *
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               badge_no:
 *                 type: string
 *                 example: HC002
 *               email:
 *                 type: string
 *                 example: hc002@delhi.police
 *               name_en:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [HC, SHO, DISTRICT_OFFICER, HQ_ANALYST]
 *     responses:
 *       201:
 *         description: Account created
 *
 * /api/auth/login:
 *   post:
 *     summary: Log in with badge_no/email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, returns user + tokens
 *
 * /api/auth/logout:
 *   post:
 *     summary: Log out and clear cookies
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out
 *
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: New tokens issued
 */

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);

// Protected routes
router.get('/me', protect, authController.getMe);

export default router;
