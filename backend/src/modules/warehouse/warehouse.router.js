/**
 * Warehouse API Router
 * =====================
 * Mounts reporting warehouse management and status endpoints.
 */

import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { getStatus } from './warehouse.controller.js';

const router = Router();

// Endpoint: GET /api/warehouse/status
// Requires a valid authentication token
router.get('/status', authMiddleware, getStatus);

export default router;
