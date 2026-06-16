import { Router } from 'express';
import * as reportsController from './reports.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { allow } from '../../middleware/rbac.middleware.js';

const router = Router();

router.get('/templates', authMiddleware, reportsController.getTemplates);
router.post('/generate', authMiddleware, reportsController.generateReport);
router.get('/status/:id', authMiddleware, reportsController.getJobStatus);
router.get('/download/:id', reportsController.downloadReport); 
router.get('/history', authMiddleware, reportsController.getReportsHistory);

// Also expose /stats on the reports router in case mounted as /api/admin
router.get('/stats', authMiddleware, allow('HQ_ADMIN', 'SYSTEM_ADMIN'), reportsController.getAdminStats);

export default router;
