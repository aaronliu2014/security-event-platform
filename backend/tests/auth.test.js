/**
 * Unit tests for auth service
 */

import { jest } from '@jest/globals';
import bcrypt from 'bcryptjs';

// Mock database
const mockQuery = jest.fn();
jest.mock('../src/utils/database.js', () => ({
  default: { query: (...args) => mockQuery(...args) },
  __esModule: true,
}));

// Mock logger
jest.mock('../src/utils/logger.js', () => ({
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
  __esModule: true,
}));

describe('Auth Service', () => {
  describe('Password Hashing', () => {
    test('should hash a password', async () => {
      const password = 'testPassword123';
      const hash = await bcrypt.hash(password, 10);
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2')).toBe(true);
    });

    test('should verify correct password', async () => {
      const password = 'testPassword123';
      const hash = await bcrypt.hash(password, 10);
      const match = await bcrypt.compare(password, hash);
      expect(match).toBe(true);
    });

    test('should reject incorrect password', async () => {
      const hash = await bcrypt.hash('correctPassword', 10);
      const match = await bcrypt.compare('wrongPassword', hash);
      expect(match).toBe(false);
    });
  });

  describe('JWT Token', () => {
    test('should generate and verify JWT token', async () => {
      const { generateToken } = await import('../src/middleware/auth.js');
      const jwt = await import('jsonwebtoken');

      const token = generateToken(42, 'test@example.com');
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);

      const decoded = jwt.default.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
      expect(decoded.userId).toBe(42);
      expect(decoded.email).toBe('test@example.com');
    });
  });
});
