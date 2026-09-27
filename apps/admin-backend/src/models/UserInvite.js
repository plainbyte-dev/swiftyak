import mongoose from 'mongoose';

// A user an admin is adding, waiting for the new user's email OTP to be confirmed.
// Only hashes are stored: the password is bcrypt-hashed and the OTP is SHA-256 hashed.
const userInviteSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'dispatcher', 'viewer'], default: 'viewer' },
    company: { type: String, trim: true, default: '' },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, required: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// MongoDB removes abandoned invites automatically an hour after the code expires.
userInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 60 * 60 });

export default mongoose.model('UserInvite', userInviteSchema);
