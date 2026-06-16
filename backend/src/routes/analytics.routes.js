import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { enforceJurisdictionScope } from '../middleware/jurisdiction.middleware.js';
import * as analyticsController from '../controllers/analytics.controller.js';

const router = Router();

router.use(protect);
router.use(enforceJurisdictionScope);

router.get('/summary', analyticsController.getSummaryCounts);
router.get('/trends', analyticsController.getTrends);
router.get('/compare', analyticsController.getComparisons);
router.get('/export', analyticsController.exportAnalytics);

export default router;
