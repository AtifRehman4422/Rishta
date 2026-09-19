const bcrypt = require('bcryptjs');
const pool = require('../db');
const { isProduction } = require('../middleware/security');
const { normalizeProfileLocation, normalizePartnerPreferencesLocation } = require('../utils/location');
const { applyAddressPrivacy, hideCompleteAddress } = require('../utils/addressPrivacy');

function fail(res, err, status = 500) {
  return res.status(status).json({
    success: false,
    message: isProduction ? 'Request failed' : (err?.message || 'Request failed'),
  });
}

function stripNonAdminProfileFields(profile, isAdmin) {
  if (!profile || typeof profile !== 'object') return profile;
  delete profile.user_id;
  delete profile.user_phone;
  if (!isAdmin) {
    delete profile.user_email;
    delete profile.admin_rating;
    delete profile.contact_request_limit;
    delete profile.contacts;
  }
  return profile;
}

function calcAge(dob) {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function hasFamilyDetails(value) {
  const text = String(value || '').trim();
  if (!text) return false;
  try {
    const parsed = JSON.parse(text);
    if (parsed?.version === 1) {
      return !!(parsed.father?.alive && parsed.mother?.alive);
    }
  } catch {
    // Legacy free-text family details
  }
  return text.length >= 10;
}

function calculateProfileComplete(profile, hasPhoneContact, preferences = {}) {
  const required = [
    'first_name', 'last_name', 'gender', 'date_of_birth',
    'height_cm', 'weight_kg', 'marital_status', 'color',
    'guardian_type', 'guardian_name', 'disability',
    'religion', 'sect', 'caste', 'languages',
    'city', 'province', 'education', 'profession', 'hafiz_quran',
  ];
  const hasRequiredFields = required.every((field) => {
    const value = profile[field];
    return value !== null && value !== undefined && String(value).trim() !== '';
  });
  const hasPakistanAddress = !!(
    profile.house_own_location?.trim?.() || profile.house_rent_location?.trim?.()
  );
  const isOverseasOnly = profile.province === 'Overseas';
  const hasResidence = isOverseasOnly
    ? !!(
      profile.abroad_country?.trim?.()
      && (profile.abroad_house_own_location?.trim?.() || profile.abroad_house_rent_location?.trim?.())
    )
    : hasPakistanAddress;

  const hasRequiredPartnerAge = (
    preferences.min_age !== null
    && preferences.min_age !== undefined
    && preferences.max_age !== null
    && preferences.max_age !== undefined
  );

  return hasRequiredFields && hasFamilyDetails(profile.family_details) && hasResidence && hasPhoneContact && hasRequiredPartnerAge;
}

async function refreshProfileCompletion(profileId, client = pool) {
  const completionResult = await client.query(
    `SELECT p.*,
            EXISTS (
              SELECT 1 FROM profile_contacts pc
              WHERE pc.profile_id = p.id
                AND pc.contact_type = 'phone'
                AND trim(pc.number) <> ''
            ) AS has_phone_contact,
            pp.min_age AS preferred_min_age,
            pp.max_age AS preferred_max_age
     FROM profiles p
     LEFT JOIN partner_preferences pp ON pp.profile_id = p.id
     WHERE p.id = $1`,
    [profileId]
  );
  if (!completionResult.rows.length) return null;

  const profile = completionResult.rows[0];
  const isComplete = calculateProfileComplete(
    profile,
    !!profile.has_phone_contact,
    {
      min_age: profile.preferred_min_age,
      max_age: profile.preferred_max_age,
    },
  );
  const updated = await client.query(
    `UPDATE profiles
     SET is_profile_complete = $1
     WHERE id = $2
     RETURNING *`,
    [isComplete, profileId]
  );
  return updated.rows[0];
}

async function getProfileContacts(profileId) {
  const result = await pool.query(
    `SELECT id, contact_type AS type, number
     FROM profile_contacts
     WHERE profile_id = $1
     ORDER BY sort_order, created_at`,
    [profileId]
  );
  return result.rows;
}

async function saveProfileContacts(profileId, contacts, client = pool) {
  await client.query('DELETE FROM profile_contacts WHERE profile_id = $1', [profileId]);
  if (!Array.isArray(contacts)) return;

  let order = 0;
  for (const contact of contacts) {
    const number = contact?.number?.trim();
    const type = contact?.type === 'whatsapp' ? 'whatsapp' : 'phone';
    if (!number) continue;
    await client.query(
      `INSERT INTO profile_contacts (profile_id, contact_type, number, sort_order)
       VALUES ($1, $2, $3, $4)`,
      [profileId, type, number, order++]
    );
  }
}

function emptyToNull(val) {
  return val === '' || val === undefined ? null : val;
}

function coerceWeightKg(profile) {
  if (!profile) return profile;
  if (profile.weight_kg == null || profile.weight_kg === '') {
    profile.weight_kg = null;
    return profile;
  }
  const n = Number(profile.weight_kg);
  profile.weight_kg = Number.isFinite(n) ? n : null;
  return profile;
}

function parseOptionalInt(val) {
  if (val === '' || val === null || val === undefined) return null;
  const n = parseInt(val, 10);
  return Number.isNaN(n) ? null : n;
}

async function getPartnerPreferences(profileId, client = pool) {
  const result = await client.query(
    `SELECT min_age, max_age, min_height_cm, max_height_cm, religion, sect, caste,
            city, province, country, education, profession, marital_status, requirements_notes
     FROM partner_preferences WHERE profile_id = $1`,
    [profileId]
  );
  return result.rows[0] || null;
}

async function savePartnerPreferences(profileId, prefs, client = pool) {
  if (!prefs || typeof prefs !== 'object') return;

  prefs = normalizePartnerPreferencesLocation(prefs);

  const hasData = !!(
    (prefs.min_age != null && prefs.min_age !== '') ||
    (prefs.max_age != null && prefs.max_age !== '') ||
    (prefs.min_height_cm != null && prefs.min_height_cm !== '') ||
    (prefs.max_height_cm != null && prefs.max_height_cm !== '') ||
    prefs.religion?.trim?.() ||
    prefs.sect?.trim?.() ||
    prefs.caste?.trim?.() ||
    prefs.city?.trim?.() ||
    prefs.province?.trim?.() ||
    prefs.country?.trim?.() ||
    prefs.education?.trim?.() ||
    prefs.profession?.trim?.() ||
    prefs.marital_status?.trim?.() ||
    prefs.requirements_notes?.trim?.()
  );

  if (!hasData) {
    await client.query('DELETE FROM partner_preferences WHERE profile_id = $1', [profileId]);
    return;
  }

  const minAge = parseOptionalInt(prefs.min_age);
  const maxAge = parseOptionalInt(prefs.max_age);

  await client.query(
    `INSERT INTO partner_preferences (
       profile_id, min_age, max_age, min_height_cm, max_height_cm,
       religion, sect, caste, city, province, country, education, profession, marital_status, requirements_notes
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     ON CONFLICT (profile_id) DO UPDATE SET
       min_age = EXCLUDED.min_age,
       max_age = EXCLUDED.max_age,
       min_height_cm = EXCLUDED.min_height_cm,
       max_height_cm = EXCLUDED.max_height_cm,
       religion = EXCLUDED.religion,
       sect = EXCLUDED.sect,
       caste = EXCLUDED.caste,
       city = EXCLUDED.city,
       province = EXCLUDED.province,
       country = EXCLUDED.country,
       education = EXCLUDED.education,
       profession = EXCLUDED.profession,
       marital_status = EXCLUDED.marital_status,
       requirements_notes = EXCLUDED.requirements_notes,
       updated_at = NOW()`,
    [
      profileId,
      minAge,
      maxAge,
      parseOptionalInt(prefs.min_height_cm),
      parseOptionalInt(prefs.max_height_cm),
      emptyToNull(prefs.religion),
      emptyToNull(prefs.sect),
      emptyToNull(prefs.caste),
      emptyToNull(prefs.city),
      emptyToNull(prefs.province),
      emptyToNull(prefs.country),
      emptyToNull(prefs.education),
      emptyToNull(prefs.profession),
      emptyToNull(prefs.marital_status),
      emptyToNull(prefs.requirements_notes),
    ]
  );
}

async function searchProfiles(req, res) {
  try {
    const {
      gender, city, province, country, marital_status, religion, sect,
      min_age, max_age, education, profession, page = 1, limit = 12,
    } = req.query;

    const conditions = ["p.visibility = 'public'", 'u.is_active = true'];
    const params = [];
    let idx = 1;

    if (gender) { conditions.push(`p.gender = $${idx++}`); params.push(gender); }
    if (city) { conditions.push(`p.city ILIKE $${idx++}`); params.push(`%${city}%`); }
    if (province) { conditions.push(`p.province = $${idx++}`); params.push(province); }
    if (country) {
      const countryValue = String(country).trim();
      if (countryValue && countryValue.toLowerCase() !== 'pakistan') {
        conditions.push(`p.country ILIKE $${idx++}`);
        params.push(countryValue);
      } else if (countryValue.toLowerCase() === 'pakistan') {
        conditions.push(`(p.province IS DISTINCT FROM 'Overseas')`);
      }
    }
    if (marital_status) {
      const raw = String(marital_status).trim().toLowerCase();
      const mapped = (raw === 'single' || raw === 'never_married') ? 'never_married' : marital_status;
      conditions.push(`(p.marital_status = $${idx} OR LOWER(REPLACE(p.marital_status, ' ', '_')) = LOWER(REPLACE($${idx}::text, ' ', '_')))`);
      params.push(mapped);
      idx++;
    }
    if (religion) { conditions.push(`p.religion ILIKE $${idx++}`); params.push(religion); }
    if (sect) { conditions.push(`p.sect = $${idx++}`); params.push(sect); }
    if (education) { conditions.push(`p.education ILIKE $${idx++}`); params.push(`%${education}%`); }
    if (profession) { conditions.push(`p.profession ILIKE $${idx++}`); params.push(`%${profession}%`); }
    const minAge = parseOptionalInt(min_age);
    const maxAge = parseOptionalInt(max_age);
    if (minAge !== null) {
      conditions.push(`EXTRACT(YEAR FROM AGE(p.date_of_birth))::int >= $${idx++}`);
      params.push(minAge);
    }
    if (maxAge !== null) {
      conditions.push(`EXTRACT(YEAR FROM AGE(p.date_of_birth))::int <= $${idx++}`);
      params.push(maxAge);
    }

    if (req.user?.id) {
      conditions.push(`p.user_id != $${idx++}`);
      params.push(req.user.id);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM profiles p JOIN users u ON u.id = p.user_id ${where}`,
      params
    );

    params.push(parseInt(limit), offset);
    const isAdmin = req.user?.role === 'admin';
    const ratingSelect = isAdmin ? 'p.admin_rating,' : '';
    const result = await pool.query(
      `SELECT p.id, p.first_name, p.last_name, p.gender, p.date_of_birth,
              p.height_cm, p.marital_status, p.religion, p.sect, p.city, p.province, p.country,
              p.education, p.profession, p.about_me, p.profile_photo,
              p.is_verified, ${ratingSelect} p.profile_views,
              EXTRACT(YEAR FROM AGE(p.date_of_birth))::int as age
       FROM profiles p
       JOIN users u ON u.id = p.user_id
       ${where}
       ORDER BY p.is_verified DESC, p.updated_at DESC NULLS LAST, p.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      params
    );

    res.json({
      success: true,
      data: result.rows.map((row) => stripNonAdminProfileFields({ ...row }, isAdmin)),
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult.rows[0].count / parseInt(limit)),
      },
    });
  } catch (err) {
    fail(res, err);
  }
}

async function getProfileById(req, res) {
  try {
    const { id } = req.params;
    const isAdmin = req.user?.role === 'admin';

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const emailSelect = isAdmin ? 'u.email AS user_email,' : '';
    const result = await pool.query(
      isAdmin
        ? `SELECT p.*, ${emailSelect} EXTRACT(YEAR FROM AGE(p.date_of_birth))::int as age
           FROM profiles p
           JOIN users u ON u.id = p.user_id
           WHERE p.id = $1`
        : `SELECT p.*, EXTRACT(YEAR FROM AGE(p.date_of_birth))::int as age
           FROM profiles p
           JOIN users u ON u.id = p.user_id
           WHERE p.id = $1
             AND (p.user_id = $2 OR (p.visibility = 'public' AND u.is_active = true))`,
      isAdmin ? [id] : [id, req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const profile = result.rows[0];
    const isOwn = profile.user_id === req.user?.id;

    if (!isAdmin && !isOwn) {
      const viewer = await pool.query(
        'SELECT is_profile_complete FROM profiles WHERE user_id = $1',
        [req.user.id]
      );
      if (!viewer.rows[0]?.is_profile_complete) {
        return res.status(403).json({
          success: false,
          message: 'Complete your profile to view other members',
        });
      }
      await pool.query('UPDATE profiles SET profile_views = profile_views + 1 WHERE id = $1', [id]);
    }

    stripNonAdminProfileFields(profile, isAdmin);
    coerceWeightKg(profile);
    await applyAddressPrivacy(profile, {
      viewerUserId: req.user.id,
      isAdmin,
      isOwn,
    });
    profile.partner_preferences = await getPartnerPreferences(profile.id);

    if (isAdmin) {
      profile.contacts = await getProfileContacts(profile.id);
      profile.is_admin_view = true;
    }

    res.json({ success: true, data: profile });
  } catch (err) {
    fail(res, err);
  }
}

async function getMyProfile(req, res) {
  try {
    const result = await pool.query(
      `SELECT p.*, u.email AS user_email, u.phone AS user_phone, EXTRACT(YEAR FROM AGE(p.date_of_birth))::int as age
       FROM profiles p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = $1`,
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const profile = result.rows[0];
    delete profile.contact_request_limit;
    coerceWeightKg(profile);
    profile.contacts = await getProfileContacts(profile.id);
    if (!profile.contacts.length && profile.user_phone) {
      await pool.query(
        `INSERT INTO profile_contacts (profile_id, contact_type, number, sort_order)
         VALUES ($1, 'phone', $2, 0)`,
        [profile.id, profile.user_phone]
      );
      profile.contacts = [{ type: 'phone', number: profile.user_phone }];
    }
    profile.partner_preferences = await getPartnerPreferences(profile.id);
    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

function normalizeProfileBody(body, { optionalLocation = false } = {}) {
  const locationResult = optionalLocation
    ? { data: normalizeProfileLocationOptional(body) }
    : normalizeProfileLocation(body);
  if (locationResult.error) return locationResult;

  const normalized = { ...locationResult.data };
  const nullableFields = [
    'first_name', 'last_name', 'gender', 'date_of_birth', 'height_cm', 'weight_kg',
    'marital_status', 'religion', 'sect', 'caste', 'mother_tongue', 'languages',
    'disability', 'color', 'guardian_type', 'guardian_name',
    'house_own_location', 'house_rent_location',
    'abroad_country', 'abroad_house_own_location', 'abroad_house_rent_location',
    'profile_photo',
    'city', 'province', 'country', 'education', 'profession', 'hafiz_quran', 'income_range',
    'about_me', 'looking_for', 'family_details', 'visibility',
  ];
  for (const field of nullableFields) {
    if (normalized[field] === '') normalized[field] = null;
  }
  return { data: normalized };
}

function normalizeProfileLocationOptional(body) {
  if (!body || typeof body !== 'object') return body;
  if (body.province === 'Overseas') {
    return { ...body, country: body.country?.trim() || null };
  }
  if (body.province !== undefined && body.province !== null && body.province !== '') {
    return { ...body, country: 'Pakistan' };
  }
  return body;
}

async function updateProfileById(profileId, body, { requireContacts = true, optionalLocation = false } = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const currentResult = await client.query('SELECT * FROM profiles WHERE id = $1', [profileId]);
    if (!currentResult.rows.length) {
      await client.query('ROLLBACK');
      return { error: { status: 404, message: 'Profile not found' } };
    }

    const normalized = normalizeProfileBody(body, { optionalLocation });
    if (normalized.error) {
      await client.query('ROLLBACK');
      return { error: { status: 400, message: normalized.error } };
    }
    const payload = normalized.data;

    const fields = [
      'first_name', 'last_name', 'gender', 'date_of_birth', 'height_cm', 'weight_kg',
      'marital_status', 'religion', 'sect', 'caste', 'mother_tongue', 'languages',
      'disability', 'color', 'guardian_type', 'guardian_name',
      'house_own_location', 'house_rent_location',
      'abroad_country', 'abroad_house_own_location', 'abroad_house_rent_location',
      'profile_photo',
      'city', 'province', 'country', 'education', 'profession', 'hafiz_quran', 'income_range',
      'about_me', 'looking_for', 'family_details', 'visibility',
    ];

    const updates = [];
    const params = [];
    let idx = 1;

    for (const field of fields) {
      if (payload[field] !== undefined) {
        // Keep existing NOT NULL values when admin clears a required column
        if (
          payload[field] === null &&
          ['first_name', 'last_name', 'gender', 'date_of_birth', 'city', 'country'].includes(field)
        ) {
          if (field === 'city') {
            updates.push(`${field} = $${idx++}`);
            params.push('---');
          }
          continue;
        }
        updates.push(`${field} = $${idx++}`);
        params.push(payload[field]);
      }
    }

    if (body.contacts !== undefined) {
      const validContacts = (body.contacts || []).filter((c) => c?.number?.trim());
      if (requireContacts && !validContacts.length) {
        await client.query('ROLLBACK');
        return { error: { status: 400, message: 'At least one contact number is required' } };
      }
      if (requireContacts && !validContacts.some((c) => c.type === 'phone')) {
        await client.query('ROLLBACK');
        return { error: { status: 400, message: 'At least one phone number is required' } };
      }
      await saveProfileContacts(profileId, body.contacts, client);
    }

    if (body.partner_preferences !== undefined) {
      await savePartnerPreferences(profileId, body.partner_preferences, client);
    }

    let emailUpdated = false;
    if (body.email !== undefined) {
      const userId = currentResult.rows[0].user_id;
      if (!userId) {
        await client.query('ROLLBACK');
        return { error: { status: 400, message: 'Profile has no linked user account' } };
      }
      const email = String(body.email).trim().toLowerCase();
      if (!email) {
        await client.query('ROLLBACK');
        return { error: { status: 400, message: 'Email is required' } };
      }
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRe.test(email)) {
        await client.query('ROLLBACK');
        return { error: { status: 400, message: 'Enter a valid email address' } };
      }
      const dup = await client.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );
      if (dup.rows.length) {
        await client.query('ROLLBACK');
        return { error: { status: 409, message: 'Email already registered' } };
      }
      await client.query('UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2', [email, userId]);
      emailUpdated = true;
    }

    if (!updates.length && body.contacts === undefined && body.partner_preferences === undefined && !emailUpdated) {
      await client.query('ROLLBACK');
      return { error: { status: 400, message: 'No fields to update' } };
    }

    let result = currentResult;

    if (updates.length) {
      updates.push('updated_at = NOW()');
      params.push(profileId);

      result = await client.query(
        `UPDATE profiles SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
        params
      );
    }

    const completedProfile = await refreshProfileCompletion(profileId, client);
    result = { rows: [completedProfile] };

    await client.query('COMMIT');

    const data = result.rows[0];
    coerceWeightKg(data);
    const userId = currentResult.rows[0].user_id;
    if (userId) {
      const userRow = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
      if (userRow.rows.length) data.user_email = userRow.rows[0].email;
    }
    data.contacts = await getProfileContacts(profileId);
    data.partner_preferences = await getPartnerPreferences(profileId);
    return { data };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updateMyProfile(req, res) {
  try {
    const currentResult = await pool.query('SELECT id FROM profiles WHERE user_id = $1', [req.user.id]);
    if (!currentResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const result = await updateProfileById(currentResult.rows[0].id, req.body, { requireContacts: true });
    if (result.error) {
      return res.status(result.error.status).json({ success: false, message: result.error.message });
    }

    res.json({ success: true, data: result.data, message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function adminUpdateProfile(req, res) {
  try {
    const result = await updateProfileById(req.params.id, req.body, {
      requireContacts: false,
      optionalLocation: true,
    });
    if (result.error) {
      return res.status(result.error.status).json({ success: false, message: result.error.message });
    }
    res.json({ success: true, data: result.data, message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function adminCreateProfile(req, res) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const body = req.body || {};
    const normalized = normalizeProfileBody(body, { optionalLocation: true });
    if (normalized.error) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: normalized.error });
    }
    const payload = normalized.data;

    if (payload.gender !== 'male' && payload.gender !== 'female') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Please select Man or Woman' });
    }

    const stamp = Date.now().toString(36);
    const email = (body.email || `admin.profile.${stamp}@humrishta.local`).toLowerCase().trim();
    const password = body.password || 'User@123';

    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 12);
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, phone, role, is_active, is_verified)
       VALUES ($1, $2, $3, 'user', true, true)
       RETURNING id, email`,
      [email, hash, body.phone || null]
    );
    const userId = userResult.rows[0].id;

    const firstName = payload.first_name || 'Profile';
    const lastName = payload.last_name || stamp.toUpperCase();
    const gender = payload.gender;
    const dob = payload.date_of_birth || '2000-06-15';
    const city = payload.city || '---';
    const province = payload.province || null;
    const country = payload.country
      || (province === 'Overseas' ? null : 'Pakistan');

    const required = ['first_name', 'last_name', 'gender', 'date_of_birth', 'city', 'province', 'education'];
    const merged = {
      first_name: firstName,
      last_name: lastName,
      gender,
      date_of_birth: dob,
      city,
      province,
      education: payload.education,
      about_me: payload.about_me,
    };
    const isComplete = required.every((f) => merged[f]);

    const profileResult = await client.query(
      `INSERT INTO profiles (
         user_id, first_name, last_name, gender, date_of_birth, height_cm, weight_kg,
         marital_status, religion, sect, caste, mother_tongue, languages, disability, color,
         guardian_type, guardian_name,
         house_own_location, house_rent_location, profile_photo,
         city, province, country, education, profession, income_range,
         about_me, looking_for, family_details, visibility, hafiz_quran,
         is_profile_complete, is_verified
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33
       ) RETURNING *`,
      [
        userId,
        firstName,
        lastName,
        gender,
        dob,
        payload.height_cm ?? null,
        payload.weight_kg ?? null,
        payload.marital_status ?? null,
        payload.religion ?? null,
        payload.sect ?? null,
        payload.caste ?? null,
        payload.mother_tongue ?? null,
        payload.languages ?? null,
        payload.disability ?? null,
        payload.color ?? null,
        payload.guardian_type ?? null,
        payload.guardian_name ?? null,
        payload.house_own_location ?? null,
        payload.house_rent_location ?? null,
        payload.profile_photo ?? null,
        city,
        province,
        country || 'Pakistan',
        payload.education ?? null,
        payload.profession ?? null,
        payload.income_range ?? null,
        payload.about_me ?? null,
        payload.looking_for ?? null,
        payload.family_details ?? null,
        payload.visibility || 'public',
        payload.hafiz_quran ?? null,
        isComplete,
        true,
      ]
    );

    const profileId = profileResult.rows[0].id;

    if (body.contacts !== undefined) {
      await saveProfileContacts(profileId, body.contacts, client);
    }
    if (body.partner_preferences !== undefined) {
      await savePartnerPreferences(profileId, body.partner_preferences, client);
    }

    await client.query('COMMIT');

    const data = profileResult.rows[0];
    data.age = calcAge(data.date_of_birth);
    data.user_email = email;
    data.contacts = await getProfileContacts(profileId);
    data.partner_preferences = await getPartnerPreferences(profileId);

    res.status(201).json({
      success: true,
      data,
      message: 'Profile created',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
}

async function sendInterest(req, res) {
  try {
    const { receiver_id, message } = req.body;
    const senderResult = await pool.query('SELECT id FROM profiles WHERE user_id = $1', [req.user.id]);
    if (!senderResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Complete your profile first' });
    }

    const senderId = senderResult.rows[0].id;
    if (senderId === receiver_id) {
      return res.status(400).json({ success: false, message: 'Cannot send interest to yourself' });
    }

    const result = await pool.query(
      `INSERT INTO interests (sender_id, receiver_id, message)
       VALUES ($1, $2, $3) RETURNING *`,
      [senderId, receiver_id, message || null]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Interest sent!' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'Interest already sent' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getMyInterests(req, res) {
  try {
    const profileResult = await pool.query('SELECT id FROM profiles WHERE user_id = $1', [req.user.id]);
    if (!profileResult.rows.length) {
      return res.json({ success: true, data: { sent: [], received: [] } });
    }

    const profileId = profileResult.rows[0].id;
    const [sent, received] = await Promise.all([
      pool.query(
        `SELECT i.*, p.first_name, p.last_name, p.gender, p.city, p.profile_photo,
                EXTRACT(YEAR FROM AGE(p.date_of_birth))::int as age
         FROM interests i JOIN profiles p ON p.id = i.receiver_id
         WHERE i.sender_id = $1 ORDER BY i.created_at DESC`,
        [profileId]
      ),
      pool.query(
        `SELECT i.*, p.first_name, p.last_name, p.gender, p.city, p.profile_photo,
                EXTRACT(YEAR FROM AGE(p.date_of_birth))::int as age
         FROM interests i JOIN profiles p ON p.id = i.sender_id
         WHERE i.receiver_id = $1 ORDER BY i.created_at DESC`,
        [profileId]
      ),
    ]);

    res.json({ success: true, data: { sent: sent.rows, received: received.rows } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

function preferenceValues(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function preferenceMatches(preference, candidateValue) {
  if (!preference || !candidateValue) return false;
  const candidate = String(candidateValue).trim().toLowerCase();
  return preferenceValues(preference).some((value) => (
    candidate === value || candidate.includes(value) || value.includes(candidate)
  ));
}

async function getMatchingProfiles(req, res) {
  try {
    const ownResult = await pool.query(
      `SELECT p.*
       FROM profiles p
       WHERE p.user_id = $1`,
      [req.user.id]
    );
    if (!ownResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const own = ownResult.rows[0];
    const refreshedOwn = await refreshProfileCompletion(own.id);
    if (!refreshedOwn?.is_profile_complete) {
      return res.status(403).json({
        success: false,
        message: 'Complete your profile to view matching profiles',
      });
    }

    const preferences = await getPartnerPreferences(own.id) || {};
    const candidateResult = await pool.query(
      `SELECT p.*, EXTRACT(YEAR FROM AGE(p.date_of_birth))::int AS age
       FROM profiles p
       JOIN users u ON u.id = p.user_id
       WHERE p.id <> $1
         AND p.gender <> $2
         AND p.visibility = 'public'
         AND p.is_profile_complete = true
         AND u.is_active = true`,
      [own.id, own.gender]
    );

    const minAgeFilter = parseOptionalInt(req.query.min_age) ?? parseOptionalInt(preferences.min_age);
    const maxAgeFilter = parseOptionalInt(req.query.max_age) ?? parseOptionalInt(preferences.max_age);
    const scored = candidateResult.rows
      .filter((candidate) => {
        if (req.query.city && !preferenceMatches(req.query.city, candidate.city)) return false;
        if (req.query.province && !preferenceMatches(req.query.province, candidate.province)) return false;
        if (req.query.country && !preferenceMatches(req.query.country, candidate.country)) return false;
        if (req.query.religion && !preferenceMatches(req.query.religion, candidate.religion)) return false;
        if (req.query.education && !preferenceMatches(req.query.education, candidate.education)) return false;
        if (req.query.marital_status && candidate.marital_status !== req.query.marital_status) return false;
        if (minAgeFilter !== null && candidate.age < minAgeFilter) return false;
        if (maxAgeFilter !== null && candidate.age > maxAgeFilter) return false;
        return true;
      })
      .map((candidate) => {
        let score = 25; // Opposite gender + complete, active public profile.
        const reasons = ['Profile complete'];
        const checks = [
          ['religion', 15, 'Religion'],
          ['sect', 10, 'Sect'],
          ['caste', 10, 'Caste'],
          ['province', 10, 'State'],
          ['city', 10, 'City'],
          ['education', 10, 'Education'],
          ['profession', 5, 'Profession'],
          ['marital_status', 5, 'Marital status'],
        ];
        for (const [field, points, label] of checks) {
          if (preferenceMatches(preferences[field], candidate[field])) {
            score += points;
            reasons.push(label);
          }
        }
        if (
          (preferences.min_age == null || candidate.age >= preferences.min_age)
          && (preferences.max_age == null || candidate.age <= preferences.max_age)
        ) {
          score += 10;
          reasons.push('Preferred age');
        }
        if (
          (preferences.min_height_cm == null || candidate.height_cm >= preferences.min_height_cm)
          && (preferences.max_height_cm == null || candidate.height_cm <= preferences.max_height_cm)
        ) {
          score += 5;
          reasons.push('Preferred height');
        }

        stripNonAdminProfileFields(candidate, req.user?.role === 'admin');
        if (req.user?.role !== 'admin') hideCompleteAddress(candidate);
        return {
          ...candidate,
          match_score: Math.min(score, 100),
          match_reasons: reasons,
        };
      })
      .sort((a, b) => (
        b.match_score - a.match_score
        || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));

    const page = Math.max(parseOptionalInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseOptionalInt(req.query.limit) || 12, 1), 50);
    const total = scored.length;
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const data = scored.slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getStats(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM profiles p JOIN users u ON u.id = p.user_id WHERE u.is_active = true) as total_profiles,
        (SELECT COUNT(*) FROM interests WHERE status = 'accepted') as successful_matches,
        (SELECT COUNT(*) FROM users WHERE role = 'user' AND is_active = true) as active_users,
        (SELECT COUNT(DISTINCT city) FROM profiles) as cities_covered
    `);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getFilterOptions(req, res) {
  try {
    const [cities, provinces, countries] = await Promise.all([
      pool.query(`SELECT DISTINCT city FROM profiles ORDER BY city`),
      pool.query(`SELECT DISTINCT province FROM profiles ORDER BY province`),
      pool.query(
        `SELECT DISTINCT country FROM profiles
         WHERE country IS NOT NULL AND country != 'Pakistan'
         ORDER BY country`
      ),
    ]);
    const CITIES_BY_PROVINCE = {
      Punjab: ['Lahore', 'Faisalabad', 'Rawalpindi', 'Gujranwala', 'Multan', 'Sialkot', 'Bahawalpur'],
      Sindh: ['Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Mirpur Khas'],
      KPK: ['Peshawar', 'Mardan', 'Mingora', 'Abbottabad', 'Kohat'],
      Balochistan: ['Quetta', 'Turbat', 'Khuzdar', 'Gwadar', 'Hub'],
      Islamabad: [
        'Islamabad', 'F-6', 'F-7', 'G-11', 'G-13', 'I-8', 'Bahria Town', 'DHA Islamabad',
        'Gulberg Greens', 'Soan Garden', 'Bhara Kahu', 'Bani Gala', 'PWD', 'Tarlai', 'Tarnol',
      ],
      'Gilgit-Baltistan': ['Gilgit', 'Skardu', 'Hunza'],
      AJK: ['Muzaffarabad', 'Mirpur', 'Kotli', 'Rawalakot'],
    };
    res.json({
      success: true,
      data: {
        provinces: ['Punjab', 'Sindh', 'KPK', 'Balochistan', 'Gilgit-Baltistan', 'AJK', 'Islamabad', 'Overseas'],
        overseas_countries: [
          'United States', 'Canada', 'United Kingdom', 'United Arab Emirates', 'Saudi Arabia',
          'Qatar', 'Kuwait', 'Oman', 'Bahrain', 'Australia', 'New Zealand', 'Germany', 'France',
          'Malaysia', 'Singapore', 'Turkey', 'Other',
          ...countries.rows.map((r) => r.country).filter(
            (c) => !['United States', 'Canada', 'United Kingdom', 'United Arab Emirates', 'Saudi Arabia',
              'Qatar', 'Kuwait', 'Oman', 'Bahrain', 'Australia', 'New Zealand', 'Germany', 'France',
              'Malaysia', 'Singapore', 'Turkey', 'Other'].includes(c)
          ),
        ],
        cities_by_province: CITIES_BY_PROVINCE,
        cities: cities.rows.map((r) => r.city),
        religions: ['Islam', 'Christianity', 'Hinduism', 'Sikhism', 'Other'],
        sects_by_religion: {
          Islam: ['Sunni', 'Shia', 'Deobandi', 'Barelvi', 'Ahle Hadees', 'Ismaili', 'Other'],
          Christianity: ['Catholic', 'Protestant', 'Orthodox', 'Anglican', 'Pentecostal', 'Seventh-day Adventist', 'Other'],
          Hinduism: ['Shaivism', 'Vaishnavism', 'Shaktism', 'Smartism', 'Other'],
          Other: ['Other'],
        },
        sects: ['Sunni', 'Shia', 'Deobandi', 'Barelvi', 'Ahle Hadees', 'Other'],
        marital_statuses: ['never_married', 'divorced', 'widowed', 'separated'],
        education_levels: [
          'Preschool / Nursery',
          'Kindergarten',
          'Primary / Elementary School',
          'Middle School',
          'Secondary / High School',
          'Higher Secondary / Intermediate / College',
          'Certificate Course',
          'Diploma',
          'Associate Degree',
          "Bachelor's Degree",
          'Postgraduate Diploma',
          "Master's Degree",
          'MPhil',
          'Doctorate / PhD',
          'Postdoctoral Study',
        ],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  searchProfiles, getProfileById,
  getMyProfile, updateMyProfile, adminUpdateProfile, adminCreateProfile, sendInterest, getMyInterests,
  getMatchingProfiles, getStats, getFilterOptions, refreshProfileCompletion,
};
