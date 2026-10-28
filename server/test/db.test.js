/**
 * @file db.test.js
 * @description Automated integration tests for database schema, migrations, and repositories.
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { initDb, closeDb } from '../src/db/index.js';
import { usersRepository } from '../src/db/usersRepository.js';
import { sessionsRepository } from '../src/db/sessionsRepository.js';
import { leaderboardRepository } from '../src/db/leaderboardRepository.js';
import { auditRepository } from '../src/db/auditRepository.js';

describe('Database Layer & Repository Integration Tests', () => {
  before(async () => {
    // Initialize fresh in-memory database for testing
    await initDb(':memory:');
  });

  after(async () => {
    await closeDb();
  });

  test('Users Repository: CRUD, Google ID lookup, and Ban Moderation', async () => {
    // 1. Create Local User
    const localUser = await usersRepository.create({
      email: 'solver1@example.com',
      username: 'ApexSolver',
      passwordHash: 'hashed_secret_123',
      role: 'player'
    });

    assert.ok(localUser.id > 0);
    assert.equal(localUser.email, 'solver1@example.com');
    assert.equal(localUser.auth_provider, 'local');

    // 2. Find by Email (Case-insensitive)
    const foundEmail = await usersRepository.findByEmail('SOLVER1@EXAMPLE.COM');
    assert.equal(foundEmail.id, localUser.id);

    // 3. Create Google OAuth User
    const googleUser = await usersRepository.create({
      email: 'googler@gmail.com',
      username: 'GoogleMaster',
      authProvider: 'google',
      googleId: 'google_sub_1098234710',
      avatarUrl: 'https://lh3.googleusercontent.com/avatar.jpg'
    });

    assert.ok(googleUser.id > 0);
    assert.equal(googleUser.auth_provider, 'google');

    // 4. Find by Google ID
    const foundGoogle = await usersRepository.findByGoogleId('google_sub_1098234710');
    assert.equal(foundGoogle.id, googleUser.id);

    // 5. Toggle Ban Status
    const banned = await usersRepository.setBanStatus(localUser.id, true);
    assert.equal(banned.is_banned, 1);

    const count = await usersRepository.count();
    assert.equal(count, 2);
  });

  test('Sessions & Career Telemetry: Session Logging and Aggregation', async () => {
    const user = await usersRepository.create({
      email: 'racer@test.com',
      username: 'TelemetryTester'
    });

    // Session 1: Speed Rush
    await sessionsRepository.create({
      userId: user.id,
      gameMode: 'SPEED_RUSH',
      totalScore: 4200,
      puzzlesAttempted: 10,
      puzzlesSolved: 9,
      accuracyPct: 90.0,
      avgSolveTimeMs: 4200,
      gradeTier: 'A',
      maxStreak: 6
    });

    // Session 2: Speed Rush High Score
    await sessionsRepository.create({
      userId: user.id,
      gameMode: 'SPEED_RUSH',
      totalScore: 6500,
      puzzlesAttempted: 15,
      puzzlesSolved: 14,
      accuracyPct: 93.3,
      avgSolveTimeMs: 3800,
      gradeTier: 'S',
      maxStreak: 10
    });

    const stats = await sessionsRepository.getCareerStats(user.id);
    assert.equal(stats.totalGames, 2);
    assert.equal(stats.highScore, 6500);
    assert.equal(stats.totalSolved, 23);
    assert.equal(stats.longestStreak, 10);
  });

  test('Leaderboard Repository: High score upsert and rank calculation', async () => {
    const u1 = await usersRepository.create({ email: 'champ@test.com', username: 'Champion' });
    const u2 = await usersRepository.create({ email: 'second@test.com', username: 'Challenger' });

    // Record u1 score = 8000
    await leaderboardRepository.recordScore({
      userId: u1.id,
      gameMode: 'SPEED_RUSH',
      score: 8000,
      gradeTier: 'S',
      accuracyPct: 95.0,
      avgTimeMs: 3100
    });

    // Record u2 score = 5500
    await leaderboardRepository.recordScore({
      userId: u2.id,
      gameMode: 'SPEED_RUSH',
      score: 5500,
      gradeTier: 'A',
      accuracyPct: 88.0,
      avgTimeMs: 4500
    });

    const top = await leaderboardRepository.getTop({ gameMode: 'SPEED_RUSH' });
    assert.ok(top.length >= 2);
    assert.equal(top[0].user_id, u1.id);
    assert.equal(top[0].rank, 1);
    assert.equal(top[1].user_id, u2.id);
    assert.equal(top[1].rank, 2);

    const rank1 = await leaderboardRepository.getUserRank(u1.id, 'SPEED_RUSH');
    assert.equal(rank1, 1);

    const rank2 = await leaderboardRepository.getUserRank(u2.id, 'SPEED_RUSH');
    assert.equal(rank2, 2);
  });

  test('Audit Repository: Security event trail logging', async () => {
    await auditRepository.log({
      action: 'SYSTEM_BOOT',
      ipAddress: '127.0.0.1',
      details: { environment: 'test', memoryDb: true }
    });

    const logs = await auditRepository.getRecent(10);
    assert.ok(logs.length > 0);
    assert.equal(logs[0].action, 'SYSTEM_BOOT');
    assert.equal(logs[0].details.memoryDb, true);
  });
});
