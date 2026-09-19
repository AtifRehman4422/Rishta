require('dotenv').config();
const pool = require('../db');

(async () => {
  const t = await pool.query(
    `SELECT COUNT(*) AS count
     FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = 'auth_otps'`
  );
  const exists = Number(t.rows[0]?.count) > 0;
  console.log('auth_otps exists:', exists ? 'auth_otps' : null);

  if (!exists) {
    console.log('Table missing — create MySQL tables first');
    process.exit(2);
  }

  const cols = await pool.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'auth_otps'
    ORDER BY ordinal_position
  `);
  console.log('columns:', cols.rows.map((r) => r.column_name).join(', '));
  process.exit(0);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
