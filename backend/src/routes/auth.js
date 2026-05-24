import express from 'express';
import * as authService from '../services/authService.js';
import { schemas, validate } from '../validators/index.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', validate(schemas.register), async (req, res) => {
  try {
    const { email, username, password, full_name } = req.body;

    const user = await authService.register(email, username, password, full_name);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: user,
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    const statusCode = error.message.includes('already') ? 409 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', validate(schemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    res.json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    const statusCode = error.message.includes('Invalid') ? 401 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
