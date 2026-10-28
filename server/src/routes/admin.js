/**
 * @file admin.js
 * @description Enterprise Admin Panel REST API routes protected by RBAC guards.
 * @module server/routes/admin
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { usersRepository } from '../db/usersRepository.js';
import { auditRepository } from '../db/auditRepository.js';
import { get } from '../db/index.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

const router = Router();

// Enforce that all routes in this router require a valid JWT with role: 'admin'
router.use(authenticateToken);
router.use(requireRole('admin'));

/**
 * @route GET /api/admin/metrics
 * @description Telemetry and summary analytics for the Admin Panel
 */
router.get('/metrics', async (req, res, next) => {
  try {
    const totalUsers = await usersRepository.count();
    const bannedRow = await get('SELECT COUNT(*) as count FROM users WHERE is_banned = 1');
    const sessionsRow = await get('SELECT COUNT(*) as count FROM puzzle_sessions');
    const localUsersRow = await get("SELECT COUNT(*) as count FROM users WHERE auth_provider = 'local'");
    const googleUsersRow = await get("SELECT COUNT(*) as count FROM users WHERE auth_provider = 'google'");

    res.status(200).json({
      success: true,
      metrics: {
        totalUsers,
        bannedUsers: bannedRow?.count || 0,
        totalGameSessions: sessionsRow?.count || 0,
        usersByProvider: {
          local: localUsersRow?.count || 0,
          google: googleUsersRow?.count || 0
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route GET /api/admin/users
 * @description Lists registered accounts with pagination for player moderation
 */
router.get('/users', async (req, res, next) => {
  try {
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

    const users = await usersRepository.listAll({ limit, offset });
    res.status(200).json({
      success: true,
      users,
      pagination: { limit, offset }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route PATCH /api/admin/users/:id/ban
 * @description Suspends or reinstates a player account
 */
router.patch('/users/:id/ban', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { isBanned } = req.body;

    if (isNaN(userId)) {
      throw new BadRequestError('Valid user ID is required');
    }
    if (typeof isBanned !== 'boolean') {
      throw new BadRequestError('isBanned must be a boolean');
    }

    // Prevent administrator from accidentally banning their own active session
    if (userId === req.user.id && isBanned) {
      throw new BadRequestError('Administrators cannot ban their own account');
    }

    const targetUser = await usersRepository.findById(userId);
    if (!targetUser) {
      throw new NotFoundError(`User with ID ${userId} not found`);
    }

    const updated = await usersRepository.setBanStatus(userId, isBanned);

    // Audit Logging
    await auditRepository.log({
      userId: req.user.id,
      action: isBanned ? 'ADMIN_BAN' : 'ADMIN_UNBAN',
      ipAddress: req.ip,
      details: { targetUserId: userId, targetEmail: targetUser.email }
    });

    res.status(200).json({
      success: true,
      message: `User account ${isBanned ? 'suspended' : 'reinstated'} successfully`,
      user: updated
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route GET /api/admin/audits
 * @description Retrieves recent security and administrative audit trail records
 */
router.get('/audits', async (req, res, next) => {
  try {
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);
    const audits = await auditRepository.getRecent(limit);
    res.status(200).json({
      success: true,
      audits
    });
  } catch (err) {
    next(err);
  }
});

export default router;
