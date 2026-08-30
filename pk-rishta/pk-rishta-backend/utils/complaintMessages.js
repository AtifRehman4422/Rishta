const pool = require('../db');

function defaultRecipientRole(senderRole, recipientRole) {
  if (recipientRole === 'reporter' || recipientRole === 'reported') return recipientRole;
  if (senderRole === 'reporter' || senderRole === 'reported') return senderRole;
  return null;
}

function messageVisibleToRole(row, viewerRole) {
  if (viewerRole === 'admin') return true;
  if (row.sender_role === viewerRole) return true;
  if (row.sender_role === 'admin') {
    const target = row.recipient_role || 'reporter';
    return target === viewerRole || target === 'both';
  }
  return false;
}

async function getComplaintMessages(complaintId, viewerRole = 'admin', client = pool) {
  const result = await client.query(
    `SELECT id, sender_role, recipient_role, message, created_at
     FROM complaint_messages
     WHERE complaint_id = $1
     ORDER BY created_at ASC`,
    [complaintId]
  );
  if (viewerRole === 'admin') return result.rows;
  return result.rows.filter((row) => messageVisibleToRole(row, viewerRole));
}

async function addComplaintMessage(complaintId, senderRole, senderUserId, message, recipientRole, client = pool) {
  const text = message?.trim();
  if (!text) return null;

  const target = defaultRecipientRole(senderRole, recipientRole);
  if (senderRole === 'admin' && !target) {
    throw new Error('Admin message must target reporter or reported user');
  }

  const result = await client.query(
    `INSERT INTO complaint_messages (complaint_id, sender_role, sender_user_id, recipient_role, message)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, sender_role, recipient_role, message, created_at`,
    [complaintId, senderRole, senderUserId || null, target, text]
  );
  await client.query(
    `UPDATE complaints SET updated_at = NOW() WHERE id = $1`,
    [complaintId]
  );
  return result.rows[0];
}

async function attachMessagesToComplaints(complaints, viewerRole = 'admin') {
  return Promise.all(
    complaints.map(async (complaint) => ({
      ...complaint,
      messages: await getComplaintMessages(complaint.id, viewerRole),
    }))
  );
}

function sanitizeSupportComplaint(complaint) {
  return {
    id: complaint.id,
    status: complaint.status,
    category: 'support',
    description: '',
    created_at: complaint.created_at,
    updated_at: complaint.updated_at,
    messages: complaint.messages || [],
    my_role: 'support',
  };
}

module.exports = {
  addComplaintMessage,
  attachMessagesToComplaints,
  messageVisibleToRole,
  sanitizeSupportComplaint,
};
