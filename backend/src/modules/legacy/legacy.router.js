import { Router } from 'express';
import * as legacyController from './legacy.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { allow } from '../../middleware/rbac.middleware.js';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const DISTRICT_ROLES = ['DISTRICT_OFFICER', 'HQ_ANALYST', 'HQ_ADMIN', 'SYSTEM_ADMIN'];
const SHO_UP_ROLES = ['SHO', 'DISTRICT_OFFICER', 'JCP', 'SCP', 'HQ_ANALYST', 'HQ_ADMIN', 'SYSTEM_ADMIN'];

router.post('/import', authMiddleware, allow(...DISTRICT_ROLES), upload.single('file'), legacyController.importLegacy);
router.get('/batches', authMiddleware, allow(...DISTRICT_ROLES), legacyController.getBatches);
router.get('/batches/:id', authMiddleware, allow(...DISTRICT_ROLES), legacyController.getBatch);
router.get('/column-map/:record_type', authMiddleware, allow(...DISTRICT_ROLES), legacyController.getColumnMap);

router.post('/amendments', authMiddleware, allow(...SHO_UP_ROLES), legacyController.requestAmendment);
router.post('/amendments/:id/approve', authMiddleware, allow(...DISTRICT_ROLES), legacyController.approveAmendment);
router.post('/amendments/:id/reject', authMiddleware, allow(...DISTRICT_ROLES), legacyController.rejectAmendment);
router.get('/amendments', authMiddleware, allow(...SHO_UP_ROLES), legacyController.listAmendments);

export default router;
