const pool = require('../db');
const { isProduction } = require('../middleware/security');
const { addComplaintMessage, attachMessagesToComplaints, sanitizeSupportComplaint } = require('../utils/complaintMessages');
const {
  createNotification,
  notifyAdmins,
  getUserIdByProfileId,
} = require('../utils/notifications');

const PENDING_REQUEST_LIMIT = parseInt(process.env.CONTACT_REQUEST_PENDING_LIMIT || '3', 10);
const PENDING_EXPIRE_DAYS = parseInt(process.env.CONTACT_REQUEST_PENDING_EXPIRE_DAYS || '2', 10);

async function getRequesterProfileId(userId) {
  const result = await pool.query('SELECT id FROM profiles WHERE user_id = $1', [userId]);
  return result.rows[0]?.id || null;
}

async function expireStalePendingRequests() {
  const expired = await pool.query(
    `UPDATE contact_access_requests
     SET status = 'expired',
         response_source = COALESCE(response_source, 'system'),
         admin_message = COALESCE(admin_message, 'No response within 2 days — request expired.'),
         reviewed_at = COALESCE(reviewed_at, NOW()),
         updated_at = NOW()
     WHERE status = 'pending'
       AND created_at < DATE_SUB(NOW(), INTERVAL ${PENDING_EXPIRE_DAYS} DAY)
     RETURNING id, requester_profile_id, target_profile_id`
  );

  for (const row of expired.rows) {
    const requesterUserId = await getUserIdByProfileId(row.requester_profile_id);
    await createNotification({
      userId: requesterUserId,
      type: 'contact_request_expired',
      title: 'Contact request expired',
      body: 'No response within 2 days. You can send a new request to someone else.',
      link: '/dashboard',
      relatedId: row.id,
    });
  }

  return expired.rows.length;
}

async function resolveRequestLimit(requesterProfileId) {
  const result = await pool.query(
    `SELECT contact_request_limit FROM profiles WHERE id = $1`,
    [requesterProfileId]
  );
  const custom = parseInt(result.rows[0]?.contact_request_limit, 10);
  if (Number.isFinite(custom) && custom >= 1) return Math.min(custom, 50);
  return PENDING_REQUEST_LIMIT;
}

async function getPendingQuota(requesterProfileId) {
  await expireStalePendingRequests();

  const result = await pool.query(
    `SELECT COUNT(*)::int AS used
     FROM contact_access_requests
     WHERE requester_profile_id = $1 AND status = 'pending'`,
    [requesterProfileId]
  );

  const used = result.rows[0]?.used || 0;
  const limit = await resolveRequestLimit(requesterProfileId);
  const remaining = Math.max(0, limit - used);

  return {
    pending_limit: limit,
    pending_used: used,
    pending_remaining: remaining,
    can_request: remaining > 0,
    // Back-compat fields used by older frontend
    daily_limit: limit,
    daily_used: used,
    daily_remaining: remaining,
    can_request_today: remaining > 0,
  };
}

async function applyContactDecision({
  requestId,
  action,
  actorUserId,
  responseSource,
  message,
}) {
  await expireStalePendingRequests();

  const pending = await pool.query(
    `SELECT car.*,
            rp.first_name AS requester_first_name, rp.last_name AS requester_last_name,
            tp.first_name AS target_first_name, tp.last_name AS target_last_name
     FROM contact_access_requests car
     JOIN profiles rp ON rp.id = car.requester_profile_id
     JOIN profiles tp ON tp.id = car.target_profile_id
     WHERE car.id = $1 AND car.status = 'pending'`,
    [requestId]
  );

  if (!pending.rows.length) {
    return { error: { status: 404, message: 'Pending request not found' } };
  }

  const request = pending.rows[0];
  const status = action === 'approve' ? 'approved' : 'rejected';
  const expiresAtSql = 'NULL';
  const note = message?.trim() || null;

  const result = await pool.query(
    `UPDATE contact_access_requests SET
       status = $1,
       admin_message = $2,
       reviewed_by = $3,
       response_source = $4,
       reviewed_at = NOW(),
       expires_at = ${expiresAtSql},
       updated_at = NOW()
     WHERE id = $5 RETURNING *`,
    [status, note, actorUserId, responseSource, requestId]
  );

  const requesterUserId = await getUserIdByProfileId(request.requester_profile_id);
  const targetName = `${request.target_first_name || ''} ${request.target_last_name || ''}`.trim();

  if (action === 'approve') {
    await createNotification({
      userId: requesterUserId,
      type: 'contact_request_approved',
      title: 'Contact request approved',
      body: `${targetName || 'The profile'} shared their contact number with you. You can both see each other's numbers until someone cancels.`,
      link: '/dashboard',
      relatedId: requestId,
    });

    const targetUserId = await getUserIdByProfileId(request.target_profile_id);
    const requesterName = `${request.requester_first_name || ''} ${request.requester_last_name || ''}`.trim();
    await createNotification({
      userId: targetUserId,
      type: 'contact_request_approved',
      title: 'Contact request accepted',
      body: `You shared your contact number with ${requesterName || 'the requester'}. You can both see each other's numbers until someone cancels.`,
      link: '/dashboard',
      relatedId: requestId,
    });
  } else {
    await createNotification({
      userId: requesterUserId,
      type: 'contact_request_rejected',
      title: 'Contact request declined',
      body: note
        ? `${targetName || 'The profile'} declined your request: ${note}`
        : `${targetName || 'The profile'} declined your contact request. You can request someone else.`,
      link: '/dashboard',
      relatedId: requestId,
    });
  }

  return { data: result.rows[0], request };
}

async function createContactRequest(req, res) {
  try {
    const { target_profile_id, user_message } = req.body;
    if (!target_profile_id) {
      return res.status(400).json({ success: false, message: 'Target profile is required' });
    }

    const requesterId = await getRequesterProfileId(req.user.id);
    if (!requesterId) {
      return res.status(400).json({ success: false, message: 'Complete your profile before requesting contact' });
    }

    if (requesterId === target_profile_id) {
      return res.status(400).json({ success: false, message: 'Cannot request your own contact number' });
    }

    const targetCheck = await pool.query(
      `SELECT p.id, p.first_name, p.last_name, p.user_id, p.is_profile_complete
       FROM profiles p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = $1 AND p.visibility = 'public' AND u.is_active = true`,
      [target_profile_id]
    );
    if (!targetCheck.rows.length) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const target = targetCheck.rows[0];
    const targetComplete = !!target.is_profile_complete;

    const pendingCheck = await pool.query(
      `SELECT id FROM contact_access_requests
       WHERE requester_profile_id = $1 AND target_profile_id = $2 AND status = 'pending'`,
      [requesterId, target_profile_id]
    );
    if (pendingCheck.rows.length) {
      return res.status(409).json({ success: false, message: 'You already have a pending request for this profile' });
    }

    const rejectedBlock = await pool.query(
      `SELECT id FROM contact_access_requests
       WHERE requester_profile_id = $1 AND target_profile_id = $2
         AND status = 'rejected'
         AND COALESCE(response_source, 'admin') IN ('target', 'admin')
       ORDER BY created_at DESC LIMIT 1`,
      [requesterId, target_profile_id]
    );
    if (rejectedBlock.rows.length) {
      return res.status(403).json({
        success: false,
        message: 'Your previous contact request was declined. You cannot send another request to this profile.',
        code: 'REQUEST_REJECTED_PERMANENT',
      });
    }

    const activeGrant = await pool.query(
      `SELECT id FROM contact_access_requests
       WHERE requester_profile_id = $1 AND target_profile_id = $2
         AND status = 'approved' AND (expires_at IS NULL OR expires_at > NOW())`,
      [requesterId, target_profile_id]
    );
    if (activeGrant.rows.length) {
      return res.status(409).json({ success: false, message: 'You already have access to this contact number' });
    }

    const quota = await getPendingQuota(requesterId);
    if (!quota.can_request) {
      return res.status(429).json({
        success: false,
        message: `You already have ${quota.pending_limit} pending requests. Wait for a response, or for a request to expire after 2 days.`,
        data: quota,
      });
    }

    const requesterProfile = await pool.query(
      `SELECT first_name, last_name FROM profiles WHERE id = $1`,
      [requesterId]
    );
    const requesterName = `${requesterProfile.rows[0]?.first_name || ''} ${requesterProfile.rows[0]?.last_name || ''}`.trim()
      || 'Someone';

    const result = await pool.query(
      `INSERT INTO contact_access_requests (requester_profile_id, target_profile_id, user_message)
       VALUES ($1, $2, $3) RETURNING *`,
      [requesterId, target_profile_id, user_message?.trim() || null]
    );

    const created = result.rows[0];

    await createNotification({
      userId: target.user_id,
      type: 'contact_request_received',
      title: 'New contact number request',
      body: targetComplete
        ? `${requesterName} requested your contact number. Accept or decline in My Activity.`
        : `${requesterName} requested your contact number. Complete your profile to unlock and respond.`,
      link: '/dashboard',
      relatedId: created.id,
    });

    await notifyAdmins({
      type: 'contact_request_received',
      title: 'New contact request',
      body: `${requesterName} requested contact for ${target.first_name || ''} ${target.last_name || ''}`.trim(),
      link: '/admin/contact-requests',
      relatedId: created.id,
    });

    res.status(201).json({
      success: true,
      data: created,
      message: 'Your request has been sent to the user and admin.',
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'You already have a pending request for this profile' });
    }
    res.status(500).json({
      success: false,
      message: isProduction ? 'Failed to submit request' : err.message,
    });
  }
}

async function getMyContactRequests(req, res) {
  try {
    await expireStalePendingRequests();

    const requesterId = await getRequesterProfileId(req.user.id);
    if (!requesterId) {
      return res.json({ success: true, data: [] });
    }

    const result = await pool.query(
      `SELECT car.*,
              tp.first_name AS target_first_name, tp.last_name AS target_last_name,
              tp.city AS target_city, tp.gender AS target_gender, tp.profile_photo AS target_photo,
              EXTRACT(YEAR FROM AGE(tp.date_of_birth))::int AS target_age
       FROM contact_access_requests car
       JOIN profiles tp ON tp.id = car.target_profile_id
       WHERE car.requester_profile_id = $1
       ORDER BY car.created_at DESC`,
      [requesterId]
    );

    const data = await Promise.all(
      result.rows.map(async (row) => {
        if (row.status === 'approved' && (row.expires_at === null || new Date(row.expires_at) > new Date())) {
          const contacts = await pool.query(
            `SELECT id, contact_type AS type, number FROM profile_contacts
             WHERE profile_id = $1 ORDER BY sort_order, created_at`,
            [row.target_profile_id]
          );
          return { ...row, contacts: contacts.rows };
        }
        return row;
      })
    );

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getIncomingContactRequests(req, res) {
  try {
    await expireStalePendingRequests();

    const targetId = await getRequesterProfileId(req.user.id);
    if (!targetId) {
      return res.json({ success: true, data: [], locked: true });
    }

    const profileMeta = await pool.query(
      `SELECT is_profile_complete FROM profiles WHERE id = $1`,
      [targetId]
    );
    const locked = !profileMeta.rows[0]?.is_profile_complete;

    const result = await pool.query(
      `SELECT car.*,
              rp.first_name AS requester_first_name, rp.last_name AS requester_last_name,
              rp.city AS requester_city, rp.gender AS requester_gender, rp.profile_photo AS requester_photo,
              EXTRACT(YEAR FROM AGE(rp.date_of_birth))::int AS requester_age
       FROM contact_access_requests car
       JOIN profiles rp ON rp.id = car.requester_profile_id
       WHERE car.target_profile_id = $1
       ORDER BY car.created_at DESC`,
      [targetId]
    );

    if (locked) {
      const redacted = result.rows.map((row) => ({
        id: row.id,
        status: row.status,
        created_at: row.created_at,
        requester_profile_id: row.requester_profile_id,
        requester_first_name: 'Locked',
        requester_last_name: '',
        requester_city: '••••',
        requester_age: null,
        requester_gender: row.requester_gender,
        requester_photo: null,
        user_message: null,
      }));
      return res.json({ success: true, data: redacted, locked: true });
    }

    const data = await Promise.all(
      result.rows.map(async (row) => {
        if (row.status === 'approved' && (row.expires_at === null || new Date(row.expires_at) > new Date())) {
          const contacts = await pool.query(
            `SELECT id, contact_type AS type, number FROM profile_contacts
             WHERE profile_id = $1 ORDER BY sort_order, created_at`,
            [row.requester_profile_id]
          );
          return { ...row, contacts: contacts.rows };
        }
        return row;
      })
    );

    res.json({ success: true, data, locked: false });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function respondToContactRequest(req, res) {
  try {
    const { id } = req.params;
    const { action, message } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be approve or reject' });
    }

    if (action === 'reject' && !message?.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a reason for declining' });
    }

    const myProfileId = await getRequesterProfileId(req.user.id);
    if (!myProfileId) {
      return res.status(400).json({ success: false, message: 'Complete your profile first' });
    }

    const completeness = await pool.query(
      `SELECT is_profile_complete FROM profiles WHERE id = $1`,
      [myProfileId]
    );
    if (!completeness.rows[0]?.is_profile_complete) {
      return res.status(403).json({
        success: false,
        message: 'Complete your profile first to accept or decline contact requests',
        data: { locked: true },
      });
    }

    const ownership = await pool.query(
      `SELECT id FROM contact_access_requests
       WHERE id = $1 AND target_profile_id = $2 AND status = 'pending'`,
      [id, myProfileId]
    );
    if (!ownership.rows.length) {
      return res.status(404).json({ success: false, message: 'Pending request not found' });
    }

    const outcome = await applyContactDecision({
      requestId: id,
      action,
      actorUserId: req.user.id,
      responseSource: 'target',
      message,
    });

    if (outcome.error) {
      return res.status(outcome.error.status).json({ success: false, message: outcome.error.message });
    }

    res.json({
      success: true,
      data: outcome.data,
      message: action === 'approve'
        ? 'Contact shared with the requester. Both can see each other\'s numbers until someone cancels.'
        : 'Request declined',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: isProduction ? 'Failed to respond to request' : err.message,
    });
  }
}

async function getContactAccessStatus(req, res) {
  try {
    const targetProfileId = req.params.profileId || req.params.id;
    const requesterId = await getRequesterProfileId(req.user.id);

    if (!requesterId) {
      return res.json({ success: true, data: { status: 'none' } });
    }

    const quota = await getPendingQuota(requesterId);

    if (requesterId === targetProfileId) {
      const contacts = await pool.query(
        `SELECT id, contact_type AS type, number FROM profile_contacts
         WHERE profile_id = $1 ORDER BY sort_order, created_at`,
        [targetProfileId]
      );
      return res.json({
        success: true,
        data: { status: 'own', contacts: contacts.rows, ...quota },
      });
    }

    const result = await pool.query(
      `SELECT * FROM contact_access_requests
       WHERE requester_profile_id = $1 AND target_profile_id = $2
       ORDER BY created_at DESC LIMIT 1`,
      [requesterId, targetProfileId]
    );

    if (!result.rows.length) {
      return res.json({ success: true, data: { status: 'none', ...quota } });
    }

    const request = result.rows[0];

    if (request.status === 'rejected') {
      const source = request.response_source || 'admin';
      const permanentlyBlocked = source === 'target' || source === 'admin';
      return res.json({
        success: true,
        data: {
          status: permanentlyBlocked ? 'rejected' : 'none',
          can_request_again: !permanentlyBlocked,
          last_status: 'rejected',
          admin_message: request.admin_message,
          ...quota,
        },
      });
    }

    if (request.status === 'expired') {
      return res.json({
        success: true,
        data: {
          status: 'none',
          can_request_again: true,
          last_status: request.status,
          admin_message: request.admin_message,
          ...quota,
        },
      });
    }

    if (request.status === 'approved') {
      if (request.expires_at === null || new Date(request.expires_at) > new Date()) {
        const contacts = await pool.query(
          `SELECT id, contact_type AS type, number FROM profile_contacts
           WHERE profile_id = $1 ORDER BY sort_order, created_at`,
          [targetProfileId]
        );
        return res.json({
          success: true,
          data: {
            status: 'approved',
            request_id: request.id,
            admin_message: request.admin_message,
            expires_at: request.expires_at,
            contacts: contacts.rows,
            ...quota,
          },
        });
      }
      return res.json({
        success: true,
        data: {
          status: 'expired',
          admin_message: request.admin_message,
          expires_at: request.expires_at,
          can_request_again: true,
          ...quota,
        },
      });
    }

    res.json({
      success: true,
      data: {
        status: request.status,
        request_id: request.id,
        admin_message: request.admin_message,
        created_at: request.created_at,
        can_request_again: request.status !== 'pending',
        ...quota,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createComplaint(req, res) {
  try {
    const { reported_profile_id, category, description } = req.body;
    if (!reported_profile_id || !category?.trim() || !description?.trim()) {
      return res.status(400).json({ success: false, message: 'Category and description are required' });
    }

    const reporterId = await getRequesterProfileId(req.user.id);
    if (!reporterId) {
      return res.status(400).json({ success: false, message: 'Complete your profile before filing a complaint' });
    }

    if (reporterId === reported_profile_id) {
      return res.status(400).json({ success: false, message: 'Cannot complain about your own profile' });
    }

    const result = await pool.query(
      `INSERT INTO complaints (reporter_profile_id, reported_profile_id, category, description)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [reporterId, reported_profile_id, category.trim(), description.trim()]
    );

    const complaint = result.rows[0];
    await addComplaintMessage(complaint.id, 'reporter', req.user.id, description.trim(), 'reporter');

    await notifyAdmins({
      type: 'complaint_filed',
      title: 'New complaint submitted',
      body: 'A user filed a complaint. Open Admin → Complaints to review and chat with each party.',
      link: '/admin/complaints',
      relatedId: complaint.id,
    });

    res.status(201).json({
      success: true,
      data: complaint,
      message: 'Your complaint has been submitted. Admin will review it shortly.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getMyComplaints(req, res) {
  try {
    const profileId = await getRequesterProfileId(req.user.id);
    if (!profileId) {
      return res.json({ success: true, data: { filed: [], against_me: [], support: [] } });
    }

    const [filedResult, supportResult] = await Promise.all([
      pool.query(
        `SELECT c.*,
                rp.first_name AS reported_first_name, rp.last_name AS reported_last_name,
                rp.city AS reported_city
         FROM complaints c
         JOIN profiles rp ON rp.id = c.reported_profile_id
         WHERE c.reporter_profile_id = $1
         ORDER BY c.created_at DESC`,
        [profileId]
      ),
      pool.query(
        `SELECT c.id, c.status, c.created_at, c.updated_at
         FROM complaints c
         WHERE c.reported_profile_id = $1
           AND EXISTS (
             SELECT 1 FROM complaint_messages m
             WHERE m.complaint_id = c.id
               AND m.sender_role = 'admin'
               AND m.recipient_role = 'reported'
           )
         ORDER BY c.updated_at DESC, c.created_at DESC`,
        [profileId]
      ),
    ]);

    const filed = filedResult.rows.map((c) => ({ ...c, my_role: 'filed' }));
    const supportRaw = supportResult.rows.map((c) => ({ ...c, my_role: 'support' }));

    res.json({
      success: true,
      data: {
        filed: await attachMessagesToComplaints(filed, 'reporter'),
        against_me: [],
        support: (await attachMessagesToComplaints(supportRaw, 'reported')).map(sanitizeSupportComplaint),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function replyToComplaint(req, res) {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const profileId = await getRequesterProfileId(req.user.id);
    if (!profileId) {
      return res.status(400).json({ success: false, message: 'Complete your profile first' });
    }

    const complaintResult = await pool.query('SELECT * FROM complaints WHERE id = $1', [id]);
    if (!complaintResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const complaint = complaintResult.rows[0];
    let senderRole;
    if (complaint.reporter_profile_id === profileId) {
      senderRole = 'reporter';
    } else if (complaint.reported_profile_id === profileId) {
      senderRole = 'reported';
    } else {
      return res.status(403).json({ success: false, message: 'You are not part of this complaint' });
    }

    if (complaint.status === 'dismissed') {
      return res.status(400).json({ success: false, message: 'This complaint is closed' });
    }

    if (senderRole === 'reported') {
      const adminContacted = await pool.query(
        `SELECT 1 FROM complaint_messages
         WHERE complaint_id = $1
           AND sender_role = 'admin'
           AND recipient_role = 'reported'
         LIMIT 1`,
        [id]
      );
      if (!adminContacted.rows.length) {
        return res.status(403).json({ success: false, message: 'You cannot reply to this complaint' });
      }
    }

    const saved = await addComplaintMessage(id, senderRole, req.user.id, message, senderRole);

    await notifyAdmins({
      type: 'complaint_reply',
      title: senderRole === 'reporter' ? 'Reporter replied on a complaint' : 'User replied to admin support',
      body: 'Open Admin → Complaints and select that user to continue the chat.',
      link: '/admin/complaints',
      relatedId: id,
    });

    res.json({ success: true, data: saved, message: 'Reply sent' });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: isProduction ? 'Failed to send reply' : err.message,
    });
  }
}

async function cancelContactRequest(req, res) {
  try {
    const { id } = req.params;
    const myProfileId = await getRequesterProfileId(req.user.id);
    if (!myProfileId) {
      return res.status(400).json({ success: false, message: 'Complete your profile first' });
    }

    const requestResult = await pool.query(
      `SELECT car.*,
              rp.first_name AS requester_first_name, rp.last_name AS requester_last_name,
              tp.first_name AS target_first_name, tp.last_name AS target_last_name
       FROM contact_access_requests car
       JOIN profiles rp ON rp.id = car.requester_profile_id
       JOIN profiles tp ON tp.id = car.target_profile_id
       WHERE car.id = $1 AND car.status = 'approved'`,
      [id]
    );

    if (!requestResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Approved request not found' });
    }

    const request = requestResult.rows[0];
    if (request.requester_profile_id !== myProfileId && request.target_profile_id !== myProfileId) {
      return res.status(403).json({ success: false, message: 'You are not part of this connection' });
    }

    const result = await pool.query(
      `UPDATE contact_access_requests SET
         status = 'rejected',
         admin_message = 'Cancelled by user',
         response_source = 'self_cancel',
         reviewed_by = $1,
         reviewed_at = NOW(),
         updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [req.user.id, id]
    );

    const otherUserId = request.requester_profile_id === myProfileId
      ? await getUserIdByProfileId(request.target_profile_id)
      : await getUserIdByProfileId(request.requester_profile_id);

    const myName = request.requester_profile_id === myProfileId
      ? `${request.requester_first_name || ''} ${request.requester_last_name || ''}`.trim()
      : `${request.target_first_name || ''} ${request.target_last_name || ''}`.trim();

    await createNotification({
      userId: otherUserId,
      type: 'contact_request_rejected',
      title: 'Connection cancelled',
      body: `${myName || 'The other user'} cancelled the contact connection.`,
      link: '/dashboard',
      relatedId: id,
    });

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Connection cancelled. Contact numbers are no longer visible.',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: isProduction ? 'Failed to cancel connection' : err.message,
    });
  }
}

module.exports = {
  createContactRequest,
  getMyContactRequests,
  getIncomingContactRequests,
  respondToContactRequest,
  cancelContactRequest,
  getContactAccessStatus,
  createComplaint,
  getMyComplaints,
  replyToComplaint,
  applyContactDecision,
  expireStalePendingRequests,
};
