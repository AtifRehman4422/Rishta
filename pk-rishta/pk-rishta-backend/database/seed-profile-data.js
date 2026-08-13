const pool = require('../db');
const { SAMPLE_PROFILES } = require('./sample-profiles-data');
const { applyProfileExtras, backfillMissingContacts } = require('./seed-helpers');

/**
 * Backfill / refresh profile contacts, partner preferences, and extra profile fields
 * for all sample users and any profile missing phone numbers.
 */
async function seedProfileData() {
  console.log('Seeding profile data (contacts, partner requirements, extra fields)...');

  for (const p of SAMPLE_PROFILES) {
    const result = await pool.query(
      `SELECT p.id FROM profiles p
       JOIN users u ON u.id = p.user_id
       WHERE u.email = $1`,
      [p.email]
    );
    if (!result.rows.length) {
      console.log(`  ⊘ Skipped (no profile): ${p.email}`);
      continue;
    }
    await applyProfileExtras(result.rows[0].id, p);
    console.log(`  ✓ ${p.first_name} ${p.last_name} — contacts, partner prefs, family details`);
  }

  await backfillMissingContacts();

  console.log('Profile data seeding complete!');
  process.exit(0);
}

seedProfileData().catch((err) => {
  console.error('Profile data seed failed:', err.message);
  process.exit(1);
});
