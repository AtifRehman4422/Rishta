const pool = require('../db');

async function createNotification({ userId, type, title, body, link = null, relatedId = null }) {
  if (!userId) {
    console.warn('[notifications] skipped: missing userId', { type, relatedId });
    return null;
  }
  try {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, body, link, related_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, type, title, body || null, link, relatedId]
    );
    return result.rows[0];
  } catch (err) {
    console.error('[notifications] insert failed:', err.message, { userId, type, relatedId });
    return null;
  }
}

async function notifyAdmins({ type, title, body, link = null, relatedId = null }) {
  try {
    const admins = await pool.query(
      `SELECT id FROM users WHERE role = 'admin' AND is_active = true`
    );
    await Promise.all(
      admins.rows.map((admin) =>
        createNotification({
          userId: admin.id,
          type,
          title,
          body,
          link: link || '/admin/contact-requests',
          relatedId,
        })
      )
    );
  } catch (err) {
    console.error('[notifications] notifyAdmins failed:', err.message);
  }
}

async function getUserIdByProfileId(profileId) {
  const result = await pool.query('SELECT user_id FROM profiles WHERE id = $1', [profileId]);
  return result.rows[0]?.user_id || null;
}

/** Create missing bell notifications for pending contact requests (incl. incomplete profiles). */
async function backfillContactRequestNotifications(userId) {
  if (!userId) return 0;

  const pending = await pool.query(
    `SELECT car.id, car.created_at,
            rp.first_name AS requester_first_name, rp.last_name AS requester_last_name,
            tp.is_profile_complete
     FROM contact_access_requests car
     JOIN profiles tp ON tp.id = car.target_profile_id
     JOIN profiles rp ON rp.id = car.requester_profile_id
     WHERE tp.user_id = $1 AND car.status = 'pending'
       AND NOT EXISTS (
         SELECT 1 FROM notifications n
         WHERE n.user_id = $1
           AND n.related_id = car.id
           AND n.type = 'contact_request_received'
       )`,
    [userId]
  );

  let created = 0;
  for (const row of pending.rows) {
    const requesterName = `${row.requester_first_name || ''} ${row.requester_last_name || ''}`.trim() || 'Someone';
    const note = await createNotification({
      userId,
      type: 'contact_request_received',
      title: 'New contact number request',
      body: row.is_profile_complete
        ? `${requesterName} requested your contact number. Accept or decline in My Activity.`
        : `${requesterName} requested your contact number. Complete your profile to unlock and respond.`,
      link: '/dashboard',
      relatedId: row.id,
    });
    if (note) created += 1;
  }
  return created;
}

module.exports = {
  createNotification,
  notifyAdmins,
  getUserIdByProfileId,
  backfillContactRequestNotifications,
};
