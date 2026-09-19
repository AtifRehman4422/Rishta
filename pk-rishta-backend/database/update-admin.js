const bcrypt = require('bcryptjs');
const pool = require('../db');

const OLD_ADMIN_EMAIL = 'admin@pkrishta.com';
const ADMIN_EMAIL = 'atif-admin442@pkrishta.com';
const ADMIN_PASSWORD = 'ARadmin@442';

async function updateAdmin() {
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const existing = await pool.query(
    `SELECT id FROM users WHERE email = $1 AND role = 'admin'`,
    [OLD_ADMIN_EMAIL]
  );

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
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
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
