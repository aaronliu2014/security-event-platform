import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || resolve(__dirname, '../../data/local.db');

let SQL = null;
let db = null;

async function getDb() {
  if (db) return db;
  SQL = await initSqlJs();

  // Ensure data directory exists (e.g., /app/data on Railway)
  const dbDir = dirname(DB_PATH);
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
    logger.info(`Loaded local database from ${DB_PATH}`);
  } else {
    db = new SQL.Database();
    logger.info(`Created new local database at ${DB_PATH}`);
  }
  return db;
}

function saveToDisk() {
  if (!db) return;
  try {
    const data = db.export();
    const d = dirname(DB_PATH);
    if (!existsSync(d)) mkdirSync(d, { recursive: true });
    writeFileSync(DB_PATH, Buffer.from(data));
  } catch (e) {
    // ignore write errors
  }
}

function convertSql(sql, params = []) {
  if (!params || params.length === 0) {
    return { sql: convertPgSyntax(sql), params: [] };
  }

  let converted = sql;
  const sqliteParams = [];

  let paramIndex = 1;
  for (const param of params) {
    const placeholder = '$' + paramIndex;
    if (converted.includes(placeholder)) {
      if (Array.isArray(param)) {
        sqliteParams.push(JSON.stringify(param));
      } else if (typeof param === 'object' && param !== null) {
        sqliteParams.push(JSON.stringify(param));
      } else {
        sqliteParams.push(param);
      }
      converted = converted.replace(placeholder, '?');
    }
    paramIndex++;
  }

  return { sql: convertPgSyntax(converted), params: sqliteParams };
}

function convertPgSyntax(sql) {
  return sql
    .replace(/SERIAL PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')
    .replace(/VARCHAR\(\d+\)/g, 'TEXT')
    .replace(/\bBOOLEAN\b/gi, 'INTEGER')
    .replace(/TIMESTAMP DEFAULT CURRENT_TIMESTAMP/gi, "TEXT DEFAULT (datetime('now'))")
    .replace(/\bTIMESTAMP\b(?!\s+DEFAULT)/gi, 'TEXT')
    .replace(/\bJSON\b/gi, 'TEXT')
    .replace(/\bJSONB\b/gi, 'TEXT')
    .replace(/ILIKE/g, 'LIKE')
    .replace(/CURRENT_TIMESTAMP/gi, "datetime('now')")
    .replace(/NOW\(\)/gi, "datetime('now')")
    .replace(/TEXT\[\]/gi, 'TEXT')
    .replace(/INTEGER\[\]/gi, 'TEXT')
    .replace(/ON CONFLICT\s*\([^)]+\)\s*DO NOTHING/gi, '')
    .replace(/ON CONFLICT\s*\([^)]+\)\s*DO UPDATE SET[^)]*?(?=RETURNING|\s*$)/gi, '')
    .replace(/RETURNING\s+\*?\s*(id,\s*)?(\w+(,\s*\w+)*)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function execAndBuildRows(database, sql) {
  const result = database.exec(sql);
  if (!result || result.length === 0) return [];
  const cols = result[0].columns;
  return result[0].values.map(vals => {
    const row = {};
    cols.forEach((c, i) => { row[c] = vals[i]; });
    return row;
  });
}

const pool = {
  async query(sql, params = []) {
    const database = await getDb();
    try {
      const converted = convertSql(sql, params);

      // For INSERT with RETURNING: use run() to execute, then SELECT the last row
      const upperSql = sql.trim().toUpperCase();
      if (upperSql.startsWith('INSERT') && upperSql.includes('RETURNING')) {
        database.run(converted.sql, converted.params);
        saveToDisk();

        const tableMatch = upperSql.match(/INSERT\s+INTO\s+"?(\w+)"?/i);
        if (tableMatch) {
          const rows = execAndBuildRows(database,
            'SELECT * FROM ' + tableMatch[1] + ' ORDER BY id DESC LIMIT 1');
          if (rows.length > 0) return { rows, rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }

      if (upperSql.startsWith('INSERT') || upperSql.startsWith('UPDATE') || upperSql.startsWith('DELETE')) {
        database.run(converted.sql, converted.params);
        saveToDisk();
        return { rows: [], rowCount: database.getRowsModified() };
      }

      // SELECT queries - use prepare/step for parameter binding
      try {
        const stmt = database.prepare(converted.sql);
        if (converted.params && converted.params.length > 0) {
          stmt.bind(converted.params);
        }
        const selectRows = [];
        while (stmt.step()) {
          selectRows.push(stmt.getAsObject());
        }
        stmt.free();
        return { rows: selectRows, rowCount: selectRows.length };
      } catch (e) {
        // Fallback: try exec with literal SQL (for queries without params)
        const selectRows = execAndBuildRows(database, converted.sql);
        return { rows: selectRows, rowCount: selectRows.length };
      }
    } catch (error) {
      logger.error('Local DB query error: ' + error.message);
      logger.error('SQL: ' + sql.substring(0, 200));
      throw error;
    }
  },

  async connect() {
    await getDb();
    return {
      query: async (s, p) => pool.query(s, p),
      release: () => {},
    };
  },
};

export default pool;
