/**
 * @file auditRepository.js
 * @description Data access layer for Security and Administrative Audit Logs.
 * @module server/db/auditRepository
 */

import { run, all } from './index.js';

export const auditRepository = {
  /**
   * Logs a security or administrative action
   */
  async log({ userId = null, action, ipAddress = null, details = null }) {
    const encodedDetails = details ? JSON.stringify(details) : null;
    const sql = `
      INSERT INTO audit_logs (user_id, action, ip_address, details)
      VALUES (?, ?, ?, ?)
    `;
    return run(sql, [userId, action, ipAddress, encodedDetails]);
  },

  /**
   * Retrieves recent audit logs for the Admin Panel
   */
  async getRecent(limit = 100) {
    const sql = `
      SELECT 
        a.id,
        a.user_id,
        u.username,
        u.email,
        a.action,
        a.ip_address,
        a.details,
        a.created_at
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.id DESC
      LIMIT ?
    `;
    const rows = await all(sql, [limit]);
    return rows.map(r => ({
      ...r,
      details: r.details ? JSON.parse(r.details) : null
    }));
  }
};
