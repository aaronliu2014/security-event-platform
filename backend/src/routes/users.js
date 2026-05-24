import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { schemas, validate } from '../validators/index.js';
import * as userService from '../services/userService.js';
import * as notificationModel from '../models/Notification.js';
import * as analysisService from '../services/analysisService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/users/profile
 * Get authenticated user's profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const profile = await userService.getUserProfile(userId);

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    logger.error(`Error fetching profile: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
    });
  }
});

/**
 * PUT /api/users/profile
 * Update user's profile
 */
router.put('/profile', authenticateToken, validate(schemas.updateProfile), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { full_name } = req.body;

    const updatedUser = await userService.updateUserProfile(userId, { full_name });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    logger.error(`Error updating profile: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
    });
  }
});

/**
 * GET /api/users/preferences
 * Get user's preferences
 */
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const preferences = await userService.getUserPreferences(userId);

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    logger.error(`Error fetching preferences: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch preferences',
    });
  }
});

/**
 * PUT /api/users/preferences
 * Update user's preferences
 */
router.put('/preferences', authenticateToken, validate(schemas.updatePreferences), async (req, res) => {
  try {
    const userId = req.user.userId;
    const updates = req.body;

    const preferences = await userService.updateUserPreferences(userId, updates);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: preferences,
    });
  } catch (error) {
    logger.error(`Error updating preferences: ${error.message}`);
    const statusCode = error.message.includes('Invalid') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/users/notifications
 * Get user's notifications
 */
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 50, offset = 0 } = req.query;

    const notifications = await notificationModel.getUserNotifications(
      userId,
      Math.min(parseInt(limit), 100),
      parseInt(offset)
    );

    const unreadCount = await notificationModel.getUnreadNotificationCount(userId);

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      total: notifications.length,
    });
  } catch (error) {
    logger.error(`Error fetching notifications: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
    });
  }
});

/**
 * PUT /api/users/notifications/:id/read
 * Mark notification as read
 */
router.put('/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notification = await notificationModel.markNotificationAsRead(notificationId);

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    logger.error(`Error marking notification as read: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
    });
  }
});

/**
 * PUT /api/users/notifications/mark-all-read
 * Mark all notifications as read
 */
router.put('/notifications/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const notifications = await notificationModel.markAllNotificationsAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: notifications,
    });
  } catch (error) {
    logger.error(`Error marking all notifications as read: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notifications as read',
    });
  }
});

/**
 * GET /api/users/notifications/history
 * Get notification history
 */
router.get('/notifications/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 100, offset = 0 } = req.query;

    const history = await notificationModel.getNotificationHistory(
      userId,
      Math.min(parseInt(limit), 100),
      parseInt(offset)
    );

    res.json({
      success: true,
      data: history,
      total: history.length,
    });
  } catch (error) {
    logger.error(`Error fetching notification history: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification history',
    });
  }
});

/**
 * DELETE /api/users/notifications/:id
 * Delete a notification
 */
router.delete('/notifications/:id', authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    await notificationModel.deleteNotification(notificationId);

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    logger.error(`Error deleting notification: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification',
    });
  }
});

export default router;
