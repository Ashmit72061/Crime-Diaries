import express from 'express';
import * as dailyDiaryController from './daily-diary.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { enforceScope } from '../../middleware/rbac.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: DailyDiary
 *   description: Daily Morning Diary Excel reporting operations
 */

/**
 * @swagger
 * /api/daily-diary/records-preview:
 *   get:
 *     summary: Retrieve counts preview of records per worksheet category
 *     tags: [DailyDiary]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: date
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: 2026-06-12
 *     responses:
 *       200:
 *         description: Counts parsed successfully
 */
router.get('/records-preview', requireAuth(), enforceScope, dailyDiaryController.getDailyDiaryPreview);

/**
 * @swagger
 * /api/daily-diary/export:
 *   get:
 *     summary: Export compiled Daily Diary Excel workbook (.xlsx)
 *     tags: [DailyDiary]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: date
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: 2026-06-12
 *     responses:
 *       200:
 *         description: Excel spreadsheet file generated and streamed successfully
 */
router.get('/export', requireAuth(), enforceScope, dailyDiaryController.exportDailyDiary);

export default router;
