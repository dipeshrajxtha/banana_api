/**
 * @file leaderboardRepository.js
 * @description Data access layer for Global Leaderboards and personal high scores.
 * @module server/db/leaderboardRepository
 */

import { run, get, all } from './index.js';

export const leaderboardRepository = {
  /**
   * Upserts the personal best high score for a user in a given game mode
   */
  async recordScore({ userId, gameMode, score, gradeTier, accuracyPct, avgTimeMs }) {
    const existing = await get(
      'SELECT id, high_score FROM leaderboard WHERE user_id = ? AND game_mode = ?',
      [userId, gameMode]
    );

    if (!existing) {
      const sql = `
        INSERT INTO leaderboard (user_id, game_mode, high_score, grade_tier, best_accuracy_pct, best_avg_time_ms)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      await run(sql, [userId, gameMode, score, gradeTier, accuracyPct, avgTimeMs]);
      return { isNewHighScore: true, currentHighScore: score };
    }

    if (score > existing.high_score) {
      const sql = `
        UPDATE leaderboard
        SET high_score = ?, grade_tier = ?, best_accuracy_pct = ?, best_avg_time_ms = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      await run(sql, [score, gradeTier, accuracyPct, avgTimeMs, existing.id]);
      return { isNewHighScore: true, currentHighScore: score };
    }

    return { isNewHighScore: false, currentHighScore: existing.high_score };
  },

  /**
   * Retrieves top scores across the entire player base
   */
  async getTop({ gameMode = 'SPEED_RUSH', limit = 50 } = {}) {
    const sql = `
      SELECT 
        l.id,
        l.user_id,
        u.username,
        u.avatar_url,
        l.game_mode,
        l.high_score,
        l.grade_tier,
        l.best_accuracy_pct,
        l.best_avg_time_ms,
        l.updated_at
      FROM leaderboard l
      JOIN users u ON l.user_id = u.id
      WHERE l.game_mode = ? AND u.is_banned = 0
      ORDER BY l.high_score DESC, l.best_avg_time_ms ASC
      LIMIT ?
    `;
    const rows = await all(sql, [gameMode, limit]);
    // Enrich with 1-based rank
    return rows.map((row, idx) => ({ ...row, rank: idx + 1 }));
  },

  /**
   * Calculates a user's global ranking in a game mode
   */
  async getUserRank(userId, gameMode = 'SPEED_RUSH') {
    const userScore = await get(
      'SELECT high_score FROM leaderboard WHERE user_id = ? AND game_mode = ?',
      [userId, gameMode]
    );
    if (!userScore) return null;

    const rankRow = await get(
      `SELECT COUNT(*) + 1 as rank 
       FROM leaderboard l
       JOIN users u ON l.user_id = u.id
       WHERE l.game_mode = ? AND l.high_score > ? AND u.is_banned = 0`,
      [gameMode, userScore.high_score]
    );

    return rankRow?.rank || 1;
  },

  /**
   * Admin moderation: Resets a suspicious leaderboard record
   */
  async resetScore(id) {
    return run('DELETE FROM leaderboard WHERE id = ?', [id]);
  }
};
