const pool = require('../db');
const { isProduction } = require('../middleware/security');
const { backfillContactRequestNotifications } = require('../utils/notifications');

async function getNotifications(req, res) {
  try {
    await backfillContactRequestNotifications(req.user.id);

    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [req.user.id, limit]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: isProduction ? 'Failed to load notifications' : err.message,
    });
  }
}

async function getUnreadCount(req, res) {
  try {
    await backfillContactRequestNotifications(req.user.id);

    const result = await pool.query(
      `SELECT COUNT(*)::int AS count FROM notifications
       WHERE user_id = $1 AND is_read = false`,
      [req.user.id]
    );
    res.json({ success: true, data: { unread: result.rows[0]?.count || 0 } });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: isProduction ? 'Failed to load unread count' : err.message,
    });
  }
}

async function markNotificationRead(req, res) {
  try {
    const result = await pool.query(
      `UPDATE notifications SET is_read = true
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: isProduction ? 'Failed to update notification' : err.message,
    });
  }
}

async function markAllNotificationsRead(req, res) {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = true
       WHERE user_id = $1 AND is_read = false`,
      [req.user.id]
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: isProduction ? 'Failed to update notifications' : err.message,
    });
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
};
