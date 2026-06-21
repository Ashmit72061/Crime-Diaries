import { Router } from 'express';
import * as controller from './levelContracts.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { allow, enforceScope } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authMiddleware, enforceScope);

// Only SYSTEM_ADMIN can manage level data contracts
router.get('/', allow('SYSTEM_ADMIN'), controller.listContracts);
router.post('/', allow('SYSTEM_ADMIN'), controller.create);
router.put('/:id', allow('SYSTEM_ADMIN'), controller.update);

export default router;
