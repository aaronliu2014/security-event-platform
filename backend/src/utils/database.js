import pkg from 'pg';
import logger from './logger.js';

const { Pool } = pkg;

let _pool = null;
let _initPromise = null;

function createPostgresPool() {
  // Railway provides DATABASE_URL for managed PostgreSQL
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    return new Pool({
      user: url.username,
      password: url.password,
      host: url.hostname,
      port: url.port || 5432,
      database: url.pathname.slice(1),
      connectionTimeoutMillis: 3000,
      ssl: { rejectUnauthorized: false },
    });
  }

  return new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'security_events',
    connectionTimeoutMillis: 3000,
  });
}

async function getPool() {
  if (_pool) return _pool;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    const pgPool = createPostgresPool();

    try {
      await pgPool.query('SELECT 1');
      _pool = pgPool;
      logger.info('Connected to PostgreSQL database');

      _pool.on('error', (err) => {
        logger.error('Unexpected error on idle client', err);
      });

      return _pool;
    } catch (error) {
      logger.warn(`PostgreSQL not available (${error.message}), falling back to local SQLite`);
      try {
        const { default: localPool } = await import('./localDatabase.js');
        _pool = localPool;
        logger.info('Using local SQLite database');
        return _pool;
      } catch (localError) {
        logger.error(`Failed to initialize local database: ${localError.message}`);
        throw localError;
      }
    }
  })();

  return _initPromise;
}

const pool = {
  async query(sql, params) {
    const p = await getPool();
    return p.query(sql, params);
  },

  async connect() {
    const p = await getPool();
    return p.connect();
  },

  async end() {
    const p = await getPool();
    if (p.end) await p.end();
    _pool = null;
    _initPromise = null;
  },
};

export default pool;
