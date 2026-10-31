/**
 * @file bananaApiService.js
 * @description Enterprise interoperability adapter for Marc Conrad's Banana API with caching and fallback resilience.
 * @module server/services/bananaApiService
 * @author Dipesh Raj Shrestha
 * @reference Marc Conrad - https://marcconrad.com/uob/banana/doc.php
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import crypto from 'node:crypto';
import { config } from '../config/index.js';
import { calculatePuzzlePoints } from '@banana-quest/shared';

// Internal puzzle buffer & telemetry tracker
const telemetry = {
  totalRequests: 0,
  successfulRequests: 0,
  fallbackRequests: 0,
  cacheHits: 0,
  lastPingMs: null,
  lastCheckedAt: null,
  status: 'initialized'
};

// In-memory pre-fetched puzzle cache to avoid hammering the university API
const puzzleCache = [];
const TARGET_CACHE_SIZE = 5;
let isRefilling = false;

/**
 * Asynchronously refills the in-memory puzzle cache in the background
 */
async function refillPuzzleCache() {
  if (isRefilling || puzzleCache.length >= TARGET_CACHE_SIZE) return;
  isRefilling = true;

  try {
    while (puzzleCache.length < TARGET_CACHE_SIZE) {
      const puzzle = await bananaApiService.fetchRemotePuzzle();
      puzzleCache.push(puzzle);
    }
  } catch (err) {
    console.warn('[BananaApiService] Cache refill note:', err.message);
  } finally {
    isRefilling = false;
  }
}

// Initial background cache warm-up (non-blocking)
const warmupTimer = setTimeout(() => {
  refillPuzzleCache();
}, 500);
if (warmupTimer.unref) warmupTimer.unref();

/**
 * Procedural Fallback Puzzle Generator
 * Generates an SVG math puzzle image as a Data URI when the external university API is unreachable.
 * Ensures the application is 100% resilient and fault-tolerant.
 * @returns {{ question: string, solution: number, isFallback: boolean }}
 */
export function generateFallbackPuzzle() {
  const numA = Math.floor(Math.random() * 5) + 1; // 1 to 5
  const numB = Math.floor(Math.random() * 4) + 1; // 1 to 4
  const solution = (numA + numB) % 10;            // 0 to 9

  // SVG representation with retro arcade styling
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 300" width="100%" height="100%">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#111726"/>
          <stop offset="100%" stop-color="#1A2238"/>
        </linearGradient>
      </defs>
      <rect width="500" height="300" rx="16" fill="url(#bg)" stroke="#F59E0B" stroke-width="2"/>
      
      <!-- Fallback Header Badge -->
      <rect x="20" y="20" width="160" height="26" rx="13" fill="rgba(245,158,11,0.15)" stroke="#F59E0B" stroke-width="1"/>
      <text x="100" y="38" font-family="sans-serif" font-size="12" font-weight="bold" fill="#FBBF24" text-anchor="middle">OFFLINE RESILIENT</text>
      
      <!-- Puzzle Equation -->
      <text x="250" y="110" font-family="'JetBrains Mono', monospace" font-size="28" font-weight="bold" fill="#9CA3AF" text-anchor="middle">SOLVE THE EQUATION</text>
      
      <!-- Row 1: Item A -->
      <text x="140" y="170" font-size="40">🍌</text>
      <text x="200" y="175" font-family="monospace" font-size="32" font-weight="bold" fill="#F3F4F6">=</text>
      <text x="260" y="175" font-family="monospace" font-size="36" font-weight="bold" fill="#FBBF24">${numA}</text>

      <!-- Row 2: Item B -->
      <text x="140" y="230" font-size="40">🍌</text>
      <text x="200" y="235" font-family="monospace" font-size="32" font-weight="bold" fill="#F3F4F6">+</text>
      <text x="250" y="235" font-family="monospace" font-size="36" font-weight="bold" fill="#FBBF24">${numB}</text>
      <text x="310" y="235" font-family="monospace" font-size="32" font-weight="bold" fill="#F3F4F6">=</text>
      <rect x="345" y="200" width="55" height="50" rx="8" fill="#F59E0B"/>
      <text x="372" y="237" font-family="monospace" font-size="36" font-weight="bold" fill="#000" text-anchor="middle">?</text>
    </svg>
  `.trim();

  const base64Svg = Buffer.from(svg).toString('base64');
  return {
    question: `data:image/svg+xml;base64,${base64Svg}`,
    solution,
    isFallback: true
  };
}

/**
 * Creates a tamper-proof cryptographic token encoding the solution and timestamp
 * Prevents cheating by ensuring the client never sees the raw solution.
 * @param {number} solution
 * @returns {string} Signed token
 */
export function sealPuzzleSolution(solution) {
  const nonce = crypto.randomBytes(8).toString('hex');
  const timestamp = Date.now();
  const rawPayload = `${solution}:${timestamp}:${nonce}`;
  
  const signature = crypto
    .createHmac('sha256', config.auth.jwtSecret)
    .update(rawPayload)
    .digest('hex');

  return Buffer.from(`${rawPayload}:${signature}`).toString('base64url');
}

/**
 * Unseals and cryptographically validates the puzzle solution token
 * @param {string} puzzleId
 * @returns {{ solution: number, timestamp: number }}
 */
export function unsealPuzzleSolution(puzzleId) {
  try {
    const decoded = Buffer.from(puzzleId, 'base64url').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 4) throw new Error('Malformed puzzle token');

    const [solutionStr, timestampStr, nonce, receivedSig] = parts;
    const rawPayload = `${solutionStr}:${timestampStr}:${nonce}`;

    const expectedSig = crypto
      .createHmac('sha256', config.auth.jwtSecret)
      .update(rawPayload)
      .digest('hex');

    if (receivedSig !== expectedSig) {
      throw new Error('Invalid puzzle token signature');
    }

    return {
      solution: parseInt(solutionStr, 10),
      timestamp: parseInt(timestampStr, 10)
    };
  } catch (err) {
    throw new Error(`Token validation failed: ${err.message}`);
  }
}

export const bananaApiService = {
  /**
   * Fetches a raw puzzle directly from Marc Conrad's Banana API with timeout
   * @returns {Promise<{ question: string, solution: number, isFallback: boolean }>}
   */
  async fetchRemotePuzzle() {
    telemetry.totalRequests += 1;
    const startTime = Date.now();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.services.bananaApiTimeoutMs);

    try {
      const response = await fetch(config.services.bananaApiUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BananaQuest-CIS046-Enterprise/1.0'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Banana API returned HTTP status ${response.status}`);
      }

      const data = await response.json();
      if (!data || typeof data.question !== 'string' || typeof data.solution !== 'number') {
        throw new Error('Invalid JSON payload structure received from Banana API');
      }

      telemetry.successfulRequests += 1;
      telemetry.lastPingMs = Date.now() - startTime;
      telemetry.lastCheckedAt = new Date().toISOString();
      telemetry.status = 'online';

      return {
        question: data.question,
        solution: data.solution,
        isFallback: false
      };
    } catch (err) {
      clearTimeout(timeoutId);
      telemetry.fallbackRequests += 1;
      telemetry.lastPingMs = Date.now() - startTime;
      telemetry.lastCheckedAt = new Date().toISOString();
      telemetry.status = 'offline_fallback';

      console.warn(`[BananaApiService] External API error (${err.message}). Activating procedural fallback.`);
      return generateFallbackPuzzle();
    }
  },

  /**
   * Retrieves a client-safe puzzle, ensuring the solution is cryptographically sealed
   * @returns {Promise<{ question: string, puzzleId: string, isFallback: boolean }>}
   */
  async getPuzzleForClient() {
    // Check if we have pre-cached puzzles for instant 0ms delivery
    let puzzle;
    if (puzzleCache.length > 0) {
      telemetry.cacheHits += 1;
      puzzle = puzzleCache.shift();
      // Refill in background asynchronously without blocking this response
      refillPuzzleCache();
    } else {
      puzzle = await this.fetchRemotePuzzle();
      // Start background replenishment
      refillPuzzleCache();
    }

    // Cryptographically seal solution
    const puzzleId = sealPuzzleSolution(puzzle.solution);

    return {
      question: puzzle.question,
      puzzleId,
      isFallback: puzzle.isFallback
    };
  },

  /**
   * Validates player answer against the sealed puzzle token
   * @param {string} puzzleId
   * @param {number} answer - Player submitted integer (0-9)
   * @param {number} responseTimeMs - Time elapsed from display to submit
   * @param {number} currentStreak - Player's active consecutive win streak
   */
  verifyAnswer(puzzleId, answer, responseTimeMs = 3000, currentStreak = 0) {
    const { solution } = unsealPuzzleSolution(puzzleId);
    const parsedAnswer = parseInt(answer, 10);
    const isCorrect = parsedAnswer === solution;

    if (!isCorrect) {
      return {
        isCorrect: false,
        submittedAnswer: parsedAnswer,
        trueSolution: solution,
        pointsAwarded: 0,
        speedMultiplier: 0,
        streakMultiplier: 1,
        speedLabel: 'INCORRECT'
      };
    }

    // Calculate score using shared enterprise scoring formula
    const scoring = calculatePuzzlePoints(responseTimeMs, currentStreak);

    return {
      isCorrect: true,
      submittedAnswer: parsedAnswer,
      trueSolution: solution,
      pointsAwarded: scoring.points,
      speedMultiplier: scoring.speedMultiplier,
      streakMultiplier: scoring.streakMultiplier,
      speedLabel: scoring.speedLabel
    };
  },

  /**
   * Returns live service telemetry for the Admin Panel
   */
  getTelemetry() {
    return {
      ...telemetry,
      cacheBufferSize: puzzleCache.length,
      targetUrl: config.services.bananaApiUrl
    };
  }
};
