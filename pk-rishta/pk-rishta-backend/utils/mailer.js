const nodemailer = require('nodemailer');
const { isProduction } = require('../middleware/security');

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || 'PK Rishta <noreply@pkrishta.com>';

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  if (!SMTP_USER || !SMTP_PASS) {
    return null;
  }
  transporter = nodemailer.createTransport({
    service: 'gmail',
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
  return transporter;
}

function smtpHelpMessage(errMessage) {
  if (/Application-specific password|Invalid login|535|534/i.test(errMessage || '')) {
    return (
      'Gmail ne login reject kiya. Account pe 2-Step Verification on karke ' +
      'App Password banayein, phir .env mein SMTP_PASS update karein. ' +
      '(Google Account → Security → App passwords)'
    );
  }
  return errMessage || 'Email send failed';
}

async function sendMail({ to, subject, text, html }) {
  const tx = getTransporter();
  if (!tx) {
    const msg = 'Email service is not configured (SMTP_USER / SMTP_PASS missing in .env)';
    if (!isProduction) {
      console.warn(`[mailer] ${msg}\nWould send to ${to}:\n${text}`);
    }
    const err = new Error(msg);
    err.status = 503;
    throw err;
  }

  try {
    const info = await tx.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      text,
      html,
    });
    console.log(`[mailer] sent to ${to} id=${info.messageId || 'n/a'}`);
    return { queued: true, messageId: info.messageId };
  } catch (err) {
    console.error('[mailer] send failed:', err.message);
    if (!isProduction) {
      console.warn(`[mailer] OTP email body (not delivered) for ${to}:\n${text}`);
    }
    const wrapped = new Error(smtpHelpMessage(err.message));
    wrapped.status = 503;
    wrapped.cause = err;
    throw wrapped;
  }
}

async function sendOtpEmail({ to, code, purpose }) {
  const isReset = purpose === 'password_reset';
  const title = isReset ? 'Password Reset OTP' : 'Email Verification OTP';
  const action = isReset
    ? 'Use this code to reset your PK Rishta password.'
    : 'Use this code to verify your PK Rishta account.';

  const text = [
    `PK Rishta — ${title}`,
    '',
    action,
    '',
    `Your OTP: ${code}`,
    '',
    'This code expires in 10 minutes.',
    'If you did not request this, you can ignore this email.',
  ].join('\n');

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#fff8f3;border:1px solid #f0ddd0;border-radius:16px;">
      <h2 style="color:#9B1B30;margin:0 0 8px;">PK Rishta</h2>
      <p style="color:#2D1B1B;font-size:16px;margin:0 0 16px;"><strong>${title}</strong></p>
      <p style="color:#7A6363;margin:0 0 20px;">${action}</p>
      <div style="letter-spacing:8px;font-size:28px;font-weight:700;color:#9B1B30;background:#fff;border:1px dashed #D4AF37;border-radius:12px;padding:16px;text-align:center;">
        ${code}
      </div>
      <p style="color:#7A6363;font-size:13px;margin:20px 0 0;">This code expires in 10 minutes. Do not share it with anyone.</p>
    </div>
  `;

  return sendMail({ to, subject: `PK Rishta — ${title}`, text, html });
}

module.exports = { sendMail, sendOtpEmail, smtpHelpMessage };
