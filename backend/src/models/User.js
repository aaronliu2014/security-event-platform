import pool from '../utils/database.js';
import logger from '../utils/logger.js';

export const initializeUserTables = async () => {
  const client = await pool.connect();
  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'viewer',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_preferences table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        collection_frequency VARCHAR(50) DEFAULT 'daily',
        notification_enabled BOOLEAN DEFAULT true,
        email_notification_enabled BOOLEAN DEFAULT true,
        data_sources JSON DEFAULT '[]',
        alert_severity_threshold VARCHAR(20) DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      )
    `);

    // Create event_tags table
    await client.query(`
      CREATE TABLE IF NOT EXISTS event_tags (
        id SERIAL PRIMARY KEY,
        event_id INTEGER,
        tag_name VARCHAR(100),
        severity VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_id, tag_name)
      )
    `);

    // Create notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        event_id INTEGER,
        title VARCHAR(255),
        message TEXT,
        severity VARCHAR(20),
        source VARCHAR(100),
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create notification_history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notification_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        notification_id INTEGER REFERENCES notifications(id) ON DELETE CASCADE,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        delivery_method VARCHAR(50),
        delivery_status VARCHAR(20) DEFAULT 'pending',
        error_message TEXT
      )
    `);

    // Create events table (core data table)
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        external_id VARCHAR(255) UNIQUE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        source VARCHAR(100) NOT NULL,
        source_url VARCHAR(500),
        event_type VARCHAR(50),
        severity VARCHAR(20),
        affected_products TEXT[],
        published_date TIMESTAMP,
        collected_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create event_clusters table
    await client.query(`
      CREATE TABLE IF NOT EXISTS event_clusters (
        id SERIAL PRIMARY KEY,
        cluster_name VARCHAR(255) NOT NULL,
        description TEXT,
        event_ids INTEGER[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create collection_tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS collection_tasks (
        id SERIAL PRIMARY KEY,
        task_name VARCHAR(100),
        source VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending',
        last_run_date TIMESTAMP,
        next_run_date TIMESTAMP,
        items_processed INTEGER DEFAULT 0,
        items_failed INTEGER DEFAULT 0,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(task_name, source)
      )
    `);

    logger.info('User tables initialized successfully');
  } catch (error) {
    logger.error(`Error initializing user tables: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
};

export const createUser = async (email, username, passwordHash, fullName = null) => {
  const result = await pool.query(
    'INSERT INTO users (email, username, password_hash, full_name) VALUES ($1, $2, $3, $4) RETURNING id, email, username, full_name, created_at',
    [email, username, passwordHash, fullName]
  );
  return result.rows[0];
};

export const getUserByEmail = async (email) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0];
};

export const getUserById = async (userId) => {
  const result = await pool.query(
    'SELECT id, email, username, full_name, created_at, updated_at FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0];
};

export const getUserWithPassword = async (email) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0];
};

export const updateUserProfile = async (userId, updates) => {
  const { full_name } = updates;
  const result = await pool.query(
    'UPDATE users SET full_name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, username, full_name, created_at, updated_at',
    [full_name, userId]
  );
  return result.rows[0];
};

export default {
  initializeUserTables,
  createUser,
  getUserByEmail,
  getUserById,
  getUserWithPassword,
  updateUserProfile,
};
