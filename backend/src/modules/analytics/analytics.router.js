import { Router } from 'express';
import * as analyticsController from './analytics.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { enforceScope } from '../../middleware/rbac.middleware.js';

const router = Router();

router.get('/summary', authMiddleware, enforceScope, analyticsController.getSummary);
router.get('/trends', authMiddleware, enforceScope, analyticsController.getTrends);
router.get('/compare', authMiddleware, enforceScope, analyticsController.getCompare);
router.get('/export', authMiddleware, enforceScope, analyticsController.exportSpreadsheet);

export default router;
