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

  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
