const crypto = require('crypto');
const pool = require('../db');
const { isProduction } = require('../middleware/security');

function pakistanToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function normalizeVisitorKey(raw) {
  const value = String(raw || '').trim().slice(0, 80);
  if (!value || value.length < 8) return null;
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 64);
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

async function trackVisit(req, res) {
  try {
    const visitorKey = normalizeVisitorKey(req.body?.visitor_key);
    if (!visitorKey) {
      return res.status(400).json({ success: false, message: 'visitor_key required' });
    }

    const path = String(req.body?.path || '/').trim().slice(0, 200) || '/';
    const visitDate = pakistanToday();
    const userId = req.user?.id || null;

    // Fallback fingerprint soft-salt (not stored raw) — helps bot noise a bit
    const ipHint = crypto.createHash('sha256').update(getClientIp(req)).digest('hex').slice(0, 8);

    const result = await pool.query(
      `INSERT INTO site_visitors_daily (visit_date, visitor_key, user_id, page_views, last_path)
       VALUES ($1, $2, $3, 1, $4)
       ON CONFLICT (visit_date, visitor_key) DO UPDATE SET
         page_views = site_visitors_daily.page_views + 1,
         last_path = EXCLUDED.last_path,
         last_seen_at = NOW(),
         user_id = COALESCE(EXCLUDED.user_id, site_visitors_daily.user_id)
       RETURNING visit_date, page_views`,
      [visitDate, visitorKey, userId, path]
    );

    res.json({
      success: true,
      data: {
        visit_date: result.rows[0].visit_date,
        page_views: result.rows[0].page_views,
        ip_hint: ipHint,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: isProduction ? 'Failed to track visit' : err.message,
    });
  }
}

module.exports = { trackVisit, pakistanToday };
