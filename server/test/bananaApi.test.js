/**
 * @file bananaApi.test.js
 * @description Automated integration tests for Marc Conrad's Banana API adapter and endpoints.
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import {
  generateFallbackPuzzle,
  sealPuzzleSolution,
  unsealPuzzleSolution,
  bananaApiService
} from '../src/services/bananaApiService.js';

describe('Marc Conrad Banana API Integration & Interoperability Tests', () => {
  let server;
  let baseUrl;

  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${server.address().port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  test('Fallback Generator: Generates valid SVG data URI and solution (0-9)', () => {
    const fallback = generateFallbackPuzzle();
    assert.ok(fallback.question.startsWith('data:image/svg+xml;base64,'));
    assert.ok(fallback.solution >= 0 && fallback.solution <= 9);
    assert.equal(fallback.isFallback, true);
  });

  test('Security: Cryptographic puzzle sealing & tamper detection', () => {
    const originalSolution = 7;
    const token = sealPuzzleSolution(originalSolution);
    assert.ok(typeof token === 'string');

    // Unseal valid token
    const unsealed = unsealPuzzleSolution(token);
    assert.equal(unsealed.solution, originalSolution);
    assert.ok(unsealed.timestamp > 0);

    // Tamper with token characters
    const tampered = token.slice(0, -4) + 'abcd';
    assert.throws(() => unsealPuzzleSolution(tampered));
  });

  test('GET /api/banana/puzzle: Returns puzzle without leaking raw solution', async () => {
    const res = await fetch(`${baseUrl}/api/banana/puzzle`);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.puzzle.question);
    assert.ok(data.puzzle.puzzleId);
    // Raw solution MUST NOT be leaked to the client
    assert.equal(data.puzzle.solution, undefined);
  });

  test('POST /api/banana/verify: Accurately checks correct answer and awards speed bonus', async () => {
    // 1. Seal known solution
    const targetSolution = 4;
    const puzzleId = sealPuzzleSolution(targetSolution);

    // 2. Submit correct answer within lightning speed (2500ms)
    const res = await fetch(`${baseUrl}/api/banana/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        puzzleId,
        answer: 4,
        responseTimeMs: 2500,
        currentStreak: 2
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.result.isCorrect, true);
    assert.equal(data.result.trueSolution, 4);
    assert.equal(data.result.speedMultiplier, 3.0); // <=3s lightning bonus
    assert.ok(data.result.pointsAwarded >= 300);
  });

  test('POST /api/banana/verify: Correctly flags incorrect answers', async () => {
    const puzzleId = sealPuzzleSolution(8);

    const res = await fetch(`${baseUrl}/api/banana/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        puzzleId,
        answer: 2, // Incorrect
        responseTimeMs: 4000
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.result.isCorrect, false);
    assert.equal(data.result.trueSolution, 8);
    assert.equal(data.result.pointsAwarded, 0);
  });

  test('GET /api/banana/telemetry: Returns service metrics and health status', async () => {
    const res = await fetch(`${baseUrl}/api/banana/telemetry`);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.telemetry.totalRequests >= 1);
    assert.ok(data.telemetry.targetUrl);
  });
});
