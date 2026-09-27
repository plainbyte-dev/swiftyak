import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  getUsers, getUser, updateUser, deleteUser, inviteUser, resendInviteOtp, verifyInvite,
} from '../controllers/userController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.use(requireRole('admin'));

// Adding a user is a two-step OTP flow; there is no direct create.
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many verification requests. Please try again later.' },
});
router.post('/invite', otpLimiter, inviteUser);
router.post('/invite/resend', otpLimiter, resendInviteOtp);
router.post('/invite/verify', otpLimiter, verifyInvite);

router.route('/').get(getUsers);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

export default router;