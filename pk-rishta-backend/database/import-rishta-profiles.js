const bcrypt = require('bcryptjs');
const pool = require('../db');
const { SAMPLE_PROFILES } = require('./sample-profiles-data');
const { parseRishtaProfiles } = require('./parse-rishta-profiles');
const { applyProfileExtras } = require('./seed-helpers');

function clip(value, max) {
  if (typeof value !== 'string') return value;
  return value.length > max ? value.slice(0, max) : value;
}

function sanitizeProfile(p) {
  return {
    ...p,
    first_name: clip(p.first_name, 100),
    last_name: clip(p.last_name, 100),
    city: clip(p.city, 100),
    province: clip(p.province, 100),
    country: clip(p.country || 'Pakistan', 100),
    education: p.education || null,
    profession: p.profession || null,
    income_range: p.income_range ? clip(p.income_range, 50) : null,
    caste: p.caste ? clip(p.caste, 200) : null,
    disability: p.disability ? clip(p.disability, 100) : null,
    partner_preferences: p.partner_preferences
      ? {
          ...p.partner_preferences,
          city: p.partner_preferences.city ? clip(p.partner_preferences.city, 100) : null,
          province: p.partner_preferences.province ? clip(p.partner_preferences.province, 100) : null,
          education: p.partner_preferences.education || null,
          profession: p.partner_preferences.profession || null,
        }
      : null,
  };
}

async function upsertProfile(userId, p) {
  const existingProfile = await pool.query('SELECT id FROM profiles WHERE user_id = $1', [userId]);
  let profileId;

  const fields = [
    p.first_name, p.last_name, p.gender, p.date_of_birth, p.height_cm,
    p.city, p.province ?? null, p.country || 'Pakistan', p.education, p.profession, p.income_range || null,
    p.about_me, p.marital_status ?? null, p.religion ?? null, p.sect || null,
    p.caste ?? null, p.disability ?? null, p.mother_tongue ?? null, p.family_details || null,
  ];

  if (existingProfile.rows.length) {
    profileId = existingProfile.rows[0].id;
    await pool.query(
      `UPDATE profiles SET
         first_name = $2, last_name = $3, gender = $4, date_of_birth = $5, height_cm = $6,
         city = $7, province = $8, country = $9, education = $10, profession = $11, income_range = $12,
         about_me = $13, is_profile_complete = true, is_verified = true,
         marital_status = $14, religion = $15, sect = $16, caste = $17, disability = $18,
         mother_tongue = $19, family_details = $20, updated_at = NOW()
       WHERE id = $1`,
      [profileId, ...fields]
    );
  } else {
    const profileResult = await pool.query(
      `INSERT INTO profiles (
        user_id, first_name, last_name, gender, date_of_birth, height_cm,
        city, province, country, education, profession, income_range, about_me,
        marital_status, religion, sect, caste, disability, mother_tongue, family_details,
        is_profile_complete, is_verified, visibility
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,true,true,'public')
      RETURNING id`,
      [userId, ...fields]
    );
    profileId = profileResult.rows[0].id;
  }

  await applyProfileExtras(profileId, p);
  return profileId;
}

async function seedUserProfile(p) {
  const hash = await bcrypt.hash(p.password, 12);
  const userResult = await pool.query(
    `INSERT INTO users (email, password_hash, role, is_active, is_verified)
     VALUES ($1, $2, 'user', true, true)
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       is_active = true,
       is_verified = true,
       updated_at = NOW()
     RETURNING id`,
    [p.email, hash]
  );

  await upsertProfile(userResult.rows[0].id, p);
}

async function importRishtaProfiles() {
  console.log('Importing rishta profiles from text file...');

  const adminEmail = 'atif-admin442@pkrishta.com';
  const rishtaProfiles = parseRishtaProfiles();
  const allProfiles = [...SAMPLE_PROFILES, ...rishtaProfiles];

  console.log(`Parsed ${rishtaProfiles.length} profiles from file`);
  console.log(`Total with demo users: ${allProfiles.length}`);

  const keepEmails = [adminEmail, ...allProfiles.map((p) => p.email)];
  const removed = await pool.query(
    `DELETE FROM users WHERE role = 'user' AND NOT (email = ANY($1)) RETURNING email`,
    [keepEmails]
  );
  if (removed.rows.length) {
    console.log(`Removed ${removed.rows.length} old user profile(s)`);
  }

  let count = 0;
  for (const p of allProfiles) {
    await seedUserProfile(sanitizeProfile(p));
    count++;
    if (count % 10 === 0) console.log(`  ... ${count} profiles imported`);
  }

  console.log(`\n✓ Successfully imported ${count} profiles`);
  console.log('\nDemo logins:');
  console.log('  Ahmed Khan: ahmed.khan@example.com / User@123');
  console.log('  Zainab Hussain: zainab.hussain@example.com / User@123');
  console.log(`  All imported profiles password: User@123`);
}

if (require.main === module) {
  importRishtaProfiles()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Import failed:', err.message);
      process.exit(1);
    });
}

module.exports = { importRishtaProfiles, upsertProfile, seedUserProfile };
