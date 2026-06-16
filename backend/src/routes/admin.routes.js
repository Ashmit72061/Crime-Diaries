import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/jurisdiction.middleware.js';
import * as adminController from '../controllers/admin.controller.js';

const router = Router();

router.use(protect);

// Open reference data endpoints (all authenticated users can read lists)
router.get('/jurisdictions', adminController.getJurisdictions);
router.get('/case-heads', adminController.getCaseHeads);
router.get('/custom-fields/ps', adminController.getActiveCustomFieldsForPS);

// Admin-restricted routes (User CRUD)
router.post('/users', requireRole('admin'), adminController.createUser);
router.get('/users', requireRole('admin'), adminController.getUsers);
router.put('/users/:id', requireRole('admin'), adminController.updateUser);

// Admin and DCP route to define custom fields
router.post('/custom-fields', requireRole('admin', 'dcp'), adminController.createCustomField);
router.get('/custom-fields', requireRole('admin', 'dcp'), adminController.getCustomFields);
router.delete('/custom-fields/:id', requireRole('admin', 'dcp'), adminController.deactivateCustomField);

export default router;
