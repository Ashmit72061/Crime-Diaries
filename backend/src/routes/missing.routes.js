import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { enforceJurisdictionScope, requireRole } from '../middleware/jurisdiction.middleware.js';
import * as missingController from '../controllers/missing.controller.js';

const router = Router();

router.use(protect);

router.post('/', requireRole('ps'), missingController.createMissing);
router.get('/', enforceJurisdictionScope, missingController.getMissings);
router.get('/:id', missingController.getMissingById);
router.put('/:id', requireRole('ps'), missingController.updateMissing);

export default router;
