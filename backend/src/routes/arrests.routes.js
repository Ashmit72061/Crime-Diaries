import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { enforceJurisdictionScope, requireRole } from '../middleware/jurisdiction.middleware.js';
import * as arrestsController from '../controllers/arrests.controller.js';

const router = Router();

router.use(protect);

router.post('/', requireRole('ps'), arrestsController.createArrest);
router.get('/', enforceJurisdictionScope, arrestsController.getArrests);
router.get('/:id', arrestsController.getArrestById);
router.put('/:id', requireRole('ps'), arrestsController.updateArrest);
router.patch('/:id/override', requireRole('dcp'), arrestsController.overrideCrimeHead);

export default router;
