import { Router } from 'express';
import * as auditController from './audit.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { allow } from '../../middleware/rbac.middleware.js';

const router = Router();

const DISTRICT_ROLES = ['DISTRICT_OFFICER', 'HQ_ANALYST', 'HQ_ADMIN', 'SYSTEM_ADMIN'];

// Chain verification: SYSTEM_ADMIN
router.get('/chain-verify', authMiddleware, allow('SYSTEM_ADMIN'), auditController.verifyAuditChainEndpoint);

// Record revision history: Any auth
router.get('/record/:recordId', authMiddleware, auditController.getRecordAudit);

// User audit actions query: DISTRICT+ roles
router.get('/user/:userId', authMiddleware, allow(...DISTRICT_ROLES), auditController.getUserAudit);

// Standard audit log viewer fallback
router.get('/', authMiddleware, allow('HQ_ADMIN', 'SYSTEM_ADMIN'), auditController.getAuditLogs);

export default router;
