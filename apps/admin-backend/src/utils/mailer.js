import nodemailer from 'nodemailer';

let transporter;

function getTransporter() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 465;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export function sendMail({ to, subject, text, html }) {
  return getTransporter().sendMail({
    from: process.env.MAIL_FROM || `SwiftYak <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });
}

export function sendPasswordResetEmail(user, resetUrl) {
  const minutes = Number(process.env.RESET_TOKEN_EXPIRES_MINUTES) || 60;
  return sendMail({
    to: user.email,
    subject: 'Reset your SwiftYak password',
    text: `Hi ${user.name},

We received a request to reset your SwiftYak password. Open the link below to choose a new one:

${resetUrl}

This link expires in ${minutes} minutes. If you didn't request a reset, you can ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
        <h2 style="margin-bottom: 16px;">Reset your password</h2>
        <p>Hi ${escapeHtml(user.name)},</p>
        <p>We received a request to reset your SwiftYak password. Click the button below to choose a new one.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background: #2563eb; color: #ffffff; padding: 12px 20px; border-radius: 6px; text-decoration: none; display: inline-block;">Reset password</a>
        </p>
        <p style="font-size: 13px; color: #6b7280;">Or paste this link into your browser:<br>${resetUrl}</p>
        <p style="font-size: 13px; color: #6b7280;">This link expires in ${minutes} minutes. If you didn't request a reset, you can ignore this email.</p>
      </div>
    `,
  });
}

export function sendUserOtpEmail({ name, email, code, invitedBy, minutes }) {
  return sendMail({
    to: email,
    subject: `${code} is your SwiftYak verification code`,
    text: `Hi ${name},

${invitedBy} is adding you as a user on the SwiftYak admin portal. To verify your email address, give them this code:

${code}

The code expires in ${minutes} minutes. If you weren't expecting this, you can ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
        <h2 style="margin-bottom: 16px;">Verify your email</h2>
        <p>Hi ${escapeHtml(name)},</p>
        <p>${escapeHtml(invitedBy)} is adding you as a user on the SwiftYak admin portal. To verify your email address, give them this code:</p>
        <p style="margin: 24px 0; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1b2a4a;">${code}</p>
        <p style="font-size: 13px; color: #6b7280;">The code expires in ${minutes} minutes. If you weren't expecting this, you can ignore this email.</p>
      </div>
    `,
  });
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
