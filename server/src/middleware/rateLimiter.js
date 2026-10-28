/**
 * @file rateLimiter.js
 * @description In-memory sliding-window rate limiting middleware for DoS and brute-force mitigation.
 * @module server/middleware/rateLimiter
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import { ApiError } from '../utils/errors.js';

export class TooManyRequestsError extends ApiError {
  constructor(message = 'Too many requests, please try again later.', retryAfterSeconds = 60) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfterSeconds });
  }
}

/**
 * Creates an Express rate-limiting middleware instance
 * @param {object} options
 * @param {number} [options.windowMs=60000] - Window duration in milliseconds (default: 1 min)
 * @param {number} [options.maxRequests=20] - Maximum allowed requests per window
 * @param {string} [options.message] - Custom error message
 */
export function createRateLimiter({
  windowMs = 60000,
  maxRequests = 20,
  message = 'Too many requests from this IP address, please try again later.'
} = {}) {
  const store = new Map();

  // Periodic cleanup of stale IP records every 5 minutes to avoid memory leaks
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, 300000);

  // Unref interval so it doesn't block process exit in tests
  if (cleanupInterval.unref) cleanupInterval.unref();

  return (req, res, next) => {
    // In test environment, allow bypassing rate limits unless specifically testing rate limiter
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
      return next();
    }

    const key = req.ip || req.connection.remoteAddress || 'unknown-client';
    const now = Date.now();

    let record = store.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      store.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, maxRequests - record.count);
    const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);

    // Standard RFC 6585 rate limiting headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > maxRequests) {
      res.setHeader('Retry-After', retryAfterSec);
      return next(new TooManyRequestsError(message, retryAfterSec));
    }

    next();
  };
}

// Preset rate limiters for critical application surfaces
export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,     // 10 attempts per minute
  message: 'Too many authentication attempts. Please wait before retrying.'
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 120,    // 120 requests per minute
  message: 'General API rate limit reached.'
});
