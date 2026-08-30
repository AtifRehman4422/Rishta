const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PK_PHONE_RE = /^(\+92|0)?3[0-9]{2}[\s-]?[0-9]{7}$/;
const INTL_PHONE_RE = /^\+[1-9]\d{7,14}$/;

function normalizePhone(value) {
  return String(value || '').replace(/[\s()-]/g, '');
}

function validateEmail(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return 'Email is required';
  if (!EMAIL_RE.test(trimmed)) return 'Enter a valid email address';
  return null;
}

function validatePhone(value, required = false) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return required ? 'Phone number is required' : null;
  const normalized = normalizePhone(trimmed);
  if (PK_PHONE_RE.test(normalized) || INTL_PHONE_RE.test(normalized)) return null;
  return 'Enter a valid number (e.g. +92 300 1234567 or 03001234567)';
}

module.exports = { validateEmail, validatePhone, normalizePhone };
