/**
 * @file auth.js
 * @description Authentication & Role-Based Access Control (RBAC) middleware.
 * @module server/middleware/auth
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import { verifyToken } from '../utils/auth.js';
import { usersRepository } from '../db/usersRepository.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { config } from '../config/index.js';

/**
 * Middleware: Enforces that the request contains a valid JWT session token
 */
export async function authenticateToken(req, res, next) {
  try {
    // 1. Extract token from HttpOnly cookie or Authorization Bearer header
    let token = req.cookies?.[config.auth.cookieName];

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      throw new UnauthorizedError('Authentication required: Missing session token');
    }

    // 2. Verify JWT signature & claims
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Session expired: Please log in again');
      }
      throw new UnauthorizedError('Invalid session token signature');
    }

    // 3. Verify user existence and active status in database
    const user = await usersRepository.findById(decoded.sub);
    if (!user) {
      throw new UnauthorizedError('User account associated with session no longer exists');
    }

    if (user.is_banned) {
      throw new ForbiddenError('Account suspended: Contact administrator');
    }

    // 4. Attach sanitized user to request context
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      authProvider: user.auth_provider,
      avatarUrl: user.avatar_url
    };

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware: Soft authentication that extracts user if token exists, but does not block guests
 */
export async function optionalAuth(req, res, next) {
  try {
    let token = req.cookies?.[config.auth.cookieName];
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (token) {
      const decoded = verifyToken(token);
      const user = await usersRepository.findById(decoded.sub);
      if (user && !user.is_banned) {
        req.user = {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          authProvider: user.auth_provider,
          avatarUrl: user.avatar_url
        };
      }
    }
  } catch {
    // Ignore invalid/expired tokens for optional authentication
    req.user = null;
  }
  next();
}

/**
 * Middleware Factory: Enforces Role-Based Access Control (RBAC)
 * @param {string|string[]} allowedRoles
 */
export function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Forbidden: Requires one of [${roles.join(', ')}] permissions`));
    }
    next();
  };
}
