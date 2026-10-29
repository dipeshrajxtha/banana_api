/**
 * @file index.js
 * @description Shared domain constants, event definitions, and scoring formulas for Banana Quest.
 * @module @banana-quest/shared
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

/**
 * Supported Game Modes
 */
export const GAME_MODES = {
  SPEED_RUSH: 'SPEED_RUSH', // 60s timed sprint
  SURVIVAL: 'SURVIVAL',     // 3 lives, unlimited time (strike-out)
  PRACTICE: 'PRACTICE'      // Casual 10-puzzle run
};

/**
 * User Roles for Role-Based Access Control (RBAC)
 */
export const USER_ROLES = {
  GUEST: 'guest',
  PLAYER: 'player',
  ADMIN: 'admin'
};

/**
 * Performance Grade Tiers evaluated dynamically on Dashboard
 */
export const GRADE_TIERS = {
  S: {
    id: 'S',
    name: 'Apex Solver',
    minScore: 5000,
    minAccuracy: 90,
    maxAvgTimeMs: 5000,
    badgeColor: '#FFD700', // Gold/Diamond glow
    description: 'Flawless mental agility and lightning reflexes.'
  },
  A: {
    id: 'A',
    name: 'Grandmaster',
    minScore: 3500,
    minAccuracy: 80,
    maxAvgTimeMs: 8000,
    badgeColor: '#A855F7', // Royal Purple
    description: 'High-speed problem solver with exceptional consistency.'
  },
  B: {
    id: 'B',
    name: 'Pro Solver',
    minScore: 2000,
    minAccuracy: 70,
    maxAvgTimeMs: 12000,
    badgeColor: '#3B82F6', // Cobalt Blue
    description: 'Proficient racer with solid calculation capability.'
  },
  C: {
    id: 'C',
    name: 'Contender',
    minScore: 1000,
    minAccuracy: 50,
    maxAvgTimeMs: 15000,
    badgeColor: '#10B981', // Emerald Green
    description: 'Steadily developing speed and accuracy.'
  },
  D: {
    id: 'D',
    name: 'Novice',
    minScore: 0,
    minAccuracy: 0,
    maxAvgTimeMs: Infinity,
    badgeColor: '#9CA3AF', // Steel Gray
    description: 'Beginner solver finding their rhythm.'
  }
};

/**
 * Event-Driven System Message Names
 * Used by the CustomEventBus to decouple the engine from the UI
 */
export const GAME_EVENTS = {
  // Puzzle Lifecycle Events
  PUZZLE_REQUESTED: 'game:puzzle_requested',
  PUZZLE_LOADED: 'game:puzzle_loaded',
  PUZZLE_ERROR: 'game:puzzle_error',

  // User Action & Input Events
  INPUT_DIGIT: 'input:digit_pressed',
  INPUT_CLEAR: 'input:clear',
  ANSWER_SUBMITTED: 'input:answer_submitted',

  // Game Loop & Timer Events
  TIMER_TICK: 'loop:timer_tick',
  TIMER_WARNING: 'loop:timer_warning',
  TIMER_EXPIRED: 'loop:timer_expired',

  // Gameplay State Transitions
  ANSWER_CORRECT: 'game:answer_correct',
  ANSWER_WRONG: 'game:answer_wrong',
  STREAK_UPDATED: 'game:streak_updated',
  LIFE_LOST: 'game:life_lost',
  GAME_STARTED: 'game:started',
  GAME_PAUSED: 'game:paused',
  GAME_RESUMED: 'game:resumed',
  GAME_OVER: 'game:over',

  // Telemetry & Network Events
  API_PING_MEASURED: 'telemetry:api_ping'
};

/**
 * Scoring Constants and Multipliers
 */
export const SCORING_RULES = {
  BASE_POINTS: 100,
  SPEED_TIERS: [
    { maxTimeMs: 3000, multiplier: 3.0, label: 'LIGHTNING BONUS (3.0x)' },
    { maxTimeMs: 7000, multiplier: 2.0, label: 'SWIFT BONUS (2.0x)' },
    { maxTimeMs: 12000, multiplier: 1.0, label: 'STANDARD (1.0x)' },
    { maxTimeMs: Infinity, multiplier: 0.5, label: 'SLOW PENALTY (0.5x)' }
  ],
  STREAK_TIERS: [
    { minStreak: 9, multiplier: 3.0 },
    { minStreak: 6, multiplier: 2.0 },
    { minStreak: 3, multiplier: 1.5 },
    { minStreak: 0, multiplier: 1.0 }
  ]
};

/**
 * Calculates points for a single puzzle answer
 * @param {number} responseTimeMs - Time taken in milliseconds
 * @param {number} currentStreak - Consecutive correct answers before this round
 * @returns {{ points: number, speedMultiplier: number, streakMultiplier: number, speedLabel: string }}
 */
export function calculatePuzzlePoints(responseTimeMs, currentStreak = 0) {
  const speed = SCORING_RULES.SPEED_TIERS.find(t => responseTimeMs <= t.maxTimeMs) || SCORING_RULES.SPEED_TIERS[2];
  const streak = SCORING_RULES.STREAK_TIERS.find(t => currentStreak >= t.minStreak) || SCORING_RULES.STREAK_TIERS[3];
  
  const rawPoints = SCORING_RULES.BASE_POINTS * speed.multiplier * streak.multiplier;
  return {
    points: Math.round(rawPoints),
    speedMultiplier: speed.multiplier,
    streakMultiplier: streak.multiplier,
    speedLabel: speed.label
  };
}

/**
 * Evaluates performance tier based on score, accuracy, and average solve time
 * @param {number} totalScore
 * @param {number} accuracyPct - 0 to 100
 * @param {number} avgTimeMs
 * @returns {typeof GRADE_TIERS.S}
 */
export function evaluatePlayerGrade(totalScore, accuracyPct, avgTimeMs) {
  if (totalScore >= GRADE_TIERS.S.minScore && accuracyPct >= GRADE_TIERS.S.minAccuracy && avgTimeMs <= GRADE_TIERS.S.maxAvgTimeMs) {
    return GRADE_TIERS.S;
  }
  if (totalScore >= GRADE_TIERS.A.minScore && accuracyPct >= GRADE_TIERS.A.minAccuracy && avgTimeMs <= GRADE_TIERS.A.maxAvgTimeMs) {
    return GRADE_TIERS.A;
  }
  if (totalScore >= GRADE_TIERS.B.minScore && accuracyPct >= GRADE_TIERS.B.minAccuracy && avgTimeMs <= GRADE_TIERS.B.maxAvgTimeMs) {
    return GRADE_TIERS.B;
  }
  if (totalScore >= GRADE_TIERS.C.minScore && accuracyPct >= GRADE_TIERS.C.minAccuracy) {
    return GRADE_TIERS.C;
  }
  return GRADE_TIERS.D;
}
