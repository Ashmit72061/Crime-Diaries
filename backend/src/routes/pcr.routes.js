import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { enforceJurisdictionScope, requireRole } from '../middleware/jurisdiction.middleware.js';
import * as pcrController from '../controllers/pcr.controller.js';

const router = Router();

router.use(protect);

router.post('/', requireRole('ps'), pcrController.createPcr);
router.get('/', enforceJurisdictionScope, pcrController.getPcrs);
router.get('/:id', pcrController.getPcrById);
router.put('/:id', requireRole('ps'), pcrController.updatePcr);

export default router;
