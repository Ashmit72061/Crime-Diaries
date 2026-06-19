import { Router } from 'express';
import * as fieldsController from './fields.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { allow } from '../../middleware/rbac.middleware.js';

const router = Router();

const canManageFields = allow('HQ_ADMIN', 'SYSTEM_ADMIN', 'DISTRICT_OFFICER');

// Form schema endpoint — authenticated, scope-aware
router.get('/form/:record_type', authMiddleware, fieldsController.getFieldsForForm);

// Admin CRUD on field_registry
router.get('/',           authMiddleware, canManageFields, fieldsController.listAllFields);
router.post('/',          authMiddleware, canManageFields, fieldsController.createRegistryField);
router.patch('/:id',      authMiddleware, canManageFields, fieldsController.updateRegistryField);
router.patch('/:id/toggle', authMiddleware, canManageFields, fieldsController.toggleRegistryField);

export default router;
