const pool = require('../db');

async function getComplaintMessages(complaintId, client = pool) {
  const result = await client.query(
    `SELECT id, sender_role, message, created_at
     FROM complaint_messages
     WHERE complaint_id = $1
     ORDER BY created_at ASC`,
    [complaintId]
  );
  return result.rows;
}

async function addComplaintMessage(complaintId, senderRole, senderUserId, message, client = pool) {
  const text = message?.trim();
  if (!text) return null;

  const result = await client.query(
    `INSERT INTO complaint_messages (complaint_id, sender_role, sender_user_id, message)
     VALUES ($1, $2, $3, $4)
     RETURNING id, sender_role, message, created_at`,
    [complaintId, senderRole, senderUserId || null, text]
  );
  return result.rows[0];
}

async function attachMessagesToComplaints(complaints) {
  return Promise.all(
    complaints.map(async (complaint) => ({
      ...complaint,
      messages: await getComplaintMessages(complaint.id),
    }))
  );
}

module.exports = { addComplaintMessage, attachMessagesToComplaints };
