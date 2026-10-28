/**
 * @file cookie.js
 * @description Secure cookie management utilities for HttpOnly session tokens.
 * @module server/utils/cookie
 */

import { config } from '../config/index.js';

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Attaches the signed JWT inside an HttpOnly, SameSite cookie
 * @param {import('express').Response} res
 * @param {string} token
 */
export function setAuthCookie(res, token) {
  res.cookie(config.auth.cookieName, token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'none' : 'lax',
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/'
  });
}

/**
 * Clears the session cookie upon logout
 * @param {import('express').Response} res
 */
export function clearAuthCookie(res) {
  res.clearCookie(config.auth.cookieName, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'none' : 'lax',
    path: '/'
  });
}
