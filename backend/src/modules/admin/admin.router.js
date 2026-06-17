import { Router } from 'express';
import * as customFieldsController from './customFields.controller.js';
import * as reportsController from '../reports/reports.controller.js';
import * as auditController from '../audit/audit.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { allow } from '../../middleware/rbac.middleware.js';

const router = Router();

// Secure routes
router.post('/custom-fields', authMiddleware, customFieldsController.createCustomField);
router.get('/custom-fields/:level', authMiddleware, customFieldsController.getCustomFields);
router.get('/custom-fields', authMiddleware, customFieldsController.getCustomFields);

router.get('/stats', authMiddleware, allow('HQ_ADMIN', 'SYSTEM_ADMIN'), reportsController.getAdminStats);

// Audit tools: SYSTEM_ADMIN
router.post('/audit-verify', authMiddleware, allow('SYSTEM_ADMIN'), auditController.verifyAuditChainEndpoint);
router.get('/audit-log', authMiddleware, allow('SYSTEM_ADMIN'), auditController.getAdminAuditLogs);

export default router;

