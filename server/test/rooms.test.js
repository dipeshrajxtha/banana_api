/**
 * @file rooms.test.js
 * @description Integration tests for 1v1 Multiplayer Room Creation, Friend Joining, and Live Dual-Battle.
 * @module server/test/rooms
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

describe('1v1 Multiplayer Room Battle Integration Tests', () => {
  let createdRoomId;
  let hostPlayerId;
  let guestPlayerId;

  it('POST /api/rooms/create: creates a new room with 3/5/7 min timer and initial puzzle', async () => {
    const res = await request(app)
      .post('/api/rooms/create')
      .send({
        durationMinutes: 5,
        playerName: 'Stuart Host'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.roomId.startsWith('MIN-'));
    assert.equal(res.body.room.durationMinutes, 5);
    assert.equal(res.body.room.status, 'waiting');
    assert.ok(res.body.room.host.currentPuzzle);

    createdRoomId = res.body.roomId;
    hostPlayerId = res.body.playerId;
  });

  it('GET /api/rooms/:roomId: fetches active room state', async () => {
    const res = await request(app)
      .get(`/api/rooms/${createdRoomId}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.room.id, createdRoomId);
    assert.equal(res.body.room.host.name, 'Stuart Host');
  });

  it('POST /api/rooms/:roomId/join: friend connects and triggers match start', async () => {
    const res = await request(app)
      .post(`/api/rooms/${createdRoomId}/join`)
      .send({
        playerName: 'Kevin Friend'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.role, 'guest');
    assert.equal(res.body.room.status, 'playing');
    assert.ok(res.body.room.guest.currentPuzzle);

    guestPlayerId = res.body.playerId;
  });

  it('POST /api/rooms/:roomId/join: rejects third player when room is full', async () => {
    const res = await request(app)
      .post(`/api/rooms/${createdRoomId}/join`)
      .send({
        playerName: 'Bob Third Wheel',
        playerId: 'player_random_stranger'
      });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /full/i);
  });

  it('POST /api/rooms/:roomId/action: handles host answer submission and updates score', async () => {
    const res = await request(app)
      .post(`/api/rooms/${createdRoomId}/action`)
      .send({
        playerId: hostPlayerId,
        answer: 5,
        responseTimeMs: 2000
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(typeof res.body.player.score === 'number');
    assert.ok(res.body.nextPuzzle);
  });

  it('POST /api/rooms/:roomId/finish: concludes duel and determines winner', async () => {
    const res = await request(app)
      .post(`/api/rooms/${createdRoomId}/finish`);

    assert.equal(res.status, 200);
    assert.equal(res.body.room.status, 'finished');
    assert.ok(res.body.room.winner);
  });

  it('POST /api/rooms/:roomId/quit: if one friend quits, the other friend wins automatically', async () => {
    // Create new active match
    const createRes = await request(app)
      .post('/api/rooms/create')
      .send({ durationMinutes: 3, playerName: 'Host Quitter' });
    const roomId = createRes.body.roomId;
    const hostId = createRes.body.playerId;

    const joinRes = await request(app)
      .post(`/api/rooms/${roomId}/join`)
      .send({ playerName: 'Friend Winner' });
    const guestId = joinRes.body.playerId;

    // Host quits match
    const quitRes = await request(app)
      .post(`/api/rooms/${roomId}/quit`)
      .send({ playerId: hostId });

    assert.equal(quitRes.status, 200);
    assert.equal(quitRes.body.room.status, 'finished');
    assert.equal(quitRes.body.room.winner.id, guestId);
    assert.equal(quitRes.body.room.winner.forfeit, true);
    assert.equal(quitRes.body.room.winner.quitterName, 'Host Quitter');
  });
});

