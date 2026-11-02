/**
 * @file cookie.js
 * @description Secure cookie management utilities for HttpOnly session tokens.
 * @module server/utils/cookie
 */

import { config } from '../config/index.js';

/**
 * Attaches the signed JWT inside an HttpOnly, SameSite Session cookie.
 * By omitting maxAge/expires, it acts as a true Session Cookie:
 * automatically evicted when the browser closes, system restarts, or upon session timeout.
 * @param {import('express').Response} res
 * @param {string} token
 */
export function setAuthCookie(res, token) {
  res.cookie(config.auth.cookieName, token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'none' : 'lax',
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
