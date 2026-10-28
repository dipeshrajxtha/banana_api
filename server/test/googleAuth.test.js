/**
 * @file googleAuth.test.js
 * @description Automated integration tests for Google OAuth 2.0 OpenID Connect authentication.
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { initDb, closeDb } from '../src/db/index.js';
import { usersRepository } from '../src/db/usersRepository.js';

describe('Google OAuth 2.0 Federated Identity Integration Tests', () => {
  let server;
  let baseUrl;

  before(async () => {
    await initDb(':memory:');

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${server.address().port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await closeDb();
  });

  test('POST /api/auth/google: Rejects request with missing token with HTTP 400', async () => {
    const res = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.error.code, 'BAD_REQUEST');
  });

  test('POST /api/auth/google: Auto-provisions player account and issues session cookie', async () => {
    const res = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: 'mock_google_token:sarah.banana@gmail.com'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.user.email, 'sarah.banana@gmail.com');
    assert.equal(data.user.auth_provider, 'google');
    assert.ok(data.token);

    // Verify HttpOnly cookie was set
    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie);
    assert.ok(setCookie.includes('HttpOnly'));

    // Verify database record was created
    const dbUser = await usersRepository.findByEmail('sarah.banana@gmail.com');
    assert.ok(dbUser);
    assert.equal(dbUser.auth_provider, 'google');
    assert.ok(dbUser.google_id);
  });

  test('POST /api/auth/google: Re-authenticates existing Google player without duplication', async () => {
    const res = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: 'mock_google_token:sarah.banana@gmail.com'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.user.email, 'sarah.banana@gmail.com');

    // Total user count must remain 1
    const count = await usersRepository.count();
    assert.equal(count, 1);
  });

  test('GET /api/auth/me: Returns Google profile using issued session token', async () => {
    // 1. Sign in to obtain token
    const loginRes = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: 'mock_google_token:racer.sam@gmail.com'
      })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    // 2. Call /api/auth/me with Bearer token
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.equal(meRes.status, 200);
    const meData = await meRes.json();
    assert.equal(meData.user.email, 'racer.sam@gmail.com');
    assert.equal(meData.user.authProvider, 'google');
  });
});
