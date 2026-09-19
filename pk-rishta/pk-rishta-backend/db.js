const crypto = require('crypto');
const mysql = require('mysql2/promise');
require('dotenv').config();

function rewriteSql(sql) {
  let s = String(sql);

  s = s.replace(
    /EXTRACT\s*\(\s*YEAR\s+FROM\s+AGE\s*\(([^)]+)\)\s*\)\s*(::int)?/gi,
    'TIMESTAMPDIFF(YEAR, $1, CURDATE())'
  );
  s = s.replace(/INTERVAL\s+'(\d+)\s+days?'/gi, 'INTERVAL $1 DAY');
  s = s.replace(/::(varchar|text|integer|int|date|json|interval)/gi, '');
  s = s.replace(/(\S+)\s+IS DISTINCT FROM\s+(\S+)/gi, 'NOT ($1 <=> $2)');
  s = s.replace(/\s+NULLS LAST/gi, '');
  s = s.replace(/\bILIKE\b/gi, 'LIKE');
  s = s.replace(/SELECT\s+COUNT\(\*\)(?!\s+AS\b)/gi, 'SELECT COUNT(*) AS count');

  if (/ON CONFLICT\s*\([^)]+\)\s*DO NOTHING/i.test(s)) {
    s = s.replace(/ON CONFLICT\s*\([^)]+\)\s*DO NOTHING/gi, '');
    s = s.replace(/^INSERT\s+INTO/i, 'INSERT IGNORE INTO');
  }

  s = s.replace(/ON CONFLICT\s*\([^)]+\)\s*DO UPDATE SET/gi, 'ON DUPLICATE KEY UPDATE');
  s = s.replace(/\bEXCLUDED\.(\w+)/g, 'VALUES($1)');

  return s;
}

function convertPlaceholders(sql, params = []) {
  const mysqlParams = [];
  const mysqlSql = sql.replace(/\$(\d+)/g, (_, n) => {
    mysqlParams.push(params[Number(n) - 1]);
    return '?';
  });
  return { sql: mysqlSql, params: mysqlParams };
}

function mapDbError(err) {
  if (err && (err.errno === 1062 || err.code === 'ER_DUP_ENTRY')) {
    err.code = '23505';
  }
  return err;
}

function resultFromHeader(header) {
  return {
    rows: [],
    rowCount: header?.affectedRows ?? 0,
    insertId: header?.insertId,
    header,
  };
}

function wrapRows(rows, extra) {
  if (Array.isArray(rows)) {
    return { rows, rowCount: extra?.affectedRows ?? rows.length };
  }
  return resultFromHeader(rows);
}

function stripReturning(sql) {
  const match = String(sql).match(/\sRETURNING\s+(.+)$/is);
  if (!match) return { sql: String(sql).trim(), returning: null };
  return {
    sql: String(sql).slice(0, match.index).trim(),
    returning: match[1].trim(),
  };
}

function injectInsertId(sql, newId) {
  if (/VALUES\s*\(/i.test(sql)) {
    return sql.replace(
      /^(INSERT\s+(?:IGNORE\s+)?INTO\s+\w+\s*\()([^)]+)(\)\s*VALUES\s*\()/i,
      `$1id, $2$3'${newId}', `
    );
  }
  if (/\bSELECT\b/i.test(sql)) {
    return sql.replace(
      /^(INSERT\s+(?:IGNORE\s+)?INTO\s+\w+\s*\()([^)]+)(\)\s*SELECT\s+)/i,
      `$1id, $2$3'${newId}', `
    );
  }
  return null;
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_MAX || '50', 10),
  charset: 'utf8mb4',
  typeCast(field, next) {
    if (field.type === 'TINY' && field.length === 1) {
      const value = field.string();
      return value === null ? null : value === '1';
    }
    return next();
  },
});

function createQuery(executor) {
  async function raw(sql, params = []) {
    const rewritten = rewriteSql(sql);
    const converted = convertPlaceholders(rewritten, params);
    try {
      const [rows, extra] = await executor.query(converted.sql, converted.params);
      return wrapRows(rows, extra);
    } catch (err) {
      throw mapDbError(err);
    }
  }

  return async function query(sql, params = []) {
    const trimmed = String(sql).trim();
    if (/^BEGIN$/i.test(trimmed)) {
      if (executor.beginTransaction) await executor.beginTransaction();
      return { rows: [], rowCount: 0 };
    }
    if (/^COMMIT$/i.test(trimmed)) {
      if (executor.commit) await executor.commit();
      return { rows: [], rowCount: 0 };
    }
    if (/^ROLLBACK$/i.test(trimmed)) {
      if (executor.rollback) await executor.rollback();
      return { rows: [], rowCount: 0 };
    }

    const rewritten = rewriteSql(sql);
    const { sql: baseSql, returning } = stripReturning(rewritten);
    if (!returning) {
      return raw(baseSql, params);
    }

    if (/^UPDATE/i.test(baseSql)) {
      const table = baseSql.match(/^UPDATE\s+(\w+)/i)[1];
      const where = (baseSql.match(/\bWHERE\b(.+)$/is) || ['', '1=1'])[1];
      const preview = await raw(`SELECT id FROM ${table} WHERE ${where}`, params);
      await raw(baseSql, params);
      const ids = preview.rows.map((row) => row.id).filter(Boolean);
      if (!ids.length) return { rows: [], rowCount: 0 };
      if (ids.length === 1) {
        return raw(`SELECT ${returning} FROM ${table} WHERE id = $1`, [ids[0]]);
      }
      const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
      return raw(`SELECT ${returning} FROM ${table} WHERE id IN (${placeholders})`, ids);
    }

    if (/^DELETE/i.test(baseSql)) {
      const table = baseSql.match(/^DELETE\s+FROM\s+(\w+)/i)[1];
      const where = (baseSql.match(/\bWHERE\b(.+)$/is) || ['', '1=1'])[1];
      const selected = await raw(`SELECT ${returning} FROM ${table} WHERE ${where}`, params);
      await raw(baseSql, params);
      return selected;
    }

    if (/^INSERT/i.test(baseSql)) {
      const tableMatch = baseSql.match(/^INSERT\s+(?:IGNORE\s+)?INTO\s+(\w+)/i);
      const table = tableMatch?.[1];
      const colsMatch = baseSql.match(/^INSERT\s+(?:IGNORE\s+)?INTO\s+\w+\s*\(([^)]+)\)/i);
      const cols = colsMatch ? colsMatch[1].split(',').map((col) => col.trim()) : [];
      const hasOnDup = /ON DUPLICATE KEY UPDATE/i.test(baseSql);
      const isIgnore = /^INSERT IGNORE/i.test(baseSql);

      if (table && cols.length && !cols.includes('id') && !hasOnDup) {
        const newId = crypto.randomUUID();
        const injected = injectInsertId(baseSql, newId);
        if (injected) {
          const inserted = await raw(injected, params);
          if (isIgnore && inserted.rowCount === 0) {
            return { rows: [], rowCount: 0 };
          }
          return raw(`SELECT ${returning} FROM ${table} WHERE id = $1`, [newId]);
        }
      }

      await raw(baseSql, params);
      return { rows: [], rowCount: 0 };
    }

    return raw(baseSql, params);
  };
}

const query = createQuery(pool);

async function connect() {
  const conn = await pool.getConnection();
  return {
    query: createQuery(conn),
    release() {
      conn.release();
    },
  };
}

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

module.exports = {
  query,
  connect,
  end: () => pool.end(),
};
