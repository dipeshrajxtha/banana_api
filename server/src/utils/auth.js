/**
 * @file auth.js
 * @description Cryptographic utilities for password hashing and stateless JWT token lifecycle.
 * @module server/utils/auth
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

// Recommended cost factor for bcrypt hashing
const SALT_ROUNDS = 12;

/**
 * Hashes a plaintext password using bcrypt with salt rounds
 * @param {string} plaintextPassword
 * @returns {Promise<string>}
 */
export async function hashPassword(plaintextPassword) {
  if (!plaintextPassword || plaintextPassword.length < 6) {
    throw new Error('Password must be at least 6 characters in length');
  }
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(plaintextPassword, salt);
}

/**
 * Compares a plaintext password against a stored bcrypt hash
 * @param {string} plaintextPassword
 * @param {string} storedHash
 * @returns {Promise<boolean>}
 */
export async function comparePassword(plaintextPassword, storedHash) {
  if (!plaintextPassword || !storedHash) return false;
  return bcrypt.compare(plaintextPassword, storedHash);
}

/**
 * Signs a stateless JSON Web Token (JWT) with user claims
 * @param {object} user - Sanitized user object
 * @returns {string} Signed JWT
 */
export function generateToken(user) {
  const payload = {
    sub: user.id,
    email: user.email,
    username: user.username,
    role: user.role || 'player',
    authProvider: user.auth_provider || 'local'
  };

  return jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn,
    issuer: 'banana-quest-auth',
    audience: 'banana-quest-client'
  });
}

/**
 * Cryptographically verifies a JWT signature and extracts claims
 * @param {string} token
 * @returns {object} Decoded JWT payload
 */
export function verifyToken(token) {
  return jwt.verify(token, config.auth.jwtSecret, {
    issuer: 'banana-quest-auth',
    audience: 'banana-quest-client'
  });
}

/**
 * Strips sensitive fields (e.g. password_hash) before returning user records
 * @param {object} user
 * @returns {object}
 */
export function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...safeUser } = user;
  return safeUser;
}
