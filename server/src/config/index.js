/**
 * @file index.js
 * @description Centralized server configuration and environment variable validation.
 * @module server/config
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import dotenv from 'dotenv';
dotenv.config();

function validateEnv() {
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd && (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('dev_banana_quest'))) {
    throw new Error('SECURITY CRITICAL: JWT_SECRET must be set to a secure key in production!');
  }
}

validateEnv();

export const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',

  // Authentication & Security (Theme 4)
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'dev_banana_quest_jwt_secret_key_change_in_production_2026',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    cookieName: process.env.COOKIE_NAME || 'banana_quest_session',
    googleClientId: process.env.GOOGLE_CLIENT_ID || ''
  },

  // External Interoperability Services (Theme 3)
  services: {
    bananaApiUrl: process.env.BANANA_API_URL || 'https://marcconrad.com/uob/banana/api.php?out=json',
    bananaApiTimeoutMs: parseInt(process.env.BANANA_API_TIMEOUT_MS, 10) || 8000,
    bananaApiCacheTtlMs: parseInt(process.env.BANANA_API_CACHE_TTL_MS, 10) || 60000
  },

  // Database Persistence
  db: {
    filename: process.env.DATABASE_FILE || 'data/banana_quest.sqlite'
  }
};
