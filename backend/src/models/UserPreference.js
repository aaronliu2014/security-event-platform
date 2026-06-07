import pool from '../utils/database.js';
import logger from '../utils/logger.js';

export const getUserPreferences = async (userId) => {
  const result = await pool.query(
    'SELECT * FROM user_preferences WHERE user_id = $1',
    [userId]
  );
  return result.rows[0] || null;
};

export const createUserPreferences = async (userId, preferences = {}) => {
  const {
    collection_frequency = 'daily',
    notification_enabled = true,
    email_notification_enabled = true,
    data_sources = [],
    alert_severity_threshold = 'medium',
  } = preferences;

  const result = await pool.query(
    `INSERT INTO user_preferences 
    (user_id, collection_frequency, notification_enabled, email_notification_enabled, data_sources, alert_severity_threshold)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [userId, collection_frequency, notification_enabled, email_notification_enabled, JSON.stringify(data_sources), alert_severity_threshold]
  );
  return result.rows[0];
};

export const updateUserPreferences = async (userId, updates) => {
  const {
    collection_frequency,
    notification_enabled,
    email_notification_enabled,
    data_sources,
    alert_severity_threshold,
  } = updates;

  const fields = [];
  const values = [];
  let paramCount = 1;

  if (collection_frequency !== undefined) {
    fields.push(`collection_frequency = $${paramCount++}`);
    values.push(collection_frequency);
  }
  if (notification_enabled !== undefined) {
    fields.push(`notification_enabled = $${paramCount++}`);
    values.push(notification_enabled);
  }
  if (email_notification_enabled !== undefined) {
    fields.push(`email_notification_enabled = $${paramCount++}`);
    values.push(email_notification_enabled);
  }
  if (data_sources !== undefined) {
    fields.push(`data_sources = $${paramCount++}`);
    values.push(JSON.stringify(data_sources));
  }
  if (alert_severity_threshold !== undefined) {
    fields.push(`alert_severity_threshold = $${paramCount++}`);
    values.push(alert_severity_threshold);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(userId);

  const query = `UPDATE user_preferences SET ${fields.join(', ')} WHERE user_id = $${paramCount} RETURNING *`;

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    logger.error(`Error updating user preferences: ${error.message}`);
    throw error;
  }
};

export default {
  getUserPreferences,
  createUserPreferences,
  updateUserPreferences,
};
