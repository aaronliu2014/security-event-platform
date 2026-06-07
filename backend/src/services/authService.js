import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth.js';
import * as userModel from '../models/User.js';
import * as userPrefModel from '../models/UserPreference.js';
import logger from '../utils/logger.js';

const SALT_ROUNDS = 10;

export const hashPassword = async (password) => {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    logger.error(`Error hashing password: ${error.message}`);
    throw new Error('Password hashing failed');
  }
};

export const verifyPassword = async (password, passwordHash) => {
  try {
    return await bcrypt.compare(password, passwordHash);
  } catch (error) {
    logger.error(`Error verifying password: ${error.message}`);
    throw new Error('Password verification failed');
  }
};

export const register = async (email, username, password, fullName = null) => {
  try {
    // Check if user already exists
    const existingUser = await userModel.getUserByEmail(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await userModel.createUser(email, username, passwordHash, fullName);

    // Create default preferences for user
    await userPrefModel.createUserPreferences(user.id);

    logger.info(`User registered: ${email}`);

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.full_name,
    };
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    throw error;
  }
};

export const login = async (email, password) => {
  try {
    // Get user with password
    const user = await userModel.getUserWithPassword(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    logger.info(`User logged in: ${email}`);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
      },
    };
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    throw error;
  }
};

export const validateToken = (token) => {
  try {
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    return decoded;
  } catch (error) {
    logger.warn(`Token validation failed: ${error.message}`);
    throw error;
  }
};

export default {
  hashPassword,
  verifyPassword,
  register,
  login,
  validateToken,
};
