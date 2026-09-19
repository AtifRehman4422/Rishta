const fs = require('fs');
const path = require('path');
const pool = require('../db');
const { seedDropdownOptions } = require('./seed-dropdown-options');

async function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Running database migration...');
  await pool.query(sql);
  console.log('Migration completed successfully!');

  console.log('Seeding dropdown option lists...');
  const seed = await seedDropdownOptions();
  console.log(`Dropdown seed: inserted=${seed.inserted}, skipped=${seed.skipped}, total=${seed.total}`);

  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
