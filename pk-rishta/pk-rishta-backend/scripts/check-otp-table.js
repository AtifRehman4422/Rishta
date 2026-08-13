require('dotenv').config();
const pool = require('../db');

(async () => {
  const t = await pool.query("SELECT to_regclass('public.auth_otps') AS table_name");
  console.log('auth_otps exists:', t.rows[0].table_name);

  if (!t.rows[0].table_name) {
    console.log('Table missing — run migrate');
    process.exit(2);
  }

  const cols = await pool.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'auth_otps'
    ORDER BY ordinal_position
  `);
  console.log('columns:', cols.rows.map((r) => r.column_name).join(', '));
  process.exit(0);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
