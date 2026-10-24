const pool = require('../db');
const { seedDropdownOptions } = require('./seed-dropdown-options');

async function migrate() {
  console.log('Checking MySQL tables...');
  const tables = await pool.query(
    `SELECT COUNT(*) AS count
     FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = 'users'`
  );

  if (!Number(tables.rows[0]?.count)) {
    console.error('MySQL tables missing. Run the MySQL schema in Workbench first.');
    process.exit(1);
  }

  try {
    await pool.query('ALTER TABLE profiles ADD COLUMN languages VARCHAR(200) NULL');
    console.log('Added profiles.languages');
  } catch (err) {
    if (err.errno !== 1060 && !/duplicate column/i.test(err.message || '')) {
      throw err;
    }
  }

  console.log('Tables found. Seeding dropdown option lists...');
  const seed = await seedDropdownOptions();
  console.log(`Dropdown seed: inserted=${seed.inserted}, skipped=${seed.skipped}, total=${seed.total}`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_activity_events (
      id CHAR(36) NOT NULL PRIMARY KEY,
      visitor_key VARCHAR(64) NOT NULL,
      user_id CHAR(36) NULL,
      event_type VARCHAR(30) NOT NULL,
      payload JSON NULL,
      path VARCHAR(200) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_activity_visitor_created (visitor_key, created_at),
      KEY idx_activity_user_created (user_id, created_at),
      KEY idx_activity_type_created (event_type, created_at),
      KEY idx_activity_created (created_at),
      CONSTRAINT fk_activity_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('Ensured user_activity_events table');

  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
