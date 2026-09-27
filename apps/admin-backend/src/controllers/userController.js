import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import UserInvite from '../models/UserInvite.js';
import { sendUserOtpEmail } from '../utils/mailer.js';

const ALLOWED_ROLES = ['admin', 'dispatcher', 'viewer'];

const OTP_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

const hashOtp = (email, code) => crypto.createHash('sha256').update(`${email}:${code}`).digest('hex');

async function sendInviteOtp(invite, invitedByName) {
  const code = String(crypto.randomInt(100000, 1000000));
  invite.otpHash = hashOtp(invite.email, code);
  invite.expiresAt = new Date(Date.now() + OTP_MINUTES * 60 * 1000);
  invite.attempts = 0;
  invite.lastSentAt = new Date();
  await invite.save();
  await sendUserOtpEmail({ name: invite.name, email: invite.email, code, invitedBy: invitedByName, minutes: OTP_MINUTES });
}

// @desc    Start adding a user: validate the details and email a 6-digit code to
//          the new user. The account is only created once the code is verified.
//          There is no public self-registration route.
// @route   POST /api/users/invite
// @access  Private (admin only)
export const inviteUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, company } = req.body;

  if (!name?.trim() || !email?.trim() || !password) {
    res.status(400);
    throw new Error('name, email, and password are required');
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    res.status(400);
    throw new Error('Please provide a valid email');
  }
  if (typeof password !== 'string' || password.length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters');
  }
  if (role !== undefined && !ALLOWED_ROLES.includes(role)) {
    res.status(400);
    throw new Error(`role must be one of: ${ALLOWED_ROLES.join(', ')}`);
  }

  const normalized = email.trim().toLowerCase();
  if (await User.exists({ email: normalized })) {
    res.status(409);
    throw new Error('An account with that email already exists');
  }

  let invite = await UserInvite.findOne({ email: normalized });
  if (invite && Date.now() - invite.lastSentAt.getTime() < RESEND_COOLDOWN_SECONDS * 1000) {
    res.status(429);
    throw new Error('A code was just sent to this email. Please wait a minute before sending another.');
  }

  const salt = await bcrypt.genSalt(10);
  const details = {
    email: normalized,
    name: name.trim(),
    passwordHash: await bcrypt.hash(password, salt),
    role: role ?? 'viewer',
    company: company?.trim() || '',
    invitedBy: req.user._id,
  };
  invite = invite ? Object.assign(invite, details) : new UserInvite({ ...details, otpHash: '-', expiresAt: new Date(), lastSentAt: new Date(0) });

  try {
    await sendInviteOtp(invite, req.user.name);
  } catch (err) {
    console.error('Failed to send user verification code:', err.message);
    await UserInvite.deleteOne({ email: normalized });
    res.status(502);
    throw new Error('Could not send the verification email. Check the address and try again.');
  }

  res.status(202).json({
    success: true,
    message: `A verification code was sent to ${normalized}`,
    data: { email: normalized, expiresInMinutes: OTP_MINUTES, resendAfterSeconds: RESEND_COOLDOWN_SECONDS },
  });
});

// @desc    Send a fresh code for a pending invite
// @route   POST /api/users/invite/resend
// @access  Private (admin only)
export const resendInviteOtp = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const invite = await UserInvite.findOne({ email });
  if (!invite) {
    res.status(404);
    throw new Error('No pending verification for this email. Start again from Add User.');
  }
  const wait = RESEND_COOLDOWN_SECONDS * 1000 - (Date.now() - invite.lastSentAt.getTime());
  if (wait > 0) {
    res.status(429);
    throw new Error(`Please wait ${Math.ceil(wait / 1000)} seconds before sending another code.`);
  }

  try {
    await sendInviteOtp(invite, req.user.name);
  } catch (err) {
    console.error('Failed to resend user verification code:', err.message);
    res.status(502);
    throw new Error('Could not send the verification email. Please try again.');
  }

  res.json({ success: true, message: `A new code was sent to ${email}`, data: { email, resendAfterSeconds: RESEND_COOLDOWN_SECONDS } });
});

// @desc    Verify the emailed code and create the user as email-verified
// @route   POST /api/users/invite/verify
// @access  Private (admin only)
export const verifyInvite = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const code = String(req.body.code || '').trim();

  if (!/^\d{6}$/.test(code)) {
    res.status(400);
    throw new Error('Enter the 6-digit code from the email');
  }

  const invite = await UserInvite.findOne({ email });
  if (!invite) {
    res.status(404);
    throw new Error('No pending verification for this email. Start again from Add User.');
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    res.status(410);
    throw new Error('This code has expired. Send a new code.');
  }
  if (invite.attempts >= OTP_MAX_ATTEMPTS) {
    res.status(429);
    throw new Error('Too many incorrect attempts. Send a new code.');
  }

  const expected = Buffer.from(invite.otpHash, 'hex');
  const given = Buffer.from(hashOtp(email, code), 'hex');
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) {
    invite.attempts += 1;
    await invite.save();
    const left = OTP_MAX_ATTEMPTS - invite.attempts;
    res.status(400);
    throw new Error(left > 0 ? `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} left.` : 'Too many incorrect attempts. Send a new code.');
  }

  if (await User.exists({ email })) {
    await invite.deleteOne();
    res.status(409);
    throw new Error('An account with that email already exists');
  }

  const user = new User({
    name: invite.name,
    email,
    password: invite.passwordHash,
    role: invite.role,
    company: invite.company || undefined,
    emailVerified: true,
    emailVerifiedAt: new Date(),
  });
  user.$locals.passwordHashed = true; // already bcrypt-hashed when the invite was made
  await user.save();
  await invite.deleteOne();

  res.status(201).json({ success: true, data: user.toSafeObject() });
});

// @desc    List users — search, role filter, paginate
// @route   GET /api/users?search=&role=&page=&perPage=
// @access  Private (admin only)
export const getUsers = asyncHandler(async (req, res) => {
  const { search = '', role = 'all', page = 1, perPage = 7 } = req.query;

  const filter = {};
  if (role !== 'all') filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const perPageNum = Math.max(1, parseInt(perPage, 10) || 7);

  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * perPageNum)
      .limit(perPageNum),
  ]);

  res.json({
    success: true,
    data: users.map((u) => u.toSafeObject()),
    pagination: {
      total,
      page: pageNum,
      perPage: perPageNum,
      totalPages: Math.ceil(total / perPageNum),
    },
  });
});

// @desc    Get a single user
// @route   GET /api/users/:id
// @access  Private (admin only)
export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({ success: true, data: user.toSafeObject() });
});

// @desc    Update a user's role, company, or active status
// @route   PATCH /api/users/:id
// @access  Private (admin only)
export const updateUser = asyncHandler(async (req, res) => {
  const { name, role, company, isActive } = req.body;

  if (role !== undefined && !ALLOWED_ROLES.includes(role)) {
    res.status(400);
    throw new Error(`role must be one of: ${ALLOWED_ROLES.join(', ')}`);
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Prevent an admin from locking themselves out by deactivating/demoting their own account.
  if (String(user._id) === String(req.user._id)) {
    if (isActive === false) {
      res.status(400);
      throw new Error('You cannot deactivate your own account');
    }
    if (role !== undefined && role !== 'admin') {
      res.status(400);
      throw new Error('You cannot change your own role');
    }
  }

  if (name !== undefined) user.name = name;
  if (role !== undefined) user.role = role;
  if (company !== undefined) user.company = company;
  if (isActive !== undefined) user.isActive = isActive;

  await user.save();
  res.json({ success: true, data: user.toSafeObject() });
});

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private (admin only)
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (String(user._id) === String(req.user._id)) {
    res.status(400);
    throw new Error('You cannot delete your own account');
  }

  await user.deleteOne();
  res.json({ success: true, data: {} });
});