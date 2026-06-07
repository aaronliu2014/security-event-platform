import * as userModel from '../models/User.js';
import * as userPrefModel from '../models/UserPreference.js';
import logger from '../utils/logger.js';

export const getUserProfile = async (userId) => {
  try {
    const user = await userModel.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const preferences = await userPrefModel.getUserPreferences(userId);

    return {
      ...user,
      preferences: preferences || {},
    };
  } catch (error) {
    logger.error(`Error fetching user profile: ${error.message}`);
    throw error;
  }
};

export const updateUserProfile = async (userId, updates) => {
  try {
    const user = await userModel.updateUserProfile(userId, updates);
    logger.info(`User profile updated: ${userId}`);
    return user;
  } catch (error) {
    logger.error(`Error updating user profile: ${error.message}`);
    throw error;
  }
};

export const getUserPreferences = async (userId) => {
  try {
    const preferences = await userPrefModel.getUserPreferences(userId);
    if (!preferences) {
      // Create default preferences if they don't exist
      return await userPrefModel.createUserPreferences(userId);
    }
    return preferences;
  } catch (error) {
    logger.error(`Error fetching user preferences: ${error.message}`);
    throw error;
  }
};

export const updateUserPreferences = async (userId, updates) => {
  try {
    // First check if preferences exist
    let preferences = await userPrefModel.getUserPreferences(userId);

    if (!preferences) {
      // Create default preferences with updates
      preferences = await userPrefModel.createUserPreferences(userId, updates);
    } else {
      // Update existing preferences
      preferences = await userPrefModel.updateUserPreferences(userId, updates);
    }

    logger.info(`User preferences updated: ${userId}`);
    return preferences;
  } catch (error) {
    logger.error(`Error updating user preferences: ${error.message}`);
    throw error;
  }
};

export const validatePreferences = (preferences) => {
  const validFrequencies = ['hourly', 'daily', 'weekly', 'monthly'];
  const validSeverities = ['critical', 'high', 'medium', 'low', 'info'];

  if (preferences.collection_frequency && !validFrequencies.includes(preferences.collection_frequency)) {
    throw new Error(`Invalid collection frequency. Must be one of: ${validFrequencies.join(', ')}`);
  }

  if (preferences.alert_severity_threshold && !validSeverities.includes(preferences.alert_severity_threshold)) {
    throw new Error(`Invalid severity threshold. Must be one of: ${validSeverities.join(', ')}`);
  }

  if (preferences.data_sources && !Array.isArray(preferences.data_sources)) {
    throw new Error('data_sources must be an array');
  }

  return true;
};

export default {
  getUserProfile,
  updateUserProfile,
  getUserPreferences,
  updateUserPreferences,
  validatePreferences,
};
