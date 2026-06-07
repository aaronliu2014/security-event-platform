import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const ROLE_HIERARCHY = {
  admin: ['admin', 'analyst', 'viewer'],
  analyst: ['analyst', 'viewer'],
  viewer: ['viewer'],
};

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logger.warn('Missing token in request');
    return res.status(401).json({
      success: false,
      error: 'Access token required',
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn(`Token verification failed: ${err.message}`);
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }
    req.user = user;
    next();
  });
};

export const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const { default: pool } = await import('../utils/database.js');
      const result = await pool.query(
        'SELECT role FROM users WHERE id = $1',
        [req.user.userId]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
        });
      }

      const userRole = result.rows[0].role || 'viewer';
      const permitted = allowedRoles.some((role) =>
        (ROLE_HIERARCHY[role] || []).includes(userRole)
      );

      if (!permitted) {
        logger.warn(`Access denied: ${req.user.email} (${userRole}) cannot access ${req.path}`);
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
        });
      }

      req.user.role = userRole;
      next();
    } catch (error) {
      logger.error(`Role check error: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: 'Permission check failed',
      });
    }
  };
};

export const generateToken = (userId, email) => {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

export default { authenticateToken, requireRole, generateToken };
