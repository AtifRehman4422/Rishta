require('dotenv').config();
const pool = require('../db');
const { buildRows } = require('./dropdown-defaults');

async function seedDropdownOptions({ force = false } = {}) {
  const rows = buildRows();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (force) {
      // Only remove rows that match current built-in seed keys? Safer: never wipe custom.
      // Force only inserts missing builtins.
    }

    let inserted = 0;
    let skipped = 0;

    for (const row of rows) {
      const result = await client.query(
        `INSERT INTO dropdown_options (field_key, category, label, sort_order, is_active)
         SELECT $1::varchar, $2::varchar, $3::text, $4::integer, true
         WHERE NOT EXISTS (
           SELECT 1 FROM dropdown_options
           WHERE field_key = $1::varchar
             AND COALESCE(category, '') = COALESCE($2::varchar, '')
             AND lower(label) = lower($3::text)
         )
         RETURNING id`,
        [row.field_key, row.category, row.label, row.sort_order]
      );
      if (result.rows.length) inserted += 1;
      else skipped += 1;
    }

    await client.query('COMMIT');
    return { inserted, skipped, total: rows.length };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function main() {
  console.log('Seeding complete dropdown option lists...');
  const result = await seedDropdownOptions();
  console.log(`Done. inserted=${result.inserted}, skipped=${result.skipped}, total=${result.total}`);
  process.exit(0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Dropdown seed failed:', err.message);
    process.exit(1);
  });
}

module.exports = { seedDropdownOptions };
