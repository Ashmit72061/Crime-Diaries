import express from 'express';
import * as notificationsController from './notifications.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: System notifications generated dynamically from RabbitMQ Event Bus hooks.
 * 
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     description: Fetches a paginated list of notifications for the logged-in user.
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: A list of notifications
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
 *                       message:
 *                         type: string
 *                         example: Record ARREST submitted for review
 *                       is_read:
 *                         type: boolean
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       metadata:
 *                         type: object
 *                         nullable: true
 * 
 * /api/notifications/count:
 *   get:
 *     summary: Get unread notification count
 *     description: Returns the total number of unread notifications for the user's badge icon.
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Notification count integer
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
 *                   example: 4
 * 
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     description: Marks a specific notification as read.
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 * 
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     description: Bulk updates all unread notifications for the logged-in user to 'read'.
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 */

router.get('/', notificationsController.getNotifications);
router.get('/count', notificationsController.getNotificationCount);
router.patch('/:id/read', notificationsController.markAsRead);
router.patch('/read-all', notificationsController.markAllAsRead);

export default router;
