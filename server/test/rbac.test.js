/**
 * @file rbac.test.js
 * @description Automated integration tests for Role-Based Access Control (RBAC), Admin routes, and Rate Limiting.
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { initDb, closeDb } from '../src/db/index.js';
import { seedAdmin } from '../src/db/seedAdmin.js';
import { usersRepository } from '../src/db/usersRepository.js';
import { generateToken } from '../src/utils/auth.js';
import { createRateLimiter } from '../src/middleware/rateLimiter.js';


describe('Role-Based Access Control (RBAC) & Security Hardening Tests', () => {
  let server;
  let baseUrl;
  let adminUser;
  let playerUser;
  let adminToken;
  let playerToken;

  before(async () => {
    await initDb(':memory:');
    adminUser = await seedAdmin();
    adminToken = generateToken(adminUser);

    playerUser = await usersRepository.create({
      email: 'standard_player@example.com',
      username: 'StandardPlayer',
      role: 'player'
    });
    playerToken = generateToken(playerUser);

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

  test('RBAC: Admin route /api/admin/metrics rejects unauthenticated request with HTTP 401', async () => {
    const res = await fetch(`${baseUrl}/api/admin/metrics`);
    assert.equal(res.status, 401);
  });

  test('RBAC: Admin route /api/admin/metrics rejects standard player with HTTP 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${playerToken}` }
    });
    assert.equal(res.status, 403);
    const data = await res.json();
    assert.equal(data.error.code, 'FORBIDDEN');
  });

  test('RBAC: Admin route /api/admin/metrics succeeds for verified administrator', async () => {
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.metrics.totalUsers >= 2);
  });

  test('Admin: Lists registered players on /api/admin/users', async () => {
    const res = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.users));
    assert.ok(data.users.length >= 2);
  });

  test('Admin: Suspends player account via PATCH /api/admin/users/:id/ban', async () => {
    const res = await fetch(`${baseUrl}/api/admin/users/${playerUser.id}/ban`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ isBanned: true })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.user.is_banned, 1);

    // Verify suspended player is rejected from calling /api/auth/me
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${playerToken}` }
    });
    assert.equal(meRes.status, 403);
  });

  test('Admin: Reinstates suspended player account', async () => {
    const res = await fetch(`${baseUrl}/api/admin/users/${playerUser.id}/ban`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ isBanned: false })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.user.is_banned, 0);

    // Reinstated player can access /api/auth/me again
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${playerToken}` }
    });
    assert.equal(meRes.status, 200);
  });

  test('Admin: View security audit trail logs via /api/admin/audits', async () => {
    const res = await fetch(`${baseUrl}/api/admin/audits`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.audits.length > 0);
  });

  test('Security: Rate limiting rejects excessive requests with HTTP 429', async () => {
    const limiter = createRateLimiter({ windowMs: 10000, maxRequests: 3 });
    const mockReq = { ip: '192.168.1.100', headers: {} };
    const mockRes = {
      setHeader: () => {}
    };

    let errorThrown = null;
    const nextFn = (err) => { if (err) errorThrown = err; };

    // Request 1, 2, 3 should pass
    limiter(mockReq, mockRes, nextFn);
    assert.equal(errorThrown, null);

    limiter(mockReq, mockRes, nextFn);
    assert.equal(errorThrown, null);

    limiter(mockReq, mockRes, nextFn);
    assert.equal(errorThrown, null);

    // Request 4 should trigger 429
    limiter(mockReq, mockRes, nextFn);
    assert.ok(errorThrown);
    assert.equal(errorThrown.statusCode, 429);
    assert.equal(errorThrown.code, 'RATE_LIMIT_EXCEEDED');
  });
});
