import express from 'express';
import * as workflowController from './workflow.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Workflow
 *   description: Workflow Engine API. Manages the state machine transitions for records (e.g. DRAFT -> PENDING_SHO -> DISTRICT_REVIEW).
 * 
 * /api/workflow/queue:
 *   get:
 *     summary: Get workflow queue
 *     description: Fetches all records currently awaiting review/action by the logged-in user based on their hierarchy level (e.g. SHO sees PENDING_SHO).
 *     tags: [Workflow]
 *     responses:
 *       200:
 *         description: Workflow queue items
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
 *                       id:
 *                         type: string
 *                       record_type:
 *                         type: string
 *                       current_status:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 * 
 * /api/workflow/queue/count:
 *   get:
 *     summary: Get count of workflow queue items
 *     description: Fetches the total count of pending records in the user's queue. Useful for notification badges.
 *     tags: [Workflow]
 *     responses:
 *       200:
 *         description: Queue count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: integer
 *                   example: 12
 * 
 * /api/workflow/records/{id}/submit:
 *   post:
 *     summary: Submit a record
 *     description: Submits a DRAFT record to the next level in the hierarchy (e.g. Head Constable submits to SHO). Changes status to PENDING_SHO.
 *     tags: [Workflow]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Record successfully submitted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Record submitted to SHO
 * 
 * /api/workflow/records/{id}/approve:
 *   post:
 *     summary: Approve a record
 *     description: Approves a pending record, pushing it up to the next hierarchy level (e.g. SHO approves -> DISTRICT_REVIEW).
 *     tags: [Workflow]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Record successfully approved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Record approved and sent to DISTRICT_REVIEW
 * 
 * /api/workflow/records/{id}/send-back:
 *   post:
 *     summary: Send back a record
 *     description: Rejects a record and sends it back to the lower level for correction. Requires a comment.
 *     tags: [Workflow]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *                 description: Reason for sending back
 *                 example: "Missing photo of accused"
 *               target_fields:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Specific field keys that need correction
 *                 example: ["accused_photo", "date_of_arrest"]
 *     responses:
 *       200:
 *         description: Record successfully sent back
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Record sent back to PS
 * 
 * /api/workflow/records/{id}/history:
 *   get:
 *     summary: Get workflow history of a record
 *     description: Fetches the entire history of state transitions (Submits, Approvals, Send Backs) for a record.
 *     tags: [Workflow]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workflow history log
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
 *                       id:
 *                         type: string
 *                       from_status:
 *                         type: string
 *                         example: DRAFT
 *                       to_status:
 *                         type: string
 *                         example: PENDING_SHO
 *                       action:
 *                         type: string
 *                         example: SUBMIT
 *                       performed_at:
 *                         type: string
 *                         format: date-time
 *                       comment:
 *                         type: string
 *                         nullable: true
 *                       target_fields:
 *                         type: array
 *                         items:
 *                           type: string
 *                         nullable: true
 */

// GET /api/workflow/queue
router.get('/queue', workflowController.getQueue);

// GET /api/workflow/queue/count
router.get('/queue/count', workflowController.getQueueCount);

// POST /api/workflow/records/:id/submit
router.post('/records/:id/submit', workflowController.submitRecord);

// POST /api/workflow/records/:id/approve
router.post('/records/:id/approve', workflowController.approveRecord);

// POST /api/workflow/records/:id/send-back
router.post('/records/:id/send-back', workflowController.sendBackRecord);

// GET /api/workflow/records/:id/history
router.get('/records/:id/history', workflowController.getRecordHistory);

export default router;
