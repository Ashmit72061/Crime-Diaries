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

// Scheduled reports CRUD (HQ/Admin only)
router.get('/schedules', authMiddleware, allow('HQ_ADMIN', 'SYSTEM_ADMIN'), reportsController.listSchedules);
router.post('/schedules', authMiddleware, allow('HQ_ADMIN', 'SYSTEM_ADMIN'), reportsController.createSchedule);
router.put('/schedules/:id', authMiddleware, allow('HQ_ADMIN', 'SYSTEM_ADMIN'), reportsController.updateSchedule);
router.delete('/schedules/:id', authMiddleware, allow('HQ_ADMIN', 'SYSTEM_ADMIN'), reportsController.deleteSchedule);
router.post('/schedules/:id/run', authMiddleware, allow('HQ_ADMIN', 'SYSTEM_ADMIN'), reportsController.runScheduleNow);

// Also expose /stats on the reports router in case mounted as /api/admin
router.get('/stats', authMiddleware, allow('HQ_ADMIN', 'SYSTEM_ADMIN'), reportsController.getAdminStats);

export default router;
