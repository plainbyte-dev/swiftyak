import { Router } from 'express';
import { getVouchers, getVoucher, createVoucher, cancelVoucher } from '../controllers/voucherController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.route('/')
  .get(getVouchers)
  .post(requireRole('admin', 'dispatcher'), createVoucher);

router.get('/:id', getVoucher);
router.patch('/:id/cancel', requireRole('admin'), cancelVoucher);

export default router;
