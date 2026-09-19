const pool = require('../db');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getProfileIdByUserId(userId) {
  const result = await pool.query('SELECT id FROM profiles WHERE user_id = $1', [userId]);
  return result.rows[0]?.id || null;
}

async function addFavorite(req, res) {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid profile id' });
    }

    const profileId = await getProfileIdByUserId(req.user.id);
    if (!profileId) {
      return res.status(400).json({ success: false, message: 'Create your profile before saving favorites' });
    }
    if (profileId === id) {
      return res.status(400).json({ success: false, message: 'You cannot save your own profile' });
    }

    const target = await pool.query(
      `SELECT 1 FROM profiles p JOIN users u ON u.id = p.user_id
       WHERE p.id = $1 AND p.visibility = 'public' AND u.is_active = true`,
      [id]
    );
    if (!target.rows.length) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    await pool.query(
      `INSERT INTO favorites (profile_id, favorite_id)
       VALUES ($1, $2)
       ON CONFLICT (profile_id, favorite_id) DO NOTHING`,
      [profileId, id]
    );

    res.json({ success: true, data: { is_favorite: true } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function removeFavorite(req, res) {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid profile id' });
    }

    const profileId = await getProfileIdByUserId(req.user.id);
    if (!profileId) {
      return res.status(400).json({ success: false, message: 'Create your profile before managing favorites' });
    }

    await pool.query(
      'DELETE FROM favorites WHERE profile_id = $1 AND favorite_id = $2',
      [profileId, id]
    );

    res.json({ success: true, data: { is_favorite: false } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function listFavorites(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '12', 10), 1), 50);

    const profileId = await getProfileIdByUserId(req.user.id);
    if (!profileId) {
      return res.json({ success: true, data: [], pagination: { total: 0, page, limit, totalPages: 0 } });
    }

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM favorites WHERE profile_id = $1',
      [profileId]
    );

    const offset = (page - 1) * limit;
    const result = await pool.query(
      `SELECT p.id, p.first_name, p.last_name, p.gender, p.date_of_birth,
              p.height_cm, p.marital_status, p.religion, p.sect, p.city, p.province, p.country,
              p.education, p.profession, p.about_me, p.profile_photo,
              p.is_verified, p.profile_views,
              EXTRACT(YEAR FROM AGE(p.date_of_birth))::int as age
       FROM favorites f
       JOIN profiles p ON p.id = f.favorite_id
       WHERE f.profile_id = $1
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [profileId, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count, 10),
        page,
        limit,
        totalPages: Math.ceil(parseInt(countResult.rows[0].count, 10) / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { addFavorite, removeFavorite, listFavorites };
