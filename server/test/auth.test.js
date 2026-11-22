/**
 * @file auth.test.js
 * @description Automated integration tests for Virtual Identity, authentication, and RBAC guards.
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { initDb, closeDb } from '../src/db/index.js';
import { usersRepository } from '../src/db/usersRepository.js';

describe('Virtual Identity & Authentication Engine Integration Tests', () => {
  let server;
  let baseUrl;

  before(async () => {
    // Fresh in-memory DB for isolated testing
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

  let authCookie = null;
  let authToken = null;

  test('POST /api/auth/register: Registers new user with bcrypt hash & sets session cookie', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'puzzleplayer@example.com',
        username: 'FastSolver',
        password: 'SecurePassword123!'
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.user.email, 'puzzleplayer@example.com');
    assert.equal(data.user.role, 'player');
    assert.equal(data.user.password_hash, undefined); // Sensitive field must never be leaked
    assert.ok(data.token);

    authToken = data.token;
    // Extract Set-Cookie header
    const rawCookie = res.headers.get('set-cookie');
    assert.ok(rawCookie);
    assert.ok(rawCookie.includes('HttpOnly'));
    authCookie = rawCookie.split(';')[0];
  });

  test('POST /api/auth/register: Rejects duplicate email with HTTP 400', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'puzzleplayer@example.com',
        username: 'DuplicateGuy',
        password: 'Password123'
      })
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.error.code, 'BAD_REQUEST');
  });

  test('POST /api/auth/register: Rejects weak password (<6 chars)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'shortpass@example.com',
        username: 'Shorty',
        password: '123'
      })
    });

    assert.equal(res.status, 400);
  });

  test('POST /api/auth/login: Authenticates valid credentials', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'puzzleplayer@example.com',
        password: 'SecurePassword123!'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.user.username, 'FastSolver');
  });

  test('POST /api/auth/login: Rejects incorrect password with HTTP 401', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'puzzleplayer@example.com',
        password: 'WrongPassword999'
      })
    });

    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.error.code, 'UNAUTHORIZED');
  });

  test('GET /api/auth/me: Returns current user profile with valid cookie', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: authCookie }
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.user.email, 'puzzleplayer@example.com');
  });

  test('GET /api/auth/me: Returns current user profile with Authorization Bearer header', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.user.email, 'puzzleplayer@example.com');
  });

  test('GET /api/auth/me: Rejects request without token with HTTP 401', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    assert.equal(res.status, 401);
  });

  test('POST /api/auth/logout: Clears session cookie', async () => {
    const res = await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST' });
    assert.equal(res.status, 200);
    const cookieHeader = res.headers.get('set-cookie');
    assert.ok(cookieHeader);
    // Expired or cleared cookie contains expires=Thu, 01 Jan 1970
    assert.ok(cookieHeader.includes('Expires=Thu, 01 Jan 1970') || cookieHeader.includes('Max-Age=0'));
  });

  test('Security Hardening: Locks account after 5 consecutive failed login attempts', async () => {
    // Attempt incorrect logins 2, 3, 4, 5
    for (let i = 2; i <= 4; i++) {
      const failRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'puzzleplayer@example.com',
          password: 'WrongPasswordAgain!'
        })
      });
      assert.equal(failRes.status, 401);
    }

    // 5th failed attempt must trigger lockout (HTTP 403 Forbidden)
    const lockRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'puzzleplayer@example.com',
        password: 'WrongPasswordAgain!'
      })
    });
    assert.equal(lockRes.status, 403);
    const lockData = await lockRes.json();
    assert.match(lockData.error.message, /locked/i);

    // Subsequent attempt even with CORRECT password must still be rejected while locked
    const blockedRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'puzzleplayer@example.com',
        password: 'SecurePassword123!'
      })
    });
    assert.equal(blockedRes.status, 403);
    const blockedData = await blockedRes.json();
    assert.match(blockedData.error.message, /locked/i);
  });
});
