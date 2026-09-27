import { Router } from 'express';
import {
  getBills, getBill, createBill, cancelBill,
  getBillSettings, updateBillSettings, setBillSettingsImage,
} from '../controllers/billController.js';
import { protect, requireRole } from '../middleware/auth.js';
import { uploadBillAsset } from '../middleware/upload.js';

const router = Router();

router.use(protect);

router.route('/')
  .get(getBills)
  .post(requireRole('admin', 'dispatcher'), createBill);

// Settings routes must come before /:id so "settings" isn't treated as a bill id.
router.route('/settings')
  .get(getBillSettings)
  .patch(requireRole('admin'), updateBillSettings);
router.route('/settings/:kind')
  .put(requireRole('admin'), uploadBillAsset, setBillSettingsImage)
  .delete(requireRole('admin'), setBillSettingsImage);

router.get('/:id', getBill);
router.patch('/:id/cancel', requireRole('admin'), cancelBill);

export default router;
