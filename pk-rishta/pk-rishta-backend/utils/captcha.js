const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'hum-rishta-dev-only-secret-not-for-production';
const CAPTCHA_TTL_SEC = 5 * 60;

function hashAnswer(answer) {
  return crypto
    .createHash('sha256')
    .update(`hr-captcha:${String(answer).trim().toLowerCase()}`)
    .digest('hex');
}

function createCaptchaChallenge() {
  let a = 3 + Math.floor(Math.random() * 9);
  let b = 2 + Math.floor(Math.random() * 8);
  const useMinus = Math.random() > 0.5;
  if (useMinus && a < b) {
    const swap = a;
    a = b;
    b = swap;
  }
  const op = useMinus ? '−' : '+';
  const answer = useMinus ? a - b : a + b;
  const question = `${a} ${op} ${b}`;
  const token = jwt.sign(
    {
      typ: 'login_captcha',
      h: hashAnswer(String(answer)),
    },
    JWT_SECRET,
    { expiresIn: CAPTCHA_TTL_SEC }
  );

  return {
    captcha_token: token,
    question,
    expires_in: CAPTCHA_TTL_SEC,
  };
}

function verifyCaptcha(token, answer) {
  if (!token || answer === undefined || answer === null || String(answer).trim() === '') {
    return { ok: false, message: 'Please solve the security check' };
  }
  try {
    const payload = jwt.verify(String(token), JWT_SECRET);
    if (payload.typ !== 'login_captcha' || !payload.h) {
      return { ok: false, message: 'Invalid security check. Please refresh.' };
    }
    if (payload.h !== hashAnswer(String(answer))) {
      return { ok: false, message: 'Incorrect security answer. Try again.' };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: 'Security check expired. Please refresh and try again.' };
  }
}

module.exports = {
  createCaptchaChallenge,
  verifyCaptcha,
};
