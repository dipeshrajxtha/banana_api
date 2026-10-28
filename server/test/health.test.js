/**
 * @file health.test.js
 * @description Automated integration tests for server core health and error handling.
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

describe('Server Core & Health API Endpoints', () => {
  let server;
  let baseUrl;

  before(async () => {
    // Start temporary test server on an ephemeral port
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    // Teardown server
    await new Promise((resolve) => server.close(resolve));
  });

  test('GET /api/health returns HTTP 200 with diagnostics metrics', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.status, 'healthy');
    assert.equal(data.service, 'banana-quest-server');
    assert.ok(data.metrics.uptimeSeconds >= 0);
    assert.ok(data.metrics.memory.heapUsedMb > 0);
  });

  test('GET /api/health/ping returns HTTP 200 with pong', async () => {
    const res = await fetch(`${baseUrl}/api/health/ping`);
    assert.equal(res.status, 200);

    const text = await res.text();
    assert.equal(text, 'pong');
  });

  test('GET /api/non-existent returns HTTP 404 with standardized error response', async () => {
    const res = await fetch(`${baseUrl}/api/does-not-exist`);
    assert.equal(res.status, 404);

    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.error.code, 'NOT_FOUND');
    assert.equal(data.error.status, 404);
  });
});
