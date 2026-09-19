const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { sendOtpEmail } = require('./mailer');

const OTP_TTL_MINUTES = parseInt(process.env.OTP_TTL_MINUTES || '10', 10);
const OTP_RESEND_SECONDS = parseInt(process.env.OTP_RESEND_SECONDS || '240', 10); // 4 minutes
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10);

function generateOtpCode() {
  return String(crypto.randomInt(100000, 1000000));
}

async function getLatestActiveOtp(email, purpose) {
  const result = await pool.query(
    `SELECT * FROM auth_otps
     WHERE email = $1 AND purpose = $2 AND consumed_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [email.toLowerCase(), purpose]
  );
  return result.rows[0] || null;
}

function secondsUntilResend(otpRow) {
  if (!otpRow) return 0;
  const elapsed = (Date.now() - new Date(otpRow.created_at).getTime()) / 1000;
  const remaining = Math.ceil(OTP_RESEND_SECONDS - elapsed);
  return remaining > 0 ? remaining : 0;
}

async function createAndSendOtp({ email, purpose, userId = null, force = false }) {
  const normalized = email.toLowerCase().trim();
  const latest = await getLatestActiveOtp(normalized, purpose);
  const wait = secondsUntilResend(latest);

  if (!force && wait > 0) {
    const err = new Error(`Please wait ${wait} seconds before requesting another OTP`);
    err.status = 429;
    err.resend_after_seconds = wait;
    throw err;
  }

  // Invalidate previous unused OTPs for this purpose
  await pool.query(
    `UPDATE auth_otps
     SET consumed_at = NOW()
     WHERE email = $1 AND purpose = $2 AND consumed_at IS NULL`,
    [normalized, purpose]
  );

  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await pool.query(
    `INSERT INTO auth_otps (user_id, email, purpose, code_hash, max_attempts, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, normalized, purpose, codeHash, OTP_MAX_ATTEMPTS, expiresAt]
  );

  await sendOtpEmail({ to: normalized, code, purpose });

  return {
    email: normalized,
    purpose,
    resend_after_seconds: OTP_RESEND_SECONDS,
    expires_in_seconds: OTP_TTL_MINUTES * 60,
  };
}

async function verifyOtp({ email, purpose, code }) {
  const normalized = email.toLowerCase().trim();
  const otp = await getLatestActiveOtp(normalized, purpose);

  if (!otp) {
    const err = new Error('No active OTP found. Please request a new one.');
    err.status = 400;
    throw err;
  }

  if (new Date(otp.expires_at).getTime() < Date.now()) {
    await pool.query('UPDATE auth_otps SET consumed_at = NOW() WHERE id = $1', [otp.id]);
    const err = new Error('OTP has expired. Please request a new one.');
    err.status = 400;
    throw err;
  }

  if (otp.attempts >= otp.max_attempts) {
    await pool.query('UPDATE auth_otps SET consumed_at = NOW() WHERE id = $1', [otp.id]);
    const err = new Error('Too many invalid attempts. Please request a new OTP.');
    err.status = 400;
    throw err;
  }

  const valid = await bcrypt.compare(String(code || '').trim(), otp.code_hash);
  if (!valid) {
    await pool.query('UPDATE auth_otps SET attempts = attempts + 1 WHERE id = $1', [otp.id]);
    const err = new Error('Invalid OTP code');
    err.status = 400;
    throw err;
  }

  await pool.query('UPDATE auth_otps SET consumed_at = NOW() WHERE id = $1', [otp.id]);
  return otp;
}

module.exports = {
  OTP_RESEND_SECONDS,
  OTP_TTL_MINUTES,
  createAndSendOtp,
  verifyOtp,
  secondsUntilResend,
  getLatestActiveOtp,
};
