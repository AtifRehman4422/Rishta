require('dotenv').config();
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const dumpExe = 'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe';
const dbName = process.env.DB_NAME || 'humrishta_db';
const outFile = path.resolve(__dirname, '..', 'database', `${dbName}.sql`);

if (!fs.existsSync(dumpExe)) {
  console.error('mysqldump not found:', dumpExe);
  process.exit(1);
}

const args = [
  `--host=${process.env.DB_HOST || 'localhost'}`,
  `--port=${process.env.DB_PORT || '3306'}`,
  `--user=${process.env.DB_USER || 'root'}`,
  `--password=${process.env.DB_PASSWORD || ''}`,
  '--default-character-set=utf8mb4',
  '--single-transaction',
  '--routines',
  '--events',
  '--add-drop-database',
  '--databases',
  dbName,
  `--result-file=${outFile}`,
];

const child = spawn(dumpExe, args, { windowsHide: true });
let stderr = '';
child.stderr.on('data', (chunk) => {
  stderr += chunk.toString();
});

child.on('close', (code) => {
  const warning = stderr
    .split(/\r?\n/)
    .filter((line) => line && !line.includes('Using a password on the command line'))
    .join('\n')
    .trim();

  if (code !== 0) {
    console.error('Backup failed');
    if (warning) console.error(warning);
    process.exit(code || 1);
  }

  const sizeKb = Math.round(fs.statSync(outFile).size / 102.4) / 10;
  console.log(`Backup saved: ${outFile}`);
  console.log(`Size: ${sizeKb} KB`);
});
