const bcrypt = require('bcryptjs');
const pool = require('../db');
const { importRishtaProfiles } = require('./import-rishta-profiles');

async function seed() {
  console.log('Seeding database...');

  const adminEmail = 'admin442@humrishta.com';
  const adminPassword = 'ARadmin@442';
  const adminHash = await bcrypt.hash(adminPassword, 12);

  const existingAdmin = await pool.query(
    `SELECT id FROM users WHERE email IN (
       'admin@pkrishta.com',
       'atif-admin442@pkrishta.com',
       'atif-admin442@humrishta.com',
       'admin442@humrishta.com'
     ) AND role = 'admin' LIMIT 1`
  );

  if (existingAdmin.rows.length) {
    await pool.query(
      `UPDATE users SET email = $1, password_hash = $2, is_active = true, is_verified = true, updated_at = NOW()
       WHERE id = $3`,
      [adminEmail, adminHash, existingAdmin.rows[0].id]
    );
  } else {
    await pool.query(
      `INSERT INTO users (email, password_hash, role, is_active, is_verified)
       VALUES ($1, $2, 'admin', true, true)
       ON DUPLICATE KEY UPDATE
         password_hash = VALUES(password_hash),
         role = 'admin',
         is_active = true,
         is_verified = true,
         updated_at = NOW()`,
      [adminEmail, adminHash]
    );
  }
  console.log(`Admin user ready: ${adminEmail} / ${adminPassword}`);

  await importRishtaProfiles();

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
