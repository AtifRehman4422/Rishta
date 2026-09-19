const pool = require('../db');
const { addComplaintMessage, attachMessagesToComplaints } = require('../utils/complaintMessages');
const { createNotification, getUserIdByProfileId } = require('../utils/notifications');
const { pakistanToday } = require('./visitController');
const { sendMail } = require('../utils/mailer');

async function getDashboardStats(req, res) {
  try {
    const today = pakistanToday();
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'user') as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'user' AND is_active = true) as active_users,
        (SELECT COUNT(*) FROM users WHERE role = 'user' AND is_active = false) as inactive_users,
        (SELECT COUNT(*) FROM profiles) as total_profiles,
        (SELECT COUNT(*) FROM profiles WHERE is_verified = true) as verified_profiles,
        (SELECT COUNT(*) FROM profiles WHERE is_verified = false) as unverified_profiles,
        (SELECT COUNT(*) FROM contact_access_requests) as total_contact_requests,
        (SELECT COUNT(*) FROM contact_access_requests WHERE status = 'pending') as pending_contact_requests,
        (SELECT COUNT(*) FROM complaints WHERE status = 'pending') as pending_complaints,
        (SELECT COUNT(*) FROM contact_form_messages WHERE status = 'new') as new_contact_messages,
        (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_week,
        (SELECT COUNT(*) FROM site_visitors_daily WHERE visit_date = $1) as visitors_today,
        (SELECT COALESCE(SUM(page_views), 0) FROM site_visitors_daily WHERE visit_date = $1) as page_views_today,
        (SELECT COUNT(*) FROM site_visitors_daily WHERE visit_date = DATE_SUB($1, INTERVAL 1 DAY)) as visitors_yesterday
    `, [today]);
    res.json({ success: true, data: { ...result.rows[0], visit_date: today } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getAllUsers(req, res) {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const conditions = ["u.role = 'user'"];
    const params = [];
    let idx = 1;

    if (search) {
      conditions.push(`(u.email ILIKE $${idx} OR p.first_name ILIKE $${idx} OR p.last_name ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (status === 'active') conditions.push('u.is_active = true');
    if (status === 'inactive') conditions.push('u.is_active = false');

    const where = `WHERE ${conditions.join(' AND ')}`;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM users u LEFT JOIN profiles p ON p.user_id = u.id ${where}`,
      params
    );

    params.push(parseInt(limit), offset);
    const result = await pool.query(
      `SELECT u.id, u.email, u.phone, u.is_active, u.is_verified, u.last_login, u.created_at,
              p.id as profile_id, p.first_name, p.last_name, p.gender, p.city, p.province, p.country,
              p.is_profile_complete, p.is_verified as profile_verified
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       ${where}
       ORDER BY u.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      params
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function toggleUserStatus(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE users SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = $1 AND role = 'user' RETURNING id, email, is_active`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await pool.query(
      `INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
       VALUES ($1, 'toggle_user_status', 'user', $2, $3)`,
      [req.user.id, id, JSON.stringify({ is_active: result.rows[0].is_active })]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getAllProfiles(req, res) {
  try {
    const { page = 1, limit = 20, verified, search } = req.query;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (verified === 'true') conditions.push('p.is_verified = true');
    if (verified === 'false') conditions.push('p.is_verified = false');
    if (search) {
      conditions.push(
        `(u.email ILIKE $${idx} OR p.first_name ILIKE $${idx} OR p.last_name ILIKE $${idx} OR p.city ILIKE $${idx})`
      );
      params.push(`%${search}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM profiles p JOIN users u ON u.id = p.user_id ${where}`,
      params
    );
    params.push(parseInt(limit), offset);

    const result = await pool.query(
      `SELECT p.*, u.email, u.is_active,
              EXTRACT(YEAR FROM AGE(p.date_of_birth))::int as age
       FROM profiles p JOIN users u ON u.id = p.user_id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      params
    );

    const total = parseInt(countResult.rows[0].count, 10);
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.max(1, Math.ceil(total / limitNum)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function verifyProfile(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE profiles
       SET is_verified = true, visibility = 'public', updated_at = NOW()
       WHERE id = $1
       RETURNING id, first_name, last_name, is_verified, visibility`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    await pool.query(
      `INSERT INTO admin_logs (admin_id, action, target_type, target_id) VALUES ($1, 'verify_profile', 'profile', $2)`,
      [req.user.id, id]
    );

    res.json({ success: true, data: result.rows[0], message: 'Profile verified' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function rateProfile(req, res) {
  try {
    const { id } = req.params;
    const raw = req.body?.rating;
    const rating = raw === null || raw === undefined || raw === '' ? null : parseInt(raw, 10);
    if (rating !== null && (Number.isNaN(rating) || rating < 1 || rating > 5)) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const result = await pool.query(
      `UPDATE profiles SET admin_rating = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, first_name, last_name, is_verified, admin_rating`,
      [rating, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    await pool.query(
      `INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
       VALUES ($1, 'rate_profile', 'profile', $2, $3)`,
      [req.user.id, id, JSON.stringify({ admin_rating: rating })]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: rating ? `Rating set to ${rating}/5` : 'Rating cleared',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

const DEFAULT_REQUEST_LIMIT = parseInt(process.env.CONTACT_REQUEST_PENDING_LIMIT || '3', 10);
const MAX_REQUEST_LIMIT = 30;

async function setContactRequestLimit(req, res) {
  try {
    const { id } = req.params;
    const raw = req.body?.limit;
    let limit = raw === null || raw === undefined || raw === '' ? null : parseInt(raw, 10);
    if (limit !== null && (Number.isNaN(limit) || limit < DEFAULT_REQUEST_LIMIT || limit > MAX_REQUEST_LIMIT)) {
      return res.status(400).json({
        success: false,
        message: `Limit must be between ${DEFAULT_REQUEST_LIMIT} and ${MAX_REQUEST_LIMIT}`,
      });
    }
    if (limit === DEFAULT_REQUEST_LIMIT) limit = null;

    const result = await pool.query(
      `UPDATE profiles SET contact_request_limit = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, user_id, first_name, last_name, contact_request_limit`,
      [limit, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const row = result.rows[0];
    const effective = row.contact_request_limit || DEFAULT_REQUEST_LIMIT;

    await pool.query(
      `INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
       VALUES ($1, 'set_request_limit', 'profile', $2, $3)`,
      [req.user.id, id, JSON.stringify({ contact_request_limit: effective })]
    );

    await createNotification({
      userId: row.user_id,
      type: 'contact_request_limit',
      title: effective > DEFAULT_REQUEST_LIMIT ? 'More contact requests allowed' : 'Contact request limit updated',
      body: effective > DEFAULT_REQUEST_LIMIT
        ? `You can now keep up to ${effective} pending contact requests.`
        : `Your pending contact request limit is ${DEFAULT_REQUEST_LIMIT}.`,
      link: '/dashboard',
      relatedId: row.id,
    });

    res.json({
      success: true,
      data: {
        id: row.id,
        first_name: row.first_name,
        last_name: row.last_name,
        contact_request_limit: row.contact_request_limit,
      },
      message: `Request slots set to ${effective}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function deleteProfile(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `DELETE FROM profiles WHERE id = $1 RETURNING user_id, first_name, last_name`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [result.rows[0].user_id]);
    res.json({ success: true, message: 'Profile and user deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getContactRequests(req, res) {
  try {
    const { expireStalePendingRequests } = require('./contactRequestController');
    await expireStalePendingRequests();

    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (status) {
      conditions.push(`car.status = $${idx++}`);
      params.push(status);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM contact_access_requests car ${where}`,
      params
    );

    params.push(parseInt(limit), offset);
    const result = await pool.query(
      `SELECT car.*,
              rp.first_name AS requester_first_name, rp.last_name AS requester_last_name,
              rp.city AS requester_city, rp.gender AS requester_gender,
              EXTRACT(YEAR FROM AGE(rp.date_of_birth))::int AS requester_age,
              (SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT('type', pc.contact_type, 'number', pc.number)), JSON_ARRAY())
               FROM profile_contacts pc WHERE pc.profile_id = car.requester_profile_id) AS requester_contacts,
              tp.first_name AS target_first_name, tp.last_name AS target_last_name,
              tp.city AS target_city, tp.gender AS target_gender,
              EXTRACT(YEAR FROM AGE(tp.date_of_birth))::int AS target_age,
              (SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT('type', pc.contact_type, 'number', pc.number)), JSON_ARRAY())
               FROM profile_contacts pc WHERE pc.profile_id = car.target_profile_id) AS target_contacts
       FROM contact_access_requests car
       JOIN profiles rp ON rp.id = car.requester_profile_id
       JOIN profiles tp ON tp.id = car.target_profile_id
       ${where}
       ORDER BY car.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      params
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function reviewContactRequest(req, res) {
  try {
    const { id } = req.params;
    const { action, admin_message } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be approve or reject' });
    }

    if (action === 'reject' && !admin_message?.trim()) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const { applyContactDecision } = require('./contactRequestController');
    const outcome = await applyContactDecision({
      requestId: id,
      action,
      actorUserId: req.user.id,
      responseSource: 'admin',
      message: admin_message,
    });

    if (outcome.error) {
      return res.status(outcome.error.status).json({ success: false, message: outcome.error.message });
    }

    await pool.query(
      `INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
       VALUES ($1, $2, 'contact_access_request', $3, $4)`,
      [
        req.user.id,
        action === 'approve' ? 'approve_contact_request' : 'reject_contact_request',
        id,
        JSON.stringify({ admin_message: admin_message?.trim() || null }),
      ]
    );

    res.json({
      success: true,
      data: outcome.data,
      message: action === 'approve' ? 'Contact access approved for 2 days' : 'Request rejected',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getComplaints(req, res) {
  try {
    const { status = 'pending', page = 1, limit = 20, search } = req.query;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (status && status !== 'all') {
      conditions.push(`c.status = $${idx++}`);
      params.push(status);
    }
    if (search) {
      conditions.push(`(
        ru.email ILIKE $${idx} OR tu.email ILIKE $${idx}
        OR rep.first_name ILIKE $${idx} OR rep.last_name ILIKE $${idx}
        OR tar.first_name ILIKE $${idx} OR tar.last_name ILIKE $${idx}
      )`);
      params.push(`%${search}%`);
      idx++;
    }

    const fromClause = `
      FROM complaints c
      JOIN profiles rep ON rep.id = c.reporter_profile_id
      JOIN profiles tar ON tar.id = c.reported_profile_id
      JOIN users ru ON ru.id = rep.user_id
      JOIN users tu ON tu.id = tar.user_id`;

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countResult = await pool.query(`SELECT COUNT(*) ${fromClause} ${where}`, params);
    params.push(parseInt(limit), offset);

    const result = await pool.query(
      `SELECT c.*,
              rep.first_name AS reporter_first_name, rep.last_name AS reporter_last_name,
              rep.city AS reporter_city,
              ru.email AS reporter_email,
              tar.first_name AS reported_first_name, tar.last_name AS reported_last_name,
              tar.city AS reported_city,
              tu.email AS reported_email
       ${fromClause}
       ${where}
       ORDER BY c.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      params
    );

    const data = await attachMessagesToComplaints(result.rows);

    res.json({
      success: true,
      data,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function reviewComplaint(req, res) {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    if (!['resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be resolved or dismissed' });
    }

    const result = await pool.query(
      `UPDATE complaints SET
         status = $1,
         admin_notes = $2,
         reviewed_by = $3,
         reviewed_at = NOW(),
         updated_at = NOW()
       WHERE id = $4 AND status = 'pending' RETURNING *`,
      [status, admin_notes?.trim() || null, req.user.id, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Pending complaint not found' });
    }

    await pool.query(
      `INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
       VALUES ($1, 'review_complaint', 'complaint', $2, $3)`,
      [req.user.id, id, JSON.stringify({ status, admin_notes: admin_notes?.trim() || null })]
    );

    res.json({ success: true, data: result.rows[0], message: 'Complaint updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function sendComplaintMessage(req, res) {
  try {
    const { id } = req.params;
    const { message, recipient } = req.body;
    const recipientRole = recipient === 'reported' ? 'reported' : recipient === 'reporter' ? 'reporter' : null;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    if (!recipientRole) {
      return res.status(400).json({ success: false, message: 'Select who to chat with: reporter or reported user' });
    }

    const exists = await pool.query(
      `SELECT c.id, c.status, c.reporter_profile_id, c.reported_profile_id
       FROM complaints c WHERE c.id = $1`,
      [id]
    );
    if (!exists.rows.length) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (exists.rows[0].status === 'dismissed') {
      return res.status(400).json({ success: false, message: 'Complaint is closed' });
    }

    const saved = await addComplaintMessage(id, 'admin', req.user.id, message.trim(), recipientRole);

    const targetProfileId = recipientRole === 'reporter'
      ? exists.rows[0].reporter_profile_id
      : exists.rows[0].reported_profile_id;
    const targetUserId = await getUserIdByProfileId(targetProfileId);
    await createNotification({
      userId: targetUserId,
      type: 'complaint_message',
      title: 'Message from Hum Rishta Admin',
      body: recipientRole === 'reporter'
        ? 'Admin replied to your complaint. Open My Activity to continue the chat.'
        : 'Hum Rishta Admin sent you a private message. Open My Activity to reply.',
      link: '/dashboard',
      relatedId: id,
    });

    const who = recipientRole === 'reporter' ? 'the reporter' : 'the reported user';
    res.json({ success: true, data: saved, message: `Message sent to ${who} only` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getContactFormMessages(req, res) {
  try {
    const { status = 'new', page = 1, limit = 20, search } = req.query;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (status) {
      conditions.push(`status = $${idx++}`);
      params.push(status);
    }
    if (search) {
      conditions.push(`(name ILIKE $${idx} OR email ILIKE $${idx} OR message ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM contact_form_messages ${where}`,
      params
    );
    params.push(parseInt(limit), offset);

    const result = await pool.query(
      `SELECT id, name, email, subject, message, status, admin_notes, created_at, updated_at
       FROM contact_form_messages
       ${where}
       ORDER BY created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      params
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function updateContactFormMessage(req, res) {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    const allowed = ['new', 'read', 'replied', 'archived'];
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const fields = [];
    const params = [];
    let idx = 1;

    if (status) {
      fields.push(`status = $${idx++}`);
      params.push(status);
    }
    if (admin_notes !== undefined) {
      fields.push(`admin_notes = $${idx++}`);
      params.push(admin_notes?.trim() || null);
    }

    if (!fields.length) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }

    fields.push('updated_at = NOW()');
    params.push(id);

    const result = await pool.query(
      `UPDATE contact_form_messages SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Message updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function replyContactFormMessage(req, res) {
  try {
    const { id } = req.params;
    const body = String(req.body?.message || '').trim();
    if (body.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Type a reply of at least 5 characters',
      });
    }

    const existing = await pool.query(
      `SELECT id, name, email, subject, message, admin_notes
       FROM contact_form_messages WHERE id = $1`,
      [id]
    );
    if (!existing.rows.length) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const row = existing.rows[0];
    const subjectLabel = row.subject || 'your message';
    await sendMail({
      to: row.email,
      subject: `Re: ${subjectLabel} — Hum Rishta`,
      text: `Dear ${row.name},\n\n${body}\n\n— Hum Rishta Admin\nhttps://humrishta.com`,
      html: `
        <div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#fff8f3;border:1px solid #f0ddd0;border-radius:16px;">
          <h2 style="color:#9B1B30;margin:0 0 12px;">Hum Rishta</h2>
          <p style="color:#2D1B1B;">Dear ${row.name},</p>
          <p style="color:#2D1B1B;white-space:pre-wrap;line-height:1.6;">${body.replace(/</g, '&lt;')}</p>
          <p style="color:#7A6363;margin-top:24px;">— Hum Rishta Admin</p>
        </div>
      `,
    });

    const stamp = new Date().toISOString();
    const notes = [row.admin_notes, req.body?.admin_notes, `Replied by email (${stamp}):\n${body}`]
      .map((v) => String(v || '').trim())
      .filter(Boolean)
      .join('\n\n');

    const result = await pool.query(
      `UPDATE contact_form_messages
       SET status = 'replied', admin_notes = $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [notes || null, id]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: `Reply sent to ${row.email}`,
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getDashboardStats, getAllUsers, toggleUserStatus,
  getAllProfiles, verifyProfile, rateProfile, setContactRequestLimit, deleteProfile,
  getContactRequests, reviewContactRequest, getComplaints, reviewComplaint, sendComplaintMessage,
  getContactFormMessages, updateContactFormMessage, replyContactFormMessage,
};
