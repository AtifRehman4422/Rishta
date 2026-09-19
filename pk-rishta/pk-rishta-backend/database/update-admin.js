const bcrypt = require('bcryptjs');
const pool = require('../db');

const ADMIN_EMAIL = 'admin442@humrishta.com';
const ADMIN_PASSWORD = 'ARadmin@442';
const LEGACY_EMAILS = [
  'admin442@humrishta.com',
  'atif-admin442@humrishta.com',
  'atif-admin442@pkrishta.com',
  'admin@pkrishta.com',
];

async function updateAdmin() {
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  let existing = { rows: [] };
  for (const email of LEGACY_EMAILS) {
    existing = await pool.query(
      `SELECT id FROM users WHERE email = $1 AND role = 'admin'`,
      [email]
    );
    if (existing.rows.length) break;
  }

  if (!existing.rows.length) {
    existing = await pool.query(
      `SELECT id FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1`
    );
  }

  if (existing.rows.length) {
    await pool.query(
      `UPDATE users SET email = $1, password_hash = $2, is_active = true, is_verified = true, updated_at = NOW()
       WHERE id = $3`,
      [ADMIN_EMAIL, hash, existing.rows[0].id]
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
      [ADMIN_EMAIL, hash]
    );
  }

  console.log(`Admin credentials updated: ${ADMIN_EMAIL}`);
  process.exit(0);
}

updateAdmin().catch((err) => {
  console.error('Failed to update admin:', err.message);
  process.exit(1);
});
