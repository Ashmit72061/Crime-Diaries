import { Router } from 'express';
import * as recordsController from './records.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { allow, enforceScope } from '../../middleware/rbac.middleware.js';

const router = Router();

router.get('/', authMiddleware, enforceScope, recordsController.getRecords);
router.get('/:id', authMiddleware, recordsController.getRecord);

router.post('/', authMiddleware, allow('HC'), recordsController.create);
router.put('/:id', authMiddleware, allow('HC'), recordsController.update);
router.put('/:id/submit', authMiddleware, allow('HC'), recordsController.submit);

router.post('/:id/approve', authMiddleware, allow('SHO', 'DISTRICT_OFFICER'), recordsController.approve);
router.post('/:id/send-back', authMiddleware, allow('SHO', 'DISTRICT_OFFICER'), recordsController.sendBack);

// Support both standard override routes
router.patch('/:id/case-head', authMiddleware, allow('DISTRICT_OFFICER'), recordsController.overrideHead);
router.patch('/:id/override', authMiddleware, allow('DISTRICT_OFFICER'), recordsController.overrideHead);

export default router;
