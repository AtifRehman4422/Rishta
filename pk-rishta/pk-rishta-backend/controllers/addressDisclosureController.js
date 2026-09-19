const pool = require('../db');
const { isProduction } = require('../middleware/security');
const { createNotification, getUserIdByProfileId } = require('../utils/notifications');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getMyProfileId(userId) {
  const result = await pool.query('SELECT id FROM profiles WHERE user_id = $1', [userId]);
  return result.rows[0]?.id || null;
}

async function disclosureFlags(myProfileId, targetProfileId) {
  const result = await pool.query(
    `SELECT
       EXISTS (
         SELECT 1 FROM address_disclosures
         WHERE discloser_profile_id = $1 AND viewer_profile_id = $2
       ) AS i_shared,
       EXISTS (
         SELECT 1 FROM address_disclosures
         WHERE discloser_profile_id = $2 AND viewer_profile_id = $1
       ) AS they_shared`,
    [myProfileId, targetProfileId]
  );
  return {
    i_shared_address: !!result.rows[0]?.i_shared,
    they_shared_address: !!result.rows[0]?.they_shared,
    address_visible: !!result.rows[0]?.they_shared,
  };
}

async function shareAddress(req, res) {
  try {
    const { profileId } = req.params;
    if (!UUID_REGEX.test(profileId)) {
      return res.status(400).json({ success: false, message: 'Invalid profile' });
    }

    const myProfileId = await getMyProfileId(req.user.id);
    if (!myProfileId) {
      return res.status(400).json({ success: false, message: 'Create your profile first' });
    }
    if (myProfileId === profileId) {
      return res.status(400).json({ success: false, message: 'You already see your own address' });
    }

    const target = await pool.query(
      `SELECT p.id, p.first_name, p.last_name, p.user_id
       FROM profiles p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = $1 AND p.visibility = 'public' AND u.is_active = true`,
      [profileId]
    );
    if (!target.rows.length) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const inserted = await pool.query(
      `INSERT IGNORE INTO address_disclosures (discloser_profile_id, viewer_profile_id)
       VALUES ($1, $2)`,
      [myProfileId, profileId]
    );
    inserted.rows = inserted.rowCount > 0 ? [{ discloser_profile_id: myProfileId }] : [];

    if (inserted.rows.length) {
      const me = await pool.query(
        'SELECT first_name, last_name FROM profiles WHERE id = $1',
        [myProfileId]
      );
      const myName = `${me.rows[0]?.first_name || ''} ${me.rows[0]?.last_name || ''}`.trim() || 'A member';
      const targetUserId = await getUserIdByProfileId(profileId);
      await createNotification({
        userId: targetUserId,
        type: 'address_shared',
        title: 'Complete address shared',
        body: `${myName} shared their complete address with you. Share yours so they can see your address too.`,
        link: `/profile/${myProfileId}`,
        relatedId: myProfileId,
      });
    }

    const flags = await disclosureFlags(myProfileId, profileId);
    res.json({
      success: true,
      message: inserted.rows.length
        ? 'Your complete address is now visible to this member.'
        : 'You already shared your address with this member.',
      data: flags,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: isProduction ? 'Request failed' : err.message,
    });
  }
}

async function hideAddress(req, res) {
  try {
    const { profileId } = req.params;
    if (!UUID_REGEX.test(profileId)) {
      return res.status(400).json({ success: false, message: 'Invalid profile' });
    }

    const myProfileId = await getMyProfileId(req.user.id);
    if (!myProfileId) {
      return res.status(400).json({ success: false, message: 'Create your profile first' });
    }

    await pool.query(
      `DELETE FROM address_disclosures
       WHERE discloser_profile_id = $1 AND viewer_profile_id = $2`,
      [myProfileId, profileId]
    );

    const flags = await disclosureFlags(myProfileId, profileId);
    res.json({
      success: true,
      message: 'Your complete address is hidden from this member again.',
      data: flags,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: isProduction ? 'Request failed' : err.message,
    });
  }
}

module.exports = { shareAddress, hideAddress };
