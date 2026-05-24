import pool from '../utils/database.js';
import logger from '../utils/logger.js';

export const createNotification = async (userId, eventId, title, message, severity, source) => {
  const result = await pool.query(
    `INSERT INTO notifications (user_id, event_id, title, message, severity, source)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [userId, eventId, title, message, severity, source]
  );
  return result.rows[0];
};

export const getUserNotifications = async (userId, limit = 50, offset = 0) => {
  const result = await pool.query(
    `SELECT * FROM notifications 
    WHERE user_id = $1 
    ORDER BY created_at DESC 
    LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows;
};

export const getUnreadNotificationCount = async (userId) => {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
    [userId]
  );
  return parseInt(result.rows[0].count);
};

export const markNotificationAsRead = async (notificationId) => {
  const result = await pool.query(
    'UPDATE notifications SET is_read = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
    [notificationId]
  );
  return result.rows[0];
};

export const markAllNotificationsAsRead = async (userId) => {
  const result = await pool.query(
    'UPDATE notifications SET is_read = true, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND is_read = false RETURNING *',
    [userId]
  );
  return result.rows;
};

export const createNotificationHistory = async (userId, notificationId, deliveryMethod, deliveryStatus = 'pending', errorMessage = null) => {
  const result = await pool.query(
    `INSERT INTO notification_history (user_id, notification_id, delivery_method, delivery_status, error_message)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [userId, notificationId, deliveryMethod, deliveryStatus, errorMessage]
  );
  return result.rows[0];
};

export const getNotificationHistory = async (userId, limit = 100, offset = 0) => {
  const result = await pool.query(
    `SELECT nh.*, n.title, n.message FROM notification_history nh
    JOIN notifications n ON nh.notification_id = n.id
    WHERE nh.user_id = $1
    ORDER BY nh.sent_at DESC
    LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows;
};

export const deleteNotification = async (notificationId) => {
  await pool.query(
    'DELETE FROM notifications WHERE id = $1',
    [notificationId]
  );
};

export default {
  createNotification,
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotificationHistory,
  getNotificationHistory,
  deleteNotification,
};
