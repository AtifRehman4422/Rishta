const pool = require('../db');
const { addComplaintMessage, attachMessagesToComplaints } = require('../utils/complaintMessages');
const { pakistanToday } = require('./visitController');

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
        (SELECT COUNT(*) FROM interests) as total_interests,
        (SELECT COUNT(*) FROM interests WHERE status = 'pending') as pending_interests,
        (SELECT COUNT(*) FROM contact_access_requests WHERE status = 'pending') as pending_contact_requests,
        (SELECT COUNT(*) FROM complaints WHERE status = 'pending') as pending_complaints,
        (SELECT COUNT(*) FROM contact_form_messages WHERE status = 'new') as new_contact_messages,
        (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_week,
        (SELECT COUNT(*) FROM site_visitors_daily WHERE visit_date = $1::date) as visitors_today,
        (SELECT COALESCE(SUM(page_views), 0) FROM site_visitors_daily WHERE visit_date = $1::date) as page_views_today,
        (SELECT COUNT(*) FROM site_visitors_daily WHERE visit_date = ($1::date - INTERVAL '1 day')) as visitors_yesterday
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
      `UPDATE profiles SET is_verified = true, updated_at = NOW() WHERE id = $1 RETURNING id, first_name, last_name, is_verified`,
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
              (SELECT COALESCE(json_agg(json_build_object('type', pc.contact_type, 'number', pc.number)
                ORDER BY pc.sort_order, pc.created_at), '[]'::json)
               FROM profile_contacts pc WHERE pc.profile_id = car.requester_profile_id) AS requester_contacts,
              tp.first_name AS target_first_name, tp.last_name AS target_last_name,
              tp.city AS target_city, tp.gender AS target_gender,
              EXTRACT(YEAR FROM AGE(tp.date_of_birth))::int AS target_age,
              (SELECT COALESCE(json_agg(json_build_object('type', pc.contact_type, 'number', pc.number)
                ORDER BY pc.sort_order, pc.created_at), '[]'::json)
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

    if (status) {
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

    if (admin_notes?.trim()) {
      await addComplaintMessage(id, 'admin', req.user.id, admin_notes.trim());
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
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const exists = await pool.query('SELECT id, status FROM complaints WHERE id = $1', [id]);
    if (!exists.rows.length) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (exists.rows[0].status === 'dismissed') {
      return res.status(400).json({ success: false, message: 'Complaint is closed' });
    }

    const saved = await addComplaintMessage(id, 'admin', req.user.id, message.trim());
    res.json({ success: true, data: saved, message: 'Message sent to both parties' });
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

module.exports = {
  getDashboardStats, getAllUsers, toggleUserStatus,
  getAllProfiles, verifyProfile, deleteProfile,
  getContactRequests, reviewContactRequest, getComplaints, reviewComplaint, sendComplaintMessage,
  getContactFormMessages, updateContactFormMessage,
};
