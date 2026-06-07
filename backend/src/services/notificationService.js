import nodemailer from 'nodemailer';
import pool from '../utils/database.js';
import * as notificationModel from '../models/Notification.js';
import * as userModel from '../models/User.js';
import * as userPrefModel from '../models/UserPreference.js';
import { sendToUser } from '../utils/websocket.js';
import logger from '../utils/logger.js';

// Initialize email transporter
const initializeEmailTransporter = () => {
  const emailConfig = {
    host: process.env.SMTP_HOST || 'localhost',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    } : undefined,
  };

  return nodemailer.createTransport(emailConfig);
};

let emailTransporter = null;

// Send email notification
export const sendEmailNotification = async (userEmail, subject, message, title = null) => {
  try {
    if (!emailTransporter) {
      emailTransporter = initializeEmailTransporter();
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@security-event-platform.local',
      to: userEmail,
      subject: subject,
      html: `
        <h2>${title || subject}</h2>
        <p>${message}</p>
        <hr>
        <small>Security Event Platform</small>
      `,
    };

    await emailTransporter.sendMail(mailOptions);
    logger.info(`Email sent to ${userEmail}`);
    return true;
  } catch (error) {
    logger.error(`Error sending email: ${error.message}`);
    return false;
  }
};

// Create notification with optional email alert
export const createNotification = async (userId, eventId, title, message, severity, source) => {
  try {
    // Create notification record
    const notification = await notificationModel.createNotification(
      userId,
      eventId,
      title,
      message,
      severity,
      source
    );

    // Check user preferences for email notification
    const preferences = await userPrefModel.getUserPreferences(userId);
    const user = await userModel.getUserById(userId);

    if (preferences && preferences.email_notification_enabled && user) {
      // Check if severity meets threshold
      const severityLevels = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      const userThreshold = severityLevels[preferences.alert_severity_threshold] || 2;
      const eventSeverityLevel = severityLevels[severity] || 4;

      if (eventSeverityLevel <= userThreshold) {
        // Send email asynchronously (non-blocking)
        setImmediate(() => {
          sendEmailNotification(
            user.email,
            `[${severity.toUpperCase()}] ${title}`,
            message,
            title
          ).then(success => {
            if (success) {
              notificationModel.createNotificationHistory(
                userId,
                notification.id,
                'email',
                'sent'
              );
            } else {
              notificationModel.createNotificationHistory(
                userId,
                notification.id,
                'email',
                'failed',
                'Failed to send email'
              );
            }
          });
        });
      }
    }


    sendToUser(userId, {
      type: "notification",
      data: notification,
    });
    return notification;
  } catch (error) {
    logger.error(`Error creating notification: ${error.message}`);
    throw error;
  }
};

// Match events to notification rules
export const matchNotificationRules = async (event, userId) => {
  try {
    const preferences = await userPrefModel.getUserPreferences(userId);

    if (!preferences || !preferences.notification_enabled) {
      return false;
    }

    // Check severity threshold
    const severityLevels = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    const userThreshold = severityLevels[preferences.alert_severity_threshold] || 2;
    const eventSeverityLevel = severityLevels[event.severity] || 4;

    if (eventSeverityLevel > userThreshold) {
      return false;
    }

    // Check data sources
    if (preferences.data_sources && preferences.data_sources.length > 0) {
      if (!preferences.data_sources.includes(event.source)) {
        return false;
      }
    }

    return true;
  } catch (error) {
    logger.error(`Error matching notification rules: ${error.message}`);
    return false;
  }
};

// Send notifications to all interested users
export const broadcastNotification = async (event) => {
  try {
    // For now, we'll send to all users with notification enabled
    // In a production system, you'd want more sophisticated subscription management
    const result = await pool.query(
      `SELECT DISTINCT u.id 
      FROM users u
      JOIN user_preferences up ON u.id = up.user_id
      WHERE up.notification_enabled = true`
    );

    const users = result.rows;
    const notifications = [];

    for (const user of users) {
      if (await matchNotificationRules(event, user.id)) {
        const notification = await createNotification(
          user.id,
          event.id,
          event.title,
          event.description || event.title,
          event.severity,
          event.source
        );
        notifications.push(notification);
      }
    }

    logger.info(`Broadcasted notification to ${notifications.length} users`);
    return notifications;
  } catch (error) {
    logger.error(`Error broadcasting notification: ${error.message}`);
    throw error;
  }
};

// Get user's unread notifications
export const getUnreadNotifications = async (userId) => {
  try {
    const notifications = await notificationModel.getUserNotifications(userId, 50, 0);
    return notifications.filter(n => !n.is_read);
  } catch (error) {
    logger.error(`Error fetching unread notifications: ${error.message}`);
    throw error;
  }
};

export default {
  sendEmailNotification,
  createNotification,
  matchNotificationRules,
  broadcastNotification,
  getUnreadNotifications,
};
