import { Router } from 'express';
import * as fieldsController from './fields.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/form/:record_type', authMiddleware, fieldsController.getFieldsForForm);

export default router;
