/**
 * @file usersRepository.js
 * @description Data access layer for User accounts and Virtual Identity profiles.
 * @module server/db/usersRepository
 */

import { run, get, all } from './index.js';

export const usersRepository = {
  /**
   * Creates a new user record
   */
  async create({
    email,
    username,
    passwordHash = null,
    authProvider = 'local',
    googleId = null,
    avatarUrl = null,
    role = 'player'
  }) {
    const sql = `
      INSERT INTO users (email, username, password_hash, auth_provider, google_id, avatar_url, role)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const res = await run(sql, [email, username, passwordHash, authProvider, googleId, avatarUrl, role]);
    return this.findById(res.lastID);
  },

  /**
   * Finds user by primary key ID
   */
  async findById(id) {
    return get('SELECT * FROM users WHERE id = ?', [id]);
  },

  /**
   * Finds user by email address
   */
  async findByEmail(email) {
    return get('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
  },

  /**
   * Finds user by Google OAuth Subject ID
   */
  async findByGoogleId(googleId) {
    return get('SELECT * FROM users WHERE google_id = ?', [googleId]);
  },

  /**
   * Updates an existing user record
   */
  async update(id, updates = {}) {
    const fields = [];
    const values = [];

    for (const [key, val] of Object.entries(updates)) {
      fields.push(`${key} = ?`);
      values.push(val);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    await run(sql, values);
    return this.findById(id);
  },

  /**
   * Toggles account ban status (Admin moderation)
   */
  async setBanStatus(id, isBanned) {
    await run('UPDATE users SET is_banned = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      isBanned ? 1 : 0,
      id
    ]);
    return this.findById(id);
  },

  /**
   * Lists all users with pagination for Admin dashboard
   */
  async listAll({ limit = 50, offset = 0 } = {}) {
    const sql = `
      SELECT id, email, username, auth_provider, google_id, avatar_url, role, is_banned, created_at
      FROM users
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `;
    return all(sql, [limit, offset]);
  },

  /**
   * Returns total user count
   */
  async count() {
    const row = await get('SELECT COUNT(*) as count FROM users');
    return row?.count || 0;
  }
};
