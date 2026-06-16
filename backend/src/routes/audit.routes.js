import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/jurisdiction.middleware.js';
import * as auditController from '../controllers/audit.controller.js';

const router = Router();

router.use(protect);
router.use(requireRole('admin', 'hq'));

router.get('/', auditController.getAuditLogs);

export default router;
