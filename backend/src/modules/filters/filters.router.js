import { Router } from 'express';
import * as controller from './filters.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/presets', authMiddleware, controller.listPresets);
router.post('/presets', authMiddleware, controller.createPreset);
router.delete('/presets/:id', authMiddleware, controller.deletePreset);

export default router;
