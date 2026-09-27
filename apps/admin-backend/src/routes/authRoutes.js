import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, getMe,  uploadAvatarHandler,
  setupTwoFactor,
  verifyTwoFactor,
  disableTwoFactor, updateMe,
  forgotPassword, resetPassword } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { uploadAvatar } from '../middleware/upload.js';

const router = Router();

// Tighter limit on password reset so it can't be used to spam inboxes.
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

router.post('/login', login);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);
router.post('/avatar', protect, uploadAvatar, uploadAvatarHandler);
router.post('/2fa/setup', protect, setupTwoFactor);
router.post('/2fa/verify', protect, verifyTwoFactor);
router.post('/2fa/disable', protect, disableTwoFactor);

export default router;
