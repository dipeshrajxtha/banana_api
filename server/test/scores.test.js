/**
 * @file scores.test.js
 * @description Integration test suite for score persistence, guest identity, and leaderboard retrieval.
 * @module server/test/scores
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { initDb, closeDb } from '../src/db/index.js';

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
  if (server) await new Promise((r) => server.close(r));
  await closeDb();
});

describe('Score Persistence, Guest Identity, and Leaderboard API Tests', () => {
  let guestCookie;
  let guestToken;

  it('POST /api/auth/guest: Provisions virtual guest identity with session cookie and token', async () => {
    const res = await fetch(`${baseUrl}/api/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestNickname: 'CyberSolver' })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.user.username, 'CyberSolver');
    assert.equal(data.user.auth_provider, 'guest');
    assert.ok(data.token);

    guestToken = data.token;
    const rawCookie = res.headers.get('set-cookie');
    assert.ok(rawCookie, 'Must set session cookie for guest identity');
    guestCookie = rawCookie.split(';')[0];
  });

  it('POST /api/scores/submit: Rejects unauthenticated score submissions with HTTP 401', async () => {
    const res = await fetch(`${baseUrl}/api/scores/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameMode: 'SPEED_RUSH',
        totalScore: 1200
      })
    });

    assert.equal(res.status, 401);
  });

  it('POST /api/scores/submit: Records score and calculates grade tier for authenticated player', async () => {
    const res = await fetch(`${baseUrl}/api/scores/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${guestToken}`
      },
      body: JSON.stringify({
        gameMode: 'SPEED_RUSH',
        totalScore: 5400,
        puzzlesAttempted: 15,
        puzzlesSolved: 14,
        accuracyPct: 93,
        avgSolveTimeMs: 3800,
        maxStreak: 8
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.gradeTier, 'S');
    assert.equal(data.isNewHighScore, true);
    assert.equal(data.currentHighScore, 5400);
  });

  it('GET /api/scores/leaderboard: Returns ranked player podium with high scores', async () => {
    const res = await fetch(`${baseUrl}/api/scores/leaderboard?mode=SPEED_RUSH`);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.gameMode, 'SPEED_RUSH');
    assert.ok(Array.isArray(data.leaderboard));
    assert.ok(data.leaderboard.length >= 1);

    const topRank = data.leaderboard[0];
    assert.equal(topRank.rank, 1);
    assert.equal(topRank.username, 'CyberSolver');
    assert.equal(topRank.high_score, 5400);
    assert.equal(topRank.grade_tier, 'S');
  });

  it('GET /api/scores/history: Returns personal match history and aggregated career telemetry', async () => {
    const res = await fetch(`${baseUrl}/api/scores/history`, {
      headers: { 'Authorization': `Bearer ${guestToken}` }
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.careerStats);
    assert.equal(data.careerStats.totalGames, 1);
    assert.equal(data.careerStats.highScore, 5400);
    assert.ok(Array.isArray(data.history));
    assert.equal(data.history.length, 1);
  });
});
