import { transporter } from '../config/email.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Send a generic email.
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Crime Diaries" <${env.EMAIL_FROM}>`,
      to,
      subject,
      html,
      text,
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`Email failed for ${to}: ${err.message}`);
    throw err;
  }
};

/**
 * Send email verification link.
 */
export const sendVerificationEmail = async (user, token) => {
  const link = `${env.CLIENT_URL}/verify-email?token=${token}`;
  return sendEmail({
    to: user.email,
    subject: 'Verify your Crime Diaries account',
    html: `
      <h2>Welcome to Crime Diaries, ${user.username}!</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${link}" style="background:#7c3aed;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
        Verify Email
      </a>
      <p>This link expires in 24 hours.</p>
    `,
    text: `Verify your email: ${link}`,
  });
};

/**
 * Send password reset email.
 */
export const sendPasswordResetEmail = async (user, token) => {
  const link = `${env.CLIENT_URL}/reset-password?token=${token}`;
  return sendEmail({
    to: user.email,
    subject: 'Reset your Crime Diaries password',
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${link}" style="background:#dc2626;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
        Reset Password
      </a>
      <p>If you didn't request this, ignore this email.</p>
    `,
    text: `Reset your password: ${link}`,
  });
};
