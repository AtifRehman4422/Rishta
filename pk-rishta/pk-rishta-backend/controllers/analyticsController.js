const crypto = require('crypto');
const pool = require('../db');
const { isProduction } = require('../middleware/security');
const { pakistanToday } = require('./visitController');

function normalizeVisitorKey(raw) {
  const value = String(raw || '').trim().slice(0, 80);
  if (!value || value.length < 8) return null;
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 64);
}

/** Admin APIs pass already-hashed keys from the DB — do not hash twice. */
function resolveStoredVisitorKey(raw) {
  const value = String(raw || '').trim();
  if (/^[a-f0-9]{64}$/i.test(value)) return value.toLowerCase();
  return normalizeVisitorKey(raw);
}

function parseDateParam(value, fallback) {
  const raw = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return fallback;
}

function daysBetween(a, b) {
  const ms = new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime();
  return Math.round(ms / 86400000);
}

function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function summarizeFilters(payload) {
  if (!payload || typeof payload !== 'object') return 'Search';
  const parts = [];
  const map = {
    gender: 'Gender',
    city: 'City',
    province: 'Province',
    country: 'Country',
    marital_status: 'Marital',
    religion: 'Religion',
    education: 'Education',
    min_age: 'Min age',
    max_age: 'Max age',
    matching: 'Matching',
  };
  for (const [key, label] of Object.entries(map)) {
    const val = payload[key];
    if (val === undefined || val === null || val === '' || val === false) continue;
    parts.push(`${label}: ${val}`);
  }
  if (payload.result_count != null) parts.push(`Results: ${payload.result_count}`);
  return parts.length ? parts.join(' · ') : 'Open search (no filters)';
}

async function trackActivity(req, res) {
  try {
    const visitorKey = normalizeVisitorKey(req.body?.visitor_key);
    if (!visitorKey) {
      return res.status(400).json({ success: false, message: 'visitor_key required' });
    }

    const eventType = String(req.body?.event_type || '').trim();
    if (!['search', 'profile_view'].includes(eventType)) {
      return res.status(400).json({ success: false, message: 'Invalid event_type' });
    }

    const path = String(req.body?.path || '/').trim().slice(0, 200) || '/';
    const payload = req.body?.payload && typeof req.body.payload === 'object'
      ? req.body.payload
      : {};
    const userId = req.user?.id || null;
    const id = crypto.randomUUID();

    await pool.query(
      `INSERT INTO user_activity_events (id, visitor_key, user_id, event_type, payload, path)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, visitorKey, userId, eventType, JSON.stringify(payload), path]
    );

    res.json({ success: true, data: { id } });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: isProduction ? 'Failed to track activity' : err.message,
    });
  }
}

async function getVisitorAnalytics(req, res) {
  try {
    const today = pakistanToday();
    const to = parseDateParam(req.query.to, today);
    const fromDefault = addDays(to, -13);
    const from = parseDateParam(req.query.from, fromDefault);
    if (from > to) {
      return res.status(400).json({ success: false, message: 'from date must be before to date' });
    }

    const dailyResult = await pool.query(
      `SELECT visit_date, COUNT(*) AS visitors, COALESCE(SUM(page_views), 0) AS page_views
       FROM site_visitors_daily
       WHERE visit_date BETWEEN $1 AND $2
       GROUP BY visit_date
       ORDER BY visit_date ASC`,
      [from, to]
    );

    const dailyMap = new Map(
      dailyResult.rows.map((r) => [
        String(r.visit_date).slice(0, 10),
        { visitors: Number(r.visitors || 0), page_views: Number(r.page_views || 0) },
      ])
    );

    const daily = [];
    for (let d = from; d <= to; d = addDays(d, 1)) {
      const row = dailyMap.get(d) || { visitors: 0, page_views: 0 };
      daily.push({ date: d, visitors: row.visitors, page_views: row.page_views });
    }

    // Include history before `from` so we can compute return gaps correctly.
    const lookback = addDays(from, -60);
    const visitsResult = await pool.query(
      `SELECT visitor_key, visit_date
       FROM site_visitors_daily
       WHERE visit_date BETWEEN $1 AND $2
       ORDER BY visitor_key ASC, visit_date ASC`,
      [lookback, to]
    );

    const byVisitor = new Map();
    for (const row of visitsResult.rows) {
      const key = row.visitor_key;
      const date = String(row.visit_date).slice(0, 10);
      if (!byVisitor.has(key)) byVisitor.set(key, []);
      byVisitor.get(key).push(date);
    }

    const gaps = {
      new: 0,
      daily: 0,
      skip_1: 0,
      skip_2: 0,
      skip_3: 0,
      skip_4_plus: 0,
    };

    for (const dates of byVisitor.values()) {
      for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        if (date < from || date > to) continue;
        if (i === 0) {
          gaps.new += 1;
          continue;
        }
        const gap = daysBetween(dates[i - 1], date) - 1;
        if (gap <= 0) gaps.daily += 1;
        else if (gap === 1) gaps.skip_1 += 1;
        else if (gap === 2) gaps.skip_2 += 1;
        else if (gap === 3) gaps.skip_3 += 1;
        else gaps.skip_4_plus += 1;
      }
    }

    const totalVisitors = daily.reduce((sum, d) => sum + d.visitors, 0);
    const totalPageViews = daily.reduce((sum, d) => sum + d.page_views, 0);

    res.json({
      success: true,
      data: {
        from,
        to,
        total_visitors: totalVisitors,
        total_page_views: totalPageViews,
        daily,
        return_gaps: gaps,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

function classifyGap(prevDate, currentDate) {
  if (!prevDate) return 'new';
  const gap = daysBetween(prevDate, currentDate) - 1;
  if (gap <= 0) return 'daily';
  if (gap === 1) return 'skip_1';
  if (gap === 2) return 'skip_2';
  if (gap === 3) return 'skip_3';
  return 'skip_4_plus';
}

async function getGapVisitors(req, res) {
  try {
    const today = pakistanToday();
    const to = parseDateParam(req.query.to, today);
    const from = parseDateParam(req.query.from, addDays(to, -13));
    const gapType = String(req.query.gap || '').trim();
    const allowed = new Set(['new', 'daily', 'skip_1', 'skip_2', 'skip_3', 'skip_4_plus']);
    if (!allowed.has(gapType)) {
      return res.status(400).json({ success: false, message: 'Invalid gap type' });
    }
    if (from > to) {
      return res.status(400).json({ success: false, message: 'from date must be before to date' });
    }

    const lookback = addDays(from, -60);
    const visitsResult = await pool.query(
      `SELECT visitor_key, visit_date, user_id, page_views, last_path, last_seen_at
       FROM site_visitors_daily
       WHERE visit_date BETWEEN $1 AND $2
       ORDER BY visitor_key ASC, visit_date ASC`,
      [lookback, to]
    );

    const byVisitor = new Map();
    for (const row of visitsResult.rows) {
      const key = row.visitor_key;
      if (!byVisitor.has(key)) byVisitor.set(key, []);
      byVisitor.get(key).push(row);
    }

    const matchedKeys = new Map();
    for (const [key, rows] of byVisitor.entries()) {
      for (let i = 0; i < rows.length; i++) {
        const date = String(rows[i].visit_date).slice(0, 10);
        if (date < from || date > to) continue;
        const prev = i === 0 ? null : String(rows[i - 1].visit_date).slice(0, 10);
        if (classifyGap(prev, date) !== gapType) continue;
        const existing = matchedKeys.get(key);
        if (!existing || String(rows[i].last_seen_at) > String(existing.last_seen_at || '')) {
          matchedKeys.set(key, rows[i]);
        }
      }
    }

    const keys = [...matchedKeys.keys()];
    if (!keys.length) {
      return res.json({
        success: true,
        data: { from, to, gap: gapType, visitors: [] },
      });
    }

    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const usersResult = await pool.query(
      `SELECT
         v.visitor_key,
         MAX(v.user_id) AS user_id,
         SUM(v.page_views) AS page_views,
         MAX(v.last_path) AS last_path,
         MAX(v.last_seen_at) AS last_seen_at,
         MAX(u.email) AS email,
         MAX(p.id) AS profile_id,
         MAX(p.first_name) AS first_name,
         MAX(p.last_name) AS last_name
       FROM site_visitors_daily v
       LEFT JOIN users u ON u.id = v.user_id
       LEFT JOIN profiles p ON p.user_id = v.user_id
       WHERE v.visitor_key IN (${placeholders})
         AND v.visit_date BETWEEN $${keys.length + 1} AND $${keys.length + 2}
       GROUP BY v.visitor_key
       ORDER BY MAX(v.last_seen_at) DESC`,
      [...keys, from, to]
    );

    const activityPlaceholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const activityResult = await pool.query(
      `SELECT visitor_key, event_type, COUNT(*) AS cnt
       FROM user_activity_events
       WHERE visitor_key IN (${activityPlaceholders})
         AND created_at >= $${keys.length + 1}
         AND created_at < DATE_ADD($${keys.length + 2}, INTERVAL 1 DAY)
       GROUP BY visitor_key, event_type`,
      [...keys, from, to]
    );
    const activityMap = new Map();
    for (const row of activityResult.rows) {
      if (!activityMap.has(row.visitor_key)) {
        activityMap.set(row.visitor_key, { searches_count: 0, profile_views_count: 0 });
      }
      const bucket = activityMap.get(row.visitor_key);
      if (row.event_type === 'search') bucket.searches_count = Number(row.cnt || 0);
      if (row.event_type === 'profile_view') bucket.profile_views_count = Number(row.cnt || 0);
    }

    res.json({
      success: true,
      data: {
        from,
        to,
        gap: gapType,
        visitors: usersResult.rows.map((r) => {
          const activity = activityMap.get(r.visitor_key) || { searches_count: 0, profile_views_count: 0 };
          return {
            visitor_key: r.visitor_key,
            user_id: r.user_id,
            email: r.email,
            profile_id: r.profile_id,
            first_name: r.first_name,
            last_name: r.last_name,
            page_views: Number(r.page_views || 0),
            last_path: r.last_path,
            last_seen_at: r.last_seen_at,
            searches_count: activity.searches_count,
            profile_views_count: activity.profile_views_count,
            display_name: r.first_name
              ? `${r.first_name}${r.last_name ? ` ${r.last_name}` : ''}`
              : (r.email || `Guest · ${String(r.visitor_key).slice(0, 8)}`),
          };
        }),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getDayVisitors(req, res) {
  try {
    const date = parseDateParam(req.query.date, pakistanToday());
    const result = await pool.query(
      `SELECT
         v.visitor_key,
         v.user_id,
         v.page_views,
         v.last_path,
         v.first_seen_at,
         v.last_seen_at,
         u.email,
         p.id AS profile_id,
         p.first_name,
         p.last_name,
         (
           SELECT COUNT(*) FROM user_activity_events e
           WHERE e.visitor_key = v.visitor_key
             AND e.event_type = 'search'
             AND DATE(e.created_at) = v.visit_date
         ) AS searches_count,
         (
           SELECT COUNT(*) FROM user_activity_events e
           WHERE e.visitor_key = v.visitor_key
             AND e.event_type = 'profile_view'
             AND DATE(e.created_at) = v.visit_date
         ) AS profile_views_count
       FROM site_visitors_daily v
       LEFT JOIN users u ON u.id = v.user_id
       LEFT JOIN profiles p ON p.user_id = v.user_id
       WHERE v.visit_date = $1
       ORDER BY v.last_seen_at DESC`,
      [date]
    );

    res.json({
      success: true,
      data: {
        date,
        visitors: result.rows.map((r) => ({
          visitor_key: r.visitor_key,
          user_id: r.user_id,
          email: r.email,
          profile_id: r.profile_id,
          first_name: r.first_name,
          last_name: r.last_name,
          page_views: Number(r.page_views || 0),
          last_path: r.last_path,
          first_seen_at: r.first_seen_at,
          last_seen_at: r.last_seen_at,
          searches_count: Number(r.searches_count || 0),
          profile_views_count: Number(r.profile_views_count || 0),
          display_name: r.first_name
            ? `${r.first_name}${r.last_name ? ` ${r.last_name}` : ''}`
            : (r.email || `Guest · ${String(r.visitor_key).slice(0, 8)}`),
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getVisitorDetail(req, res) {
  try {
    const visitorKey = resolveStoredVisitorKey(req.query.visitor_key);
    if (!visitorKey) {
      return res.status(400).json({ success: false, message: 'visitor_key required' });
    }

    const today = pakistanToday();
    const to = parseDateParam(req.query.to, today);
    const from = parseDateParam(req.query.from, addDays(to, -29));

    const metaResult = await pool.query(
      `SELECT
         v.visitor_key,
         MAX(v.user_id) AS user_id,
         SUM(v.page_views) AS page_views,
         MIN(v.visit_date) AS first_visit,
         MAX(v.visit_date) AS last_visit,
         COUNT(*) AS visit_days
       FROM site_visitors_daily v
       WHERE v.visitor_key = $1 AND v.visit_date BETWEEN $2 AND $3
       GROUP BY v.visitor_key`,
      [visitorKey, from, to]
    );

    const userId = metaResult.rows[0]?.user_id || null;
    let userInfo = null;
    if (userId) {
      const userResult = await pool.query(
        `SELECT u.id, u.email, p.id AS profile_id, p.first_name, p.last_name, p.gender, p.city
         FROM users u
         LEFT JOIN profiles p ON p.user_id = u.id
         WHERE u.id = $1`,
        [userId]
      );
      userInfo = userResult.rows[0] || null;
    }

    const eventsResult = await pool.query(
      `SELECT id, event_type, payload, path, created_at, user_id
       FROM user_activity_events
       WHERE visitor_key = $1
         AND created_at >= $2
         AND created_at < DATE_ADD($3, INTERVAL 1 DAY)
       ORDER BY created_at DESC
       LIMIT 300`,
      [visitorKey, from, to]
    );

    const profileIds = [];
    for (const row of eventsResult.rows) {
      let payload = row.payload;
      if (typeof payload === 'string') {
        try { payload = JSON.parse(payload); } catch { payload = {}; }
      }
      row.payload = payload || {};
      if (row.event_type === 'profile_view' && row.payload.profile_id) {
        profileIds.push(row.payload.profile_id);
      }
    }

    const profileMap = new Map();
    if (profileIds.length) {
      const uniqueIds = [...new Set(profileIds)];
      const placeholders = uniqueIds.map((_, i) => `$${i + 1}`).join(', ');
      const profiles = await pool.query(
        `SELECT id, first_name, last_name, gender, city, province
         FROM profiles WHERE id IN (${placeholders})`,
        uniqueIds
      );
      for (const p of profiles.rows) profileMap.set(p.id, p);
    }

    const searches = [];
    const profileViews = [];
    for (const row of eventsResult.rows) {
      if (row.event_type === 'search') {
        searches.push({
          id: row.id,
          created_at: row.created_at,
          path: row.path,
          summary: summarizeFilters(row.payload),
          filters: row.payload,
        });
      } else if (row.event_type === 'profile_view') {
        const pid = row.payload.profile_id;
        const p = profileMap.get(pid);
        profileViews.push({
          id: row.id,
          created_at: row.created_at,
          profile_id: pid,
          first_name: p?.first_name || row.payload.first_name || 'Profile',
          last_name: p?.last_name || row.payload.last_name || '',
          gender: p?.gender || row.payload.gender || null,
          city: p?.city || row.payload.city || null,
          province: p?.province || null,
        });
      }
    }

    const visitDays = await pool.query(
      `SELECT visit_date, page_views, last_path, first_seen_at, last_seen_at
       FROM site_visitors_daily
       WHERE visitor_key = $1 AND visit_date BETWEEN $2 AND $3
       ORDER BY visit_date DESC`,
      [visitorKey, from, to]
    );

    res.json({
      success: true,
      data: {
        from,
        to,
        visitor_key: visitorKey,
        meta: metaResult.rows[0] || null,
        user: userInfo,
        visit_days: visitDays.rows,
        searches,
        profile_views: profileViews,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  trackActivity,
  getVisitorAnalytics,
  getGapVisitors,
  getDayVisitors,
  getVisitorDetail,
};
