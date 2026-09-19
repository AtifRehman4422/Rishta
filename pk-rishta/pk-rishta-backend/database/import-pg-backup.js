require('dotenv').config();
const { Client } = require('pg');
const mysql = require('mysql2/promise');

const TABLES = [
  'users',
  'profiles',
  'partner_preferences',
  'interests',
  'favorites',
  'profile_photos',
  'profile_contacts',
  'admin_logs',
  'contact_access_requests',
  'complaints',
  'complaint_messages',
  'contact_form_messages',
  'site_visitors_daily',
  'dropdown_options',
  'dropdown_option_requests',
  'notifications',
  'auth_otps',
];

function convertValue(value) {
  if (value === null || value === undefined) return null;
  if (Buffer.isBuffer(value)) return value.toString('utf8');
  if (value instanceof Date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
  }
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}

async function mysqlColumns(conn, table) {
  const [rows] = await conn.query(
    `SELECT COLUMN_NAME
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = ?
       AND EXTRA NOT LIKE '%STORED GENERATED%'
       AND EXTRA NOT LIKE '%VIRTUAL GENERATED%'
     ORDER BY ORDINAL_POSITION`,
    [table]
  );
  return rows.map((row) => row.COLUMN_NAME);
}

async function pgColumns(client, table) {
  const result = await client.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position`,
    [table]
  );
  return result.rows.map((row) => row.column_name);
}

async function importTable(pg, mysqlConn, table) {
  const destCols = await mysqlColumns(mysqlConn, table);
  const srcCols = await pgColumns(pg, table);
  const cols = destCols.filter((col) => srcCols.includes(col));
  if (!cols.length) {
    console.log(`  skip ${table}: no matching columns`);
    return { table, read: 0, inserted: 0 };
  }

  const result = await pg.query(`SELECT ${cols.map((c) => `"${c}"`).join(', ')} FROM ${table}`);
  const rows = result.rows;
  if (!rows.length) {
    console.log(`  ${table}: 0 rows`);
    return { table, read: 0, inserted: 0 };
  }

  const placeholders = `(${cols.map(() => '?').join(', ')})`;
  const sql = `INSERT IGNORE INTO ${table} (${cols.join(', ')}) VALUES ${placeholders}`;
  let inserted = 0;

  for (const row of rows) {
    const values = cols.map((col) => convertValue(row[col]));
    const [header] = await mysqlConn.query(sql, values);
    inserted += header.affectedRows ? 1 : 0;
  }

  console.log(`  ${table}: read=${rows.length}, inserted=${inserted}`);
  return { table, read: rows.length, inserted };
}

async function main() {
  const pg = new Client({
    host: 'localhost',
    port: 5432,
    database: 'pk_rishta_backup_import',
    user: 'postgres',
    password: 'postgres',
  });

  const mysqlConn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    charset: 'utf8mb4',
    multipleStatements: true,
  });

  await pg.connect();
  await mysqlConn.query('SET FOREIGN_KEY_CHECKS = 0');
  await mysqlConn.query('SET NAMES utf8mb4');

  console.log('Clearing existing MySQL rows...');
  await mysqlConn.query('TRUNCATE TABLE address_disclosures');
  for (const table of [...TABLES].reverse()) {
    await mysqlConn.query(`TRUNCATE TABLE ${table}`);
  }

  console.log('Importing PostgreSQL backup into MySQL...');
  const summary = [];
  for (const table of TABLES) {
    summary.push(await importTable(pg, mysqlConn, table));
  }

  await mysqlConn.query('SET FOREIGN_KEY_CHECKS = 1');
  await mysqlConn.end();
  await pg.end();

  const read = summary.reduce((sum, row) => sum + row.read, 0);
  const inserted = summary.reduce((sum, row) => sum + row.inserted, 0);
  console.log(`Done. read=${read}, inserted=${inserted}`);
}

main().catch((err) => {
  console.error('Import failed:', err.message);
  process.exit(1);
});
