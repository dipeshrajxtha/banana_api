/**
 * @file health.js
 * @description Enterprise telemetry & health check router reporting runtime metrics and status.
 * @module server/routes/health
 */

import { Router } from 'express';
import { config } from '../config/index.js';

const router = Router();

/**
 * @route GET /api/health
 * @description Core liveness and diagnostics probe for load balancers and admin monitoring
 */
router.get('/', (req, res) => {
  const memoryUsage = process.memoryUsage();

  res.status(200).json({
    success: true,
    status: 'healthy',
    service: 'banana-quest-server',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    metrics: {
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        rssMb: +(memoryUsage.rss / 1024 / 1024).toFixed(2),
        heapTotalMb: +(memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
        heapUsedMb: +(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)
      }
    },
    integrations: {
      bananaApiTarget: config.services.bananaApiUrl,
      googleAuthEnabled: Boolean(config.auth.googleClientId)
    }
  });
});

/**
 * @route GET /api/health/ping
 * @description Lightweight ping endpoint for fast latency measurement
 */
router.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

export default router;
