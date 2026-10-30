/**
 * @file scores.js
 * @description REST API endpoints for score persistence, game session logging, and global leaderboard ranking.
 * @module server/routes/scores
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import { Router } from 'express';
import { sessionsRepository } from '../db/sessionsRepository.js';
import { leaderboardRepository } from '../db/leaderboardRepository.js';
import { auditRepository } from '../db/auditRepository.js';
import { authenticateToken } from '../middleware/auth.js';
import { evaluatePlayerGrade } from '@banana-quest/shared';
import { BadRequestError } from '../utils/errors.js';

const router = Router();

/**
 * @route POST /api/scores/submit
 * @description Persists a completed puzzle session and updates the player's personal high score on the leaderboard.
 */
router.post('/submit', authenticateToken, async (req, res, next) => {
  try {
    const {
      gameMode,
      totalScore = 0,
      puzzlesAttempted = 0,
      puzzlesSolved = 0,
      accuracyPct = 0,
      avgSolveTimeMs = 0,
      maxStreak = 0
    } = req.body;

    if (!gameMode) {
      throw new BadRequestError('Game mode is required');
    }

    const calculatedGrade = evaluatePlayerGrade(totalScore, accuracyPct, avgSolveTimeMs);
    const gradeTier = calculatedGrade.id;

    // 1. Log Session Record
    const session = await sessionsRepository.create({
      userId: req.user.id,
      gameMode,
      totalScore,
      puzzlesAttempted,
      puzzlesSolved,
      accuracyPct,
      avgSolveTimeMs,
      gradeTier,
      maxStreak
    });

    // 2. Upsert Personal Best on Leaderboard (Except Practice mode)
    let leaderboardResult = { isNewHighScore: false, currentHighScore: totalScore };
    if (gameMode !== 'PRACTICE') {
      leaderboardResult = await leaderboardRepository.recordScore({
        userId: req.user.id,
        gameMode,
        score: totalScore,
        gradeTier,
        accuracyPct,
        avgTimeMs: avgSolveTimeMs
      });
    }

    // 3. Security & Telemetry Audit Log
    await auditRepository.log({
      userId: req.user.id,
      action: 'SUBMIT_SCORE',
      ipAddress: req.ip,
      details: {
        gameMode,
        totalScore,
        gradeTier,
        accuracyPct,
        isNewHighScore: leaderboardResult.isNewHighScore
      }
    });

    res.status(201).json({
      success: true,
      message: 'Score recorded successfully',
      session,
      gradeTier,
      isNewHighScore: leaderboardResult.isNewHighScore,
      currentHighScore: leaderboardResult.currentHighScore
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route GET /api/scores/leaderboard
 * @description Retrieves top high scores for a given game mode with rankings.
 */
router.get('/leaderboard', async (req, res, next) => {
  try {
    const { mode = 'SPEED_RUSH', limit = 25 } = req.query;
    const scores = await leaderboardRepository.getTop({
      gameMode: mode,
      limit: Math.min(parseInt(limit, 10) || 25, 100)
    });

    res.status(200).json({
      success: true,
      gameMode: mode,
      leaderboard: scores
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route GET /api/scores/history
 * @description Retrieves match history for the authenticated user.
 */
router.get('/history', authenticateToken, async (req, res, next) => {
  try {
    const history = await sessionsRepository.listUserHistory(req.user.id, 15);
    const careerStats = await sessionsRepository.getCareerStats(req.user.id);

    res.status(200).json({
      success: true,
      careerStats,
      history
    });
  } catch (err) {
    next(err);
  }
});

export default router;

