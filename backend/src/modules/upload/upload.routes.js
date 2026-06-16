import express from 'express';
import * as uploadController from './upload.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Uploads
 *   description: File Management API. Handles media uploads to local storage (or MinIO in production).
 * 
 * /api/upload:
 *   post:
 *     summary: Upload a file (image/pdf)
 *     description: Accepts a multipart/form-data upload, validates the file type (images/pdf), and stores it safely. Returns the stored file path which the frontend should attach to the record JSON.
 *     tags: [Uploads]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload (Max size 10MB)
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     filename:
 *                       type: string
 *                     path:
 *                       type: string
 *                     mimetype:
 *                       type: string
 *                     size:
 *                       type: integer
 */
router.post('/', uploadController.uploadMiddleware, uploadController.handleUpload);

export default router;
