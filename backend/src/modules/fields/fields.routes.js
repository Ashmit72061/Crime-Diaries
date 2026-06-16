import express from 'express';
import * as fieldsController from './fields.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Fields
 *   description: Dynamic Field Registry API. Used by the frontend to fetch the dynamic schema for forms so they don't have to be hardcoded.
 * 
 * /api/fields:
 *   get:
 *     summary: Retrieve a list of fields
 *     description: Fetches all fields registered in the system. Use this to get the schema for dynamically rendering forms.
 *     tags: [Fields]
 *     parameters:
 *       - in: query
 *         name: record_type
 *         schema:
 *           type: string
 *         description: Filter by record type (e.g., ARREST, PCR_CALL, CASE, UIDB, MISSING)
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status (true/false)
 *     responses:
 *       200:
 *         description: A list of field objects with their keys, types, labels, and validation rules.
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
 *                       field_key:
 *                         type: string
 *                         example: fir_no
 *                       field_type:
 *                         type: string
 *                         example: TEXT
 *                       label_en:
 *                         type: string
 *                         example: FIR Number
 * 
 * /api/fields/form/{record_type}:
 *   get:
 *     summary: Get fields grouped by section
 *     description: Fetches the form layout definition for a specific record type. The fields are returned grouped by their designated 'section' to make rendering easier.
 *     tags: [Fields]
 *     parameters:
 *       - in: path
 *         name: record_type
 *         required: true
 *         description: The type of record (e.g., ARREST)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Form layout definition grouped by section.
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
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       type: object
 */
router.get('/form/:record_type', fieldsController.getFormFields);

// POST /api/fields
router.post('/', fieldsController.createField);

// PUT /api/fields/:id
router.put('/:id', fieldsController.updateField);

// PATCH /api/fields/:id/status
router.patch('/:id/status', fieldsController.toggleFieldStatus);

export default router;
