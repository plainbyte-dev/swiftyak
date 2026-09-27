import crypto from 'crypto';
import asyncHandler from 'express-async-handler';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { uploadBufferToCloudinary } from '../utils/cloudinary.js';
import { sendPasswordResetEmail } from '../utils/mailer.js';

const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// @desc    Log in and receive a JWT
// @route   POST /api/auth/login
// @access  Public

export const login = asyncHandler(async (req, res) => {
  const { email, password, code } = req.body;
 
  const user = await User.findOne({ email }).select('+password +twoFactorSecret');
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }
 
  if (!user.isActive) {
    res.status(403);
    throw new Error('This account has been deactivated');
  }
 
  if (user.twoFactorEnabled) {
    if (!code) {
      // Password was correct, but a TOTP code is still required.
      // No token is issued at this stage.
      return res.json({ success: true, requiresTwoFactor: true });
    }
    const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
    if (!isValid) {
      res.status(401);
      throw new Error('Invalid verification code');
    }
  }
 
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
 
  const token = generateToken(user._id);
  res.json({ token, user: user.toSafeObject() });
});
 

// @desc    Get the currently authenticated user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
});

export const updateMe = asyncHandler(async (req, res) => {
  const {
    name, phone, company, timezone, language, dateFormat, timeFormat, theme, notifications,
  } = req.body;
 
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
 
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (company !== undefined) user.company = company;
  if (timezone !== undefined) user.timezone = timezone;
  if (language !== undefined) user.language = language;
  if (dateFormat !== undefined) user.dateFormat = dateFormat;
  if (timeFormat !== undefined) user.timeFormat = timeFormat;
  if (theme !== undefined) user.theme = theme;
  if (notifications !== undefined) {
    // Merge rather than replace, so toggling one notification doesn't
    // wipe out the others if the client only sends a partial object.
    user.notifications = { ...user.notifications.toObject(), ...notifications };
  }
 
  await user.save();
  res.json({ success: true, user: user.toSafeObject() });
});
 
// @desc    Change the current user's password
// @route   PATCH /api/auth/change-password
// @access  Private
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
 
  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('currentPassword and newPassword are required');
  }
  if (newPassword.length < 8) {
    res.status(400);
    throw new Error('New password must be at least 8 characters');
  }
 
  const user = await User.findById(req.user._id).select('+password');
  if (!user || !(await user.comparePassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }
 
  user.password = newPassword; // pre('save') hook re-hashes this
  await user.save();
 
  res.json({ success: true, message: 'Password updated' });
});

// @desc    Email a password reset link
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    res.status(400);
    throw new Error('Email is required');
  }

  // Same response whether or not the account exists, so this endpoint
  // can't be used to discover which emails are registered.
  const genericResponse = {
    success: true,
    message: 'If an account exists for that email, a password reset link has been sent.',
  };

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user || !user.isActive) {
    return res.json(genericResponse);
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresMinutes = Number(process.env.RESET_TOKEN_EXPIRES_MINUTES) || 60;

  user.passwordResetToken = hashResetToken(resetToken);
  user.passwordResetExpires = new Date(Date.now() + expiresMinutes * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  try {
    await sendPasswordResetEmail(user, resetUrl);
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.error('Failed to send password reset email:', err.message);
    res.status(500);
    throw new Error('Could not send reset email. Please try again later.');
  }

  res.json(genericResponse);
});

// @desc    Set a new password using a reset token
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    res.status(400);
    throw new Error('token and password are required');
  }
  if (typeof password !== 'string' || password.length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters');
  }

  const user = await User.findOne({
    passwordResetToken: hashResetToken(String(token)),
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    res.status(400);
    throw new Error('Reset link is invalid or has expired');
  }

  user.password = password; // pre('save') hook re-hashes this
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({ success: true, message: 'Password has been reset. You can now log in.' });
});

export const uploadAvatarHandler = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const result = await uploadBufferToCloudinary(req.file.buffer, {
    public_id: `${user._id}-${Date.now()}`,
  });

  user.avatarUrl = result.secure_url;
  await user.save();

  res.json({ success: true, user: user.toSafeObject() });
});

// @desc    Generate a TOTP secret + QR code for the user to scan
// @route   POST /api/auth/2fa/setup
// @access  Private
export const setupTwoFactor = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+twoFactorSecret');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.twoFactorEnabled) {
    res.status(400);
    throw new Error('Two-factor authentication is already enabled');
  }

  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(user.email, 'CourierDesk', secret);
  const qrCodeDataUrl = await qrcode.toDataURL(otpauth);

  // Store the secret, but don't flip twoFactorEnabled until it's verified
  user.twoFactorSecret = secret;
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, secret, qrCode: qrCodeDataUrl });
});

// @desc    Verify a TOTP code and turn 2FA on
// @route   POST /api/auth/2fa/verify
// @access  Private
export const verifyTwoFactor = asyncHandler(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    res.status(400);
    throw new Error('A verification code is required');
  }

  const user = await User.findById(req.user._id).select('+twoFactorSecret');
  if (!user || !user.twoFactorSecret) {
    res.status(400);
    throw new Error('Two-factor setup has not been started');
  }

  const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
  if (!isValid) {
    res.status(401);
    throw new Error('Invalid verification code');
  }

  user.twoFactorEnabled = true;
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, message: 'Two-factor authentication enabled' });
});

// @desc    Disable 2FA (requires current password to confirm identity)
// @route   POST /api/auth/2fa/disable
// @access  Private
export const disableTwoFactor = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    res.status(400);
    throw new Error('Password is required to disable two-factor authentication');
  }

  const user = await User.findById(req.user._id).select('+password +twoFactorSecret');
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Incorrect password');
  }

  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, message: 'Two-factor authentication disabled' });
});