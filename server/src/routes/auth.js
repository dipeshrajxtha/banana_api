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
import { verifyGoogleIdToken } from '../services/googleAuthService.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { BadRequestError, UnauthorizedError, ForbiddenError } from '../utils/errors.js';



const router = Router();

/**
 * @route POST /api/auth/register
 * @description Creates a new local user account with bcrypt password hashing
 */
router.post('/register', authRateLimiter, async (req, res, next) => {

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
router.post('/login', authRateLimiter, async (req, res, next) => {
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
 * @route POST /api/auth/google
 * @description Authenticates player via Google OAuth 2.0 OpenID Connect ID token
 */
router.post('/google', authRateLimiter, async (req, res, next) => {

  try {
    const { idToken } = req.body;
    if (!idToken) {
      throw new BadRequestError('Google ID token is required');
    }

    // 1. Verify Google ID token and extract identity claims
    const googleProfile = await verifyGoogleIdToken(idToken);

    // 2. Lookup existing user by Google ID or Email
    let user = await usersRepository.findByGoogleId(googleProfile.googleId);

    if (!user) {
      user = await usersRepository.findByEmail(googleProfile.email);
      if (user) {
        // Link Google ID to existing account
        user = await usersRepository.update(user.id, {
          google_id: googleProfile.googleId,
          avatar_url: googleProfile.picture || user.avatar_url
        });
      } else {
        // Auto-provision new player account
        user = await usersRepository.create({
          email: googleProfile.email.toLowerCase(),
          username: googleProfile.name || googleProfile.email.split('@')[0],
          authProvider: 'google',
          googleId: googleProfile.googleId,
          avatarUrl: googleProfile.picture,
          role: 'player'
        });
      }
    } else if (googleProfile.picture && user.avatar_url !== googleProfile.picture) {
      // Sync avatar updates from Google
      user = await usersRepository.update(user.id, {
        avatar_url: googleProfile.picture
      });
    }

    // 3. Enforce ban check
    if (user.is_banned) {
      throw new ForbiddenError('Account suspended: Contact administrator');
    }

    // 4. Issue internal session JWT and secure HttpOnly cookie
    const token = generateToken(user);
    setAuthCookie(res, token);

    // 5. Audit Logging
    await auditRepository.log({
      userId: user.id,
      action: 'LOGIN_GOOGLE',
      ipAddress: req.ip,
      details: { email: user.email, googleId: googleProfile.googleId }
    });

    res.status(200).json({
      success: true,
      message: 'Google authentication successful',
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

/**
 * @route POST /api/auth/guest
 * @description Creates an ephemeral Guest virtual identity session with signed JWT
 */
router.post('/guest', async (req, res, next) => {
  try {
    const { guestNickname } = req.body;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const cleanedNick = guestNickname && guestNickname.trim().length >= 2
      ? guestNickname.trim().substring(0, 16)
      : `Guest_${randomSuffix}`;

    const guestEmail = `guest_${Date.now()}_${randomSuffix}@bananaquest.local`;

    // Create a virtual guest user record in SQLite
    const user = await usersRepository.create({
      email: guestEmail,
      username: cleanedNick,
      passwordHash: null,
      authProvider: 'guest',
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanedNick)}`,
      role: 'player'
    });

    const token = generateToken(user);
    setAuthCookie(res, token);

    await auditRepository.log({
      userId: user.id,
      action: 'LOGIN_GUEST',
      ipAddress: req.ip,
      details: { username: user.username, role: 'guest' }
    });

    res.status(200).json({
      success: true,
      message: 'Guest session initialized',
      user: sanitizeUser(user),
      token
    });
  } catch (err) {
    next(err);
  }
});

export default router;
