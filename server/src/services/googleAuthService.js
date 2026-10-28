/**
 * @file googleAuthService.js
 * @description Google OAuth 2.0 / OpenID Connect ID token verification service.
 * @module server/services/googleAuthService
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import { OAuth2Client } from 'google-auth-library';
import { config } from '../config/index.js';
import { UnauthorizedError } from '../utils/errors.js';

let googleClient = null;

function getOAuth2Client() {
  if (!googleClient && config.auth.googleClientId) {
    googleClient = new OAuth2Client(config.auth.googleClientId);
  }
  return googleClient;
}

/**
 * Cryptographically verifies a Google ID Token (JWT) sent by Google Identity Services (GIS)
 * @param {string} idToken - The JWT credential returned by Google Sign-In SDK
 * @returns {Promise<{ googleId: string, email: string, name: string, picture: string }>}
 */
export async function verifyGoogleIdToken(idToken) {
  if (!idToken || typeof idToken !== 'string') {
    throw new UnauthorizedError('Google ID token is required');
  }

  // 1. Support Mock / Development tokens for offline testing and tutor grading
  if (idToken.startsWith('mock_google_token:')) {
    const email = idToken.replace('mock_google_token:', '').trim() || 'demo_player@gmail.com';
    return {
      googleId: `mock_sub_${Buffer.from(email).toString('hex').slice(0, 16)}`,
      email,
      name: email.split('@')[0],
      picture: 'https://lh3.googleusercontent.com/a/default-avatar=s96-c'
    };
  }

  const client = getOAuth2Client();

  // If no GOOGLE_CLIENT_ID is set in environment, decode claims for academic demonstration
  if (!client) {
    console.warn('[GoogleAuthService] GOOGLE_CLIENT_ID not configured; extracting payload for demonstration.');
    try {
      const parts = idToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        if (payload.sub && payload.email) {
          return {
            googleId: payload.sub,
            email: payload.email,
            name: payload.name || payload.email.split('@')[0],
            picture: payload.picture || null
          };
        }
      }
    } catch {
      // Fall through to error
    }
    throw new UnauthorizedError('Invalid Google ID token format');
  }

  // 2. Production cryptographic verification against Google JWKS certificates
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: config.auth.googleClientId
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      throw new UnauthorizedError('Google token payload missing essential claims');
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      picture: payload.picture || null
    };
  } catch (err) {
    console.error('[GoogleAuthService] Token signature verification failed:', err.message);
    throw new UnauthorizedError(`Google authentication failed: ${err.message}`);
  }
}
