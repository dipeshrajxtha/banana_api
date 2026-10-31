/**
 * @file rooms.js
 * @description Real-time 1v1 Multiplayer Room Controller for Banana Quest Minion Duels.
 * Allows players to create a room with custom timers (3, 5, 7 mins), share an invite link,
 * and battle head-to-head with live two-puzzle split-screen synchronization over SSE.
 * @module server/routes/rooms
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import { Router } from 'express';
import crypto from 'node:crypto';
import { bananaApiService } from '../services/bananaApiService.js';

const router = Router();

// In-memory Room State Store: Map<roomId, RoomState>
const rooms = new Map();

// Room cleanup interval (purge rooms inactive for > 2 hours)
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [id, room] of rooms.entries()) {
    if (now - room.createdAt > 2 * 60 * 60 * 1000) {
      rooms.delete(id);
    }
  }
}, 15 * 60 * 1000);
if (cleanupTimer.unref) cleanupTimer.unref();

/**
 * Broadcasts room state update to all active SSE subscribers
 */
function broadcastRoomUpdate(room) {
  if (!room || !room.subscribers) return;

  const sanitized = getSanitizedRoom(room);
  const data = `data: ${JSON.stringify(sanitized)}\n\n`;

  room.subscribers.forEach((res) => {
    try {
      res.write(data);
    } catch {
      // Client disconnected
    }
  });
}

/**
 * Strips SSE connection objects from room payload for client response
 */
function getSanitizedRoom(room) {
  return {
    id: room.id,
    durationMinutes: room.durationMinutes,
    durationMs: room.durationMs,
    startTime: room.startTime,
    endTime: room.endTime,
    status: room.status, // 'waiting' | 'ready' | 'playing' | 'finished'
    host: {
      id: room.host.id,
      name: room.host.name,
      avatarUrl: room.host.avatarUrl,
      score: room.host.score,
      streak: room.host.streak,
      solved: room.host.solved,
      attempted: room.host.attempted,
      currentPuzzle: room.host.currentPuzzle,
      lastAction: room.host.lastAction
    },
    guest: room.guest ? {
      id: room.guest.id,
      name: room.guest.name,
      avatarUrl: room.guest.avatarUrl,
      score: room.guest.score,
      streak: room.guest.streak,
      solved: room.guest.solved,
      attempted: room.guest.attempted,
      currentPuzzle: room.guest.currentPuzzle,
      lastAction: room.guest.lastAction
    } : null,
    winner: room.winner
  };
}

/**
 * POST /api/rooms/create
 * Creates a new 1v1 battle room with 3, 5, or 7 minute timer
 */
router.post('/create', async (req, res, next) => {
  try {
    const { durationMinutes = 3, playerName = 'Minion Host', avatarUrl = null } = req.body;
    const validMinutes = [3, 5, 7].includes(Number(durationMinutes)) ? Number(durationMinutes) : 3;

    // Generate unique 6-character room code (e.g. "BAN-892")
    const code = `MIN-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const hostId = `player_${crypto.randomBytes(4).toString('hex')}`;

    // Pre-fetch initial puzzle for host
    const initialPuzzle = await bananaApiService.getPuzzleForClient();

    const room = {
      id: code,
      createdAt: Date.now(),
      durationMinutes: validMinutes,
      durationMs: validMinutes * 60 * 1000,
      startTime: null,
      endTime: null,
      status: 'waiting', // waiting for friend to join
      subscribers: new Set(),
      host: {
        id: hostId,
        name: playerName,
        avatarUrl,
        score: 0,
        streak: 0,
        solved: 0,
        attempted: 0,
        currentPuzzle: initialPuzzle,
        lastAction: null
      },
      guest: null,
      winner: null
    };

    rooms.set(code, room);

    res.status(201).json({
      success: true,
      roomId: code,
      playerId: hostId,
      room: getSanitizedRoom(room)
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/rooms/:roomId
 * Returns current room state
 */
router.get('/:roomId', (req, res, next) => {
  try {
    const { roomId } = req.params;
    const room = rooms.get(roomId?.toUpperCase());
    if (!room) {
      return res.status(404).json({ error: 'Room not found or expired' });
    }
    res.json({ success: true, room: getSanitizedRoom(room) });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/rooms/:roomId/join
 * Connects friend to the battle room
 */
router.post('/:roomId/join', async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { playerName = 'Challenger Minion', avatarUrl = null, playerId } = req.body;
    const room = rooms.get(roomId?.toUpperCase());

    if (!room) {
      return res.status(404).json({ error: 'Room not found or expired' });
    }

    // Check if player is already host
    if (playerId && room.host.id === playerId) {
      return res.json({
        success: true,
        role: 'host',
        playerId,
        room: getSanitizedRoom(room)
      });
    }

    // Check if already in room as guest
    if (room.guest && playerId && room.guest.id === playerId) {
      return res.json({
        success: true,
        role: 'guest',
        playerId,
        room: getSanitizedRoom(room)
      });
    }

    // If guest slot is already taken by someone else
    if (room.guest && room.guest.id !== playerId) {
      return res.status(400).json({ error: 'Room is already full (2/2 players)' });
    }

    // Provision new guest
    const guestId = playerId || `player_${crypto.randomBytes(4).toString('hex')}`;
    const guestPuzzle = await bananaApiService.getPuzzleForClient();

    room.guest = {
      id: guestId,
      name: playerName,
      avatarUrl,
      score: 0,
      streak: 0,
      solved: 0,
      attempted: 0,
      currentPuzzle: guestPuzzle,
      lastAction: null
    };

    // Both players connected! Activate match countdown
    room.status = 'playing';
    room.startTime = Date.now();
    room.endTime = Date.now() + room.durationMs;

    broadcastRoomUpdate(room);

    res.json({
      success: true,
      role: 'guest',
      playerId: guestId,
      room: getSanitizedRoom(room)
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/rooms/:roomId/action
 * Handles answer verification and real-time live score updates
 */
router.post('/:roomId/action', async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { playerId, answer, responseTimeMs = 2500 } = req.body;
    const room = rooms.get(roomId?.toUpperCase());

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const isHost = room.host.id === playerId;
    const isGuest = room.guest && room.guest.id === playerId;

    if (!isHost && !isGuest) {
      return res.status(403).json({ error: 'You are not a participant in this room' });
    }

    const playerObj = isHost ? room.host : room.guest;
    const currentPuzzle = playerObj.currentPuzzle;

    if (!currentPuzzle) {
      return res.status(400).json({ error: 'No active puzzle for player' });
    }

    // Verify answer
    const result = bananaApiService.verifyAnswer(
      currentPuzzle.puzzleId,
      answer,
      responseTimeMs,
      playerObj.streak
    );

    playerObj.attempted += 1;

    if (result.isCorrect) {
      playerObj.streak += 1;
      playerObj.solved += 1;
      playerObj.score += result.pointsAwarded;
      playerObj.lastAction = { type: 'correct', points: result.pointsAwarded, ts: Date.now() };
    } else {
      playerObj.streak = 0;
      playerObj.lastAction = { type: 'wrong', ts: Date.now() };
    }

    // Fetch next puzzle for this player
    playerObj.currentPuzzle = await bananaApiService.getPuzzleForClient();

    // Broadcast updated state to both screens immediately
    broadcastRoomUpdate(room);

    res.json({
      success: true,
      result,
      player: {
        score: playerObj.score,
        streak: playerObj.streak,
        solved: playerObj.solved
      },
      nextPuzzle: playerObj.currentPuzzle
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/rooms/:roomId/finish
 * Concludes the duel when the countdown timer expires
 */
router.post('/:roomId/finish', (req, res, next) => {
  try {
    const { roomId } = req.params;
    const room = rooms.get(roomId?.toUpperCase());
    if (!room) return res.status(404).json({ error: 'Room not found' });

    room.status = 'finished';

    const hostScore = room.host.score;
    const guestScore = room.guest ? room.guest.score : 0;

    if (hostScore > guestScore) {
      room.winner = { id: room.host.id, name: room.host.name, role: 'host' };
    } else if (guestScore > hostScore) {
      room.winner = { id: room.guest.id, name: room.guest.name, role: 'guest' };
    } else {
      room.winner = { tie: true };
    }

    broadcastRoomUpdate(room);
    res.json({ success: true, room: getSanitizedRoom(room) });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/rooms/:roomId/stream
 * Server-Sent Events (SSE) stream for real-time 2-player synchronization
 */
router.get('/:roomId/stream', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId?.toUpperCase());

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  // SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Send initial state immediately
  res.write(`data: ${JSON.stringify(getSanitizedRoom(room))}\n\n`);

  // Register subscriber
  room.subscribers.add(res);

  // Unregister on connection drop
  req.on('close', () => {
    room.subscribers.delete(res);
  });
});

export default router;
