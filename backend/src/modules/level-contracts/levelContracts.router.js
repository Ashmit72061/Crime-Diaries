import { Router } from 'express';
import * as controller from './levelContracts.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { allow } from '../../middleware/rbac.middleware.js';

const router = Router();

// Only SYSTEM_ADMIN can manage level data contracts
router.get('/', authMiddleware, allow('SYSTEM_ADMIN'), controller.listContracts);
router.post('/', authMiddleware, allow('SYSTEM_ADMIN'), controller.create);
router.put('/:id', authMiddleware, allow('SYSTEM_ADMIN'), controller.update);

export default router;
