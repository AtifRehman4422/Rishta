const pool = require('../db');
const { isProduction } = require('../middleware/security');

const ALLOWED_SUBJECTS = new Set([
  'general',
  'registration',
  'contact-request',
  'complaint',
  'partnership',
  'option-request',
]);

function validateContactPayload(body) {
  const name = body?.name?.trim();
  const email = body?.email?.trim().toLowerCase();
  const subject = body?.subject?.trim();
  const message = body?.message?.trim();

  if (!name || name.length < 2) {
    return 'Please enter your name';
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Please enter a valid email';
  }
  if (!subject || !ALLOWED_SUBJECTS.has(subject)) {
    return 'Please select a valid subject';
  }
  if (!message || message.length < 10) {
    return 'Message must be at least 10 characters';
  }
  if (message.length > 5000) {
    return 'Message is too long';
  }
  return null;
}

async function submitContactMessage(req, res) {
  try {
    const error = validateContactPayload(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const { name, email, subject, message } = req.body;
    const result = await pool.query(
      `INSERT INTO contact_form_messages (name, email, subject, message)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, subject, message, status, created_at`,
      [name.trim(), email.trim().toLowerCase(), subject.trim(), message.trim()]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Message received. We will respond within 24 hours.',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: isProduction ? 'Failed to send message' : err.message,
    });
  }
}

module.exports = { submitContactMessage };
