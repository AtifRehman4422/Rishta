const pool = require('../db');

async function insertContacts(profileId, contacts) {
  await pool.query('DELETE FROM profile_contacts WHERE profile_id = $1', [profileId]);
  let order = 0;
  for (const c of contacts) {
    await pool.query(
      `INSERT INTO profile_contacts (profile_id, contact_type, number, sort_order)
       VALUES ($1, $2, $3, $4)`,
      [profileId, c.type, c.number, order++]
    );
  }
}

async function upsertPartnerPreferences(profileId, prefs) {
  if (!prefs) return;
  await pool.query(
    `INSERT INTO partner_preferences (
       profile_id, min_age, max_age, min_height_cm, max_height_cm,
       religion, sect, city, province, education, profession, marital_status, requirements_notes
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     ON CONFLICT (profile_id) DO UPDATE SET
       min_age = EXCLUDED.min_age,
       max_age = EXCLUDED.max_age,
       min_height_cm = EXCLUDED.min_height_cm,
       max_height_cm = EXCLUDED.max_height_cm,
       religion = EXCLUDED.religion,
       sect = EXCLUDED.sect,
       city = EXCLUDED.city,
       province = EXCLUDED.province,
       education = EXCLUDED.education,
       profession = EXCLUDED.profession,
       marital_status = EXCLUDED.marital_status,
       requirements_notes = EXCLUDED.requirements_notes,
       updated_at = NOW()`,
    [
      profileId,
      prefs.min_age ?? null,
      prefs.max_age ?? null,
      prefs.min_height_cm ?? null,
      prefs.max_height_cm ?? null,
      prefs.religion ?? null,
      prefs.sect ?? null,
      prefs.city ?? null,
      prefs.province ?? null,
      prefs.education ?? null,
      prefs.profession ?? null,
      prefs.marital_status ?? null,
      prefs.requirements_notes ?? null,
    ]
  );
}

async function clearPartnerPreferences(profileId) {
  await pool.query('DELETE FROM partner_preferences WHERE profile_id = $1', [profileId]);
}

async function updateProfileFields(profileId, p) {
  await pool.query(
    `UPDATE profiles SET
       marital_status = $2,
       religion = $3,
       sect = $4,
       caste = $5,
       mother_tongue = $6,
       family_details = $7,
       about_me = COALESCE(NULLIF($8, ''), about_me),
       updated_at = NOW()
     WHERE id = $1`,
    [
      profileId,
      p.marital_status ?? null,
      p.religion ?? null,
      p.sect ?? null,
      p.caste ?? null,
      p.mother_tongue ?? null,
      p.family_details ?? null,
      p.about_me || '',
    ]
  );
}

async function applyProfileExtras(profileId, p) {
  await updateProfileFields(profileId, p);
  if (p.contacts?.length) {
    await insertContacts(profileId, p.contacts);
  }
  if (p.partner_preferences) {
    await upsertPartnerPreferences(profileId, p.partner_preferences);
  } else {
    await clearPartnerPreferences(profileId);
  }
}

async function backfillMissingContacts() {
  const missing = await pool.query(
    `SELECT p.id, p.first_name, p.last_name, u.email
     FROM profiles p
     JOIN users u ON u.id = p.user_id
     WHERE NOT EXISTS (SELECT 1 FROM profile_contacts pc WHERE pc.profile_id = p.id)`
  );

  for (const row of missing.rows) {
    const digits = row.id.replace(/\D/g, '').slice(0, 7).padEnd(7, '0');
    await insertContacts(row.id, [
      { type: 'phone', number: `+92 300 ${digits.slice(0, 3)} ${digits.slice(3)}` },
      { type: 'whatsapp', number: `+92 321 ${digits.slice(0, 3)} ${digits.slice(3)}` },
    ]);
    console.log(`  ✓ Default contacts for ${row.first_name} ${row.last_name} (${row.email})`);
  }
}

module.exports = {
  insertContacts,
  upsertPartnerPreferences,
  clearPartnerPreferences,
  updateProfileFields,
  applyProfileExtras,
  backfillMissingContacts,
};
