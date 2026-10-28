/**
 * @file auth.js
 * @description Authentication REST endpoints for registration, login, logout, and profile verification.
 * @module server/routes/auth
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import { Router } from 'express';
import { usersRepository } from '../db/usersRepository.js';
import { auditRepository } from '../db/auditRepository.js';
import { hashPassword, comparePassword, generateToken, sanitizeUser } from '../utils/auth.js';
import { setAuthCookie, clearAuthCookie } from '../utils/cookie.js';
import { authenticateToken } from '../middleware/auth.js';
import { BadRequestError, UnauthorizedError, ForbiddenError } from '../utils/errors.js';

const router = Router();

/**
 * @route POST /api/auth/register
 * @description Creates a new local user account with bcrypt password hashing
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, username, password } = req.body;

    // 1. Input Validation
    if (!email || !email.includes('@')) {
      throw new BadRequestError('Valid email address is required');
    }
    if (!username || username.trim().length < 3) {
      throw new BadRequestError('Username must be at least 3 characters in length');
    }
    if (!password || password.length < 6) {
      throw new BadRequestError('Password must be at least 6 characters in length');
    }

    // 2. Prevent duplicate accounts
    const existing = await usersRepository.findByEmail(email.trim());
    if (existing) {
      throw new BadRequestError('An account with this email already exists');
    }

    // 3. Hash password and persist user
    const passwordHash = await hashPassword(password);
    const user = await usersRepository.create({
      email: email.trim().toLowerCase(),
      username: username.trim(),
      passwordHash,
      authProvider: 'local',
      role: 'player'
    });

    // 4. Generate JWT & Set HttpOnly cookie
    const token = generateToken(user);
    setAuthCookie(res, token);

    // 5. Audit Logging
    await auditRepository.log({
      userId: user.id,
      action: 'REGISTER',
      ipAddress: req.ip,
      details: { email: user.email, authProvider: 'local' }
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      user: sanitizeUser(user),
      token
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route POST /api/auth/login
 * @description Authenticates local user with bcrypt hash comparison and issues JWT session
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new BadRequestError('Email and password are required');
    }

    // 1. Lookup user by email
    const user = await usersRepository.findByEmail(email.trim());
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // 2. Check if user is banned
    if (user.is_banned) {
      throw new ForbiddenError('Account suspended: Contact administrator');
    }

    // 3. Handle accounts provisioned via Google OAuth
    if (!user.password_hash && user.auth_provider === 'google') {
      throw new BadRequestError('This account was registered via Google. Please use "Continue with Google".');
    }

    // 4. Compare bcrypt password hash
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // 5. Generate JWT & Set HttpOnly cookie
    const token = generateToken(user);
    setAuthCookie(res, token);

    // 6. Audit Logging
    await auditRepository.log({
      userId: user.id,
      action: 'LOGIN',
      ipAddress: req.ip,
      details: { email: user.email, authProvider: 'local' }
    });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      user: sanitizeUser(user),
      token
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route POST /api/auth/logout
 * @description Clears the session cookie and invalidates client session
 */
router.post('/logout', async (req, res) => {
  clearAuthCookie(res);
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * @route GET /api/auth/me
 * @description Returns the currently authenticated user profile
 */
router.get('/me', authenticateToken, async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
});

export default router;
