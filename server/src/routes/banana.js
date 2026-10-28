/**
 * @file banana.js
 * @description REST API endpoints for Banana puzzle retrieval, verification, and service telemetry.
 * @module server/routes/banana
 * @author Dipesh Raj Shrestha
 * @reference Marc Conrad - https://marcconrad.com/uob/banana/doc.php
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import { Router } from 'express';
import { bananaApiService } from '../services/bananaApiService.js';
import { BadRequestError } from '../utils/errors.js';

const router = Router();

/**
 * @route GET /api/banana/puzzle
 * @description Fetches the next math puzzle with cryptographically sealed solution
 */
router.get('/puzzle', async (req, res, next) => {
  try {
    const puzzle = await bananaApiService.getPuzzleForClient();
    res.status(200).json({
      success: true,
      puzzle
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route POST /api/banana/verify
 * @description Verifies player submitted answer and calculates points and speed multipliers
 */
router.post('/verify', async (req, res, next) => {
  try {
    const { puzzleId, answer, responseTimeMs, currentStreak } = req.body;

    if (!puzzleId) {
      throw new BadRequestError('puzzleId token is required');
    }
    if (answer === undefined || answer === null || isNaN(parseInt(answer, 10))) {
      throw new BadRequestError('Valid integer answer (0-9) is required');
    }

    const result = bananaApiService.verifyAnswer(
      puzzleId,
      parseInt(answer, 10),
      parseInt(responseTimeMs, 10) || 3000,
      parseInt(currentStreak, 10) || 0
    );

    res.status(200).json({
      success: true,
      result
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route GET /api/banana/telemetry
 * @description Retrieves external web service metrics, latency, and cache hit ratios
 */
router.get('/telemetry', (req, res) => {
  res.status(200).json({
    success: true,
    telemetry: bananaApiService.getTelemetry()
  });
});

export default router;
