import pkg from 'pg';
import logger from './logger.js';

const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'security_events',
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
});

export default pool;
