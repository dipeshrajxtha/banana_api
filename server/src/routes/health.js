import { Router } from 'express';

const router = Router();

/**
 * @route GET /api/health
 * @description Centralized system healthcheck reporting service uptime and environment status
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'banana-quest-server',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development'
  });
});

export default router;
