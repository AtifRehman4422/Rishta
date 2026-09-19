/**
 * Renames MySQL database pkrishta_pk_rishta_db (or legacy pk_rishta_db) → humrishta_db
 * by creating the new DB and moving all tables.
 * Usage: node database/rename-database.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const CANDIDATE_OLD = ['pkrishta_pk_rishta_db', 'pk_rishta_db'];
const NEW_NAME = 'humrishta_db';

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  try {
    const [newRows] = await conn.query('SHOW DATABASES LIKE ?', [NEW_NAME]);
    if (newRows.length) {
      console.log(`Already using ${NEW_NAME}. Nothing to rename.`);
      return;
    }

    let OLD_NAME = null;
    for (const name of CANDIDATE_OLD) {
      const [rows] = await conn.query('SHOW DATABASES LIKE ?', [name]);
      if (rows.length) {
        OLD_NAME = name;
        break;
      }
    }

    if (!OLD_NAME) {
      await conn.query(
        `CREATE DATABASE \`${NEW_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      console.log(`Created empty database ${NEW_NAME} (old DB not found).`);
      return;
    }

    await conn.query(
      `CREATE DATABASE \`${NEW_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );

    const [tables] = await conn.query(
      `SELECT table_name AS name
       FROM information_schema.tables
       WHERE table_schema = ?
         AND table_type = 'BASE TABLE'`,
      [OLD_NAME]
    );

    for (const row of tables) {
      const table = row.name || row.TABLE_NAME || row.Name;
      await conn.query(
        `RENAME TABLE \`${OLD_NAME}\`.\`${table}\` TO \`${NEW_NAME}\`.\`${table}\``
      );
      console.log(`Moved table: ${table}`);
    }

    const [views] = await conn.query(
      `SELECT table_name AS name
       FROM information_schema.tables
       WHERE table_schema = ?
         AND table_type = 'VIEW'`,
      [OLD_NAME]
    );
    for (const row of views) {
      const view = row.name || row.TABLE_NAME || row.Name;
      const [defs] = await conn.query(
        `SELECT VIEW_DEFINITION AS def
         FROM information_schema.views
         WHERE table_schema = ? AND table_name = ?`,
        [OLD_NAME, view]
      );
      if (defs[0]?.def) {
        await conn.query(`CREATE OR REPLACE VIEW \`${NEW_NAME}\`.\`${view}\` AS ${defs[0].def}`);
        await conn.query(`DROP VIEW \`${OLD_NAME}\`.\`${view}\``);
        console.log(`Moved view: ${view}`);
      }
    }

    await conn.query(`DROP DATABASE \`${OLD_NAME}\``);
    console.log(`Dropped old database ${OLD_NAME}`);
    console.log(`Done. Active database is now ${NEW_NAME}`);
    console.log('Update DB_NAME=humrishta_db in your .env file.');
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('Rename failed:', err.message);
  process.exit(1);
});
