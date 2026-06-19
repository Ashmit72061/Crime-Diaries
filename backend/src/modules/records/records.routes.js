import express from 'express';
import * as recordsController from './records.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Records
 *   description: API for managing core entity records (Arrest, PCR Call, Cases, etc.). Includes CRUD and revision history.
 * 
 * /api/records:
 *   get:
 *     summary: Get a list of records
 *     description: Fetch records with optional filters like type, status, psId, or districtId.
 *     tags: [Records]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Record type filter (e.g. ARREST)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Status filter (e.g. DRAFT)
 *     responses:
 *       200:
 *         description: A list of records
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
 *                       data:
 *                         type: object
 *                         description: Dynamic JSONB data
 *   post:
 *     summary: Create a new record
 *     description: Creates a new record in DRAFT status. Expects a dynamic JSON payload corresponding to the record_type's field schema.
 *     tags: [Records]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               record_type:
 *                 type: string
 *                 example: ARREST
 *               data:
 *                 type: object
 *                 description: Key-value pairs matching the field_keys for this form
 *               ps_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Record successfully created
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
 *                     id:
 *                       type: string
 * 
 * /api/records/{id}:
 *   get:
 *     summary: Get a record by ID
 *     description: Fetch all details and JSONB data for a specific record.
 *     tags: [Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Record data
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
 *                     id:
 *                       type: string
 *                     record_type:
 *                       type: string
 *                     current_status:
 *                       type: string
 *                     data:
 *                       type: object
 *   put:
 *     summary: Update a record
 *     description: Updates the JSONB data of a record. Only allowed if the record is in DRAFT or SENT_BACK_HC status.
 *     tags: [Records]
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
 *               data:
 *                 type: object
 *                 description: Updated key-value pairs
 *     responses:
 *       200:
 *         description: Record updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *   delete:
 *     summary: Delete a record
 *     description: Deletes a record. Only allowed if the record is in DRAFT status.
 *     tags: [Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Record deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 * 
 * /api/records/{id}/revisions:
 *   get:
 *     summary: Get record revisions
 *     description: Fetches the audit trail of all changes made to a record over time.
 *     tags: [Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of revisions with old/new values
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
 *                       action:
 *                         type: string
 *                         example: UPDATE
 *                       old_data:
 *                         type: object
 *                       new_data:
 *                         type: object
 *                       created_at:
 *                         type: string
 *                         format: date-time
 */

// GET /api/records
router.get('/', recordsController.getRecords);

// POST /api/records
router.post('/', recordsController.createRecord);

// GET /api/records/:id
router.get('/:id', recordsController.getRecord);

// PUT /api/records/:id
router.put('/:id', recordsController.updateRecord);

// DELETE /api/records/:id
router.delete('/:id', recordsController.deleteRecord);

// GET /api/records/:id/revisions
router.get('/:id/revisions', recordsController.getRecordRevisions);

export default router;
