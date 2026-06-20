import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as importController from './import.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { allow } from '../../middleware/rbac.middleware.js';

const router = Router();

// Ensure local temp uploads directory exists
const tempDir = './temp-imports';
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.get('/template/:record_type', authMiddleware, importController.downloadImportTemplate);
router.post('/validate', authMiddleware, allow('HC', 'DISTRICT_OFFICER', 'HQ_ADMIN', 'SYSTEM_ADMIN'), upload.single('file'), importController.validateImportBatch);
router.post('/confirm/:batchId', authMiddleware, importController.confirmImportBatch);
router.get('/batches', authMiddleware, importController.listBatches);
router.get('/batches/:batchId', authMiddleware, importController.getBatchDetail);

export default router;
