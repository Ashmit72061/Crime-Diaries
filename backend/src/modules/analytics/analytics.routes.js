import express from 'express';
import * as analyticsController from './analytics.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Read-only APIs for aggregating records to build dashboard charts and KPIs.
 * 
 * /api/analytics/overview:
 *   get:
 *     summary: Get analytics overview
 *     description: Returns high-level KPI counts (Total records, Arrests today, PCR calls today, Pending approvals).
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Overview data containing basic count KPIs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_records:
 *                       type: integer
 *                       example: 154
 *                     arrests_today:
 *                       type: integer
 *                       example: 12
 *                     pcr_calls_today:
 *                       type: integer
 *                       example: 45
 *                     pending_approvals:
 *                       type: integer
 *                       example: 8
 * 
 * /api/analytics/by-crime-head:
 *   get:
 *     summary: Get records by crime head
 *     description: Aggregates records grouped by their crime_head JSONB attribute. Useful for pie charts.
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Array of crime heads with their respective counts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       crime_head:
 *                         type: string
 *                         example: THEFT
 *                       count:
 *                         type: integer
 *                         example: 24
 * 
 * /api/analytics/by-ps:
 *   get:
 *     summary: Get records by police station
 *     description: Aggregates records grouped by Police Station ID, split by record_type (Arrests vs PCR vs Cases).
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Array of Police Stations with metric counts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ps_id:
 *                         type: string
 *                         example: PS-001
 *                       count:
 *                         type: integer
 *                         example: 56
 * 
 * /api/analytics/trends:
 *   get:
 *     summary: Get record trends
 *     description: Returns time-series data for a specific metric over a period. Useful for line charts.
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Time-series data array
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                         example: 2024-01-01
 *                       count:
 *                         type: integer
 *                         example: 14
 * 
 * /api/analytics/status-breakdown:
 *   get:
 *     summary: Get record status breakdown
 *     description: Aggregates records by their workflow status (DRAFT, PENDING_SHO, DISTRICT_REVIEW, COMPILED).
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Status breakdown counts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                         example: PENDING_SHO
 *                       count:
 *                         type: integer
 *                         example: 32
 */

router.get('/overview', analyticsController.getOverview);
router.get('/by-crime-head', analyticsController.getByCrimeHead);
router.get('/by-ps', analyticsController.getByPS);
router.get('/trends', analyticsController.getTrends);
router.get('/status-breakdown', analyticsController.getStatusBreakdown);

export default router;
