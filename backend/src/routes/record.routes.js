import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord
} from '../controllers/record.controller.js';

const router = Router();

// Protect all routes below
router.use(protect);

router.route('/')
  .post(createRecord)
  .get(getRecords);

router.route('/:id')
  .get(getRecordById)
  .put(updateRecord)
  .delete(deleteRecord);

export default router;
