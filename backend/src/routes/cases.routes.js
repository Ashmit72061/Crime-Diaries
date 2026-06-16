import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { enforceJurisdictionScope, requireRole } from '../middleware/jurisdiction.middleware.js';
import * as casesController from '../controllers/cases.controller.js';

const router = Router();

router.use(protect);

router.post('/', requireRole('ps'), casesController.createCase);
router.get('/', enforceJurisdictionScope, casesController.getCases);
router.get('/:id', casesController.getCaseById);
router.put('/:id', requireRole('ps'), casesController.updateCase);
router.patch('/:id/override', requireRole('dcp'), casesController.overrideCaseHead);

export default router;
