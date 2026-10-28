/**
 * @file sessionsRepository.js
 * @description Data access layer for Game Sessions and career telemetry statistics.
 * @module server/db/sessionsRepository
 */

import { run, get, all } from './index.js';

export const sessionsRepository = {
  /**
   * Logs a completed game session
   */
  async create({
    userId = null,
    guestIdentifier = null,
    gameMode,
    totalScore,
    puzzlesAttempted,
    puzzlesSolved,
    accuracyPct,
    avgSolveTimeMs,
    gradeTier,
    maxStreak
  }) {
    const sql = `
      INSERT INTO puzzle_sessions (
        user_id, guest_identifier, game_mode, total_score,
        puzzles_attempted, puzzles_solved, accuracy_pct,
        avg_solve_time_ms, grade_tier, max_streak
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const res = await run(sql, [
      userId,
      guestIdentifier,
      gameMode,
      totalScore,
      puzzlesAttempted,
      puzzlesSolved,
      accuracyPct,
      avgSolveTimeMs,
      gradeTier,
      maxStreak
    ]);
    return get('SELECT * FROM puzzle_sessions WHERE id = ?', [res.lastID]);
  },

  /**
   * Aggregates career statistics for a specific user
   */
  async getCareerStats(userId) {
    const sql = `
      SELECT 
        COUNT(id) as totalGames,
        COALESCE(MAX(total_score), 0) as highScore,
        COALESCE(SUM(puzzles_solved), 0) as totalSolved,
        COALESCE(SUM(puzzles_attempted), 0) as totalAttempted,
        ROUND(AVG(accuracy_pct), 1) as avgAccuracy,
        ROUND(AVG(avg_solve_time_ms), 0) as avgSolveTimeMs,
        COALESCE(MAX(max_streak), 0) as longestStreak
      FROM puzzle_sessions
      WHERE user_id = ?
    `;
    return get(sql, [userId]);
  },

  /**
   * Retrieves match history for a user
   */
  async listUserHistory(userId, limit = 10) {
    const sql = `
      SELECT id, game_mode, total_score, puzzles_solved, puzzles_attempted, accuracy_pct, avg_solve_time_ms, grade_tier, max_streak, created_at
      FROM puzzle_sessions
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT ?
    `;
    return all(sql, [userId, limit]);
  }
};
