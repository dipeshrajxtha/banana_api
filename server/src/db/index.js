/**
 * @file index.js
 * @description SQLite database connection manager and migration runner.
 * @module server/db
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import sqlite3 from 'sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the data directory exists
const dbPath = path.isAbsolute(config.db.filename)
  ? config.db.filename
  : path.resolve(__dirname, '../../', config.db.filename);

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Instantiate SQLite3 database in verbose mode for development logging
const sqlite = sqlite3.verbose();
let dbInstance = null;

/**
 * Gets or initializes the SQLite database connection
 * @param {string} [customPath] - Optional override for test suites (e.g., ':memory:')
 * @returns {sqlite3.Database}
 */
export function getDb(customPath = null) {
  if (!dbInstance) {
    const targetPath = customPath || dbPath;
    dbInstance = new sqlite.Database(targetPath, (err) => {
      if (err) {
        console.error(`[DB Error] Failed to connect to SQLite at ${targetPath}:`, err.message);
      } else if (config.nodeEnv !== 'test') {
        console.log(`🗄️  SQLite database connected at: ${targetPath}`);
      }
    });

    // Enforce foreign key constraints
    dbInstance.run('PRAGMA foreign_keys = ON;');
  }
  return dbInstance;
}

/**
 * Helper: Run an SQL statement returning lastID and changes
 * @param {string} sql
 * @param {Array} [params]
 * @returns {Promise<{ lastID: number, changes: number }>}
 */
export function run(sql, params = []) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

/**
 * Helper: Query a single row
 * @param {string} sql
 * @param {Array} [params]
 * @returns {Promise<any>}
 */
export function get(sql, params = []) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

/**
 * Helper: Query multiple rows
 * @param {string} sql
 * @param {Array} [params]
 * @returns {Promise<Array<any>>}
 */
export function all(sql, params = []) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

/**
 * Helper: Execute arbitrary DDL SQL script
 * @param {string} sql
 * @returns {Promise<void>}
 */
export function exec(sql) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

/**
 * Closes the active database connection
 * @returns {Promise<void>}
 */
export function closeDb() {
  return new Promise((resolve, reject) => {
    if (!dbInstance) return resolve();
    dbInstance.close((err) => {
      if (err) return reject(err);
      dbInstance = null;
      resolve();
    });
  });
}

/**
 * Initializes database tables and schemas
 */
export async function initDb(customPath = null) {
  if (customPath) {
    if (dbInstance) await closeDb();
    getDb(customPath);
  } else {
    getDb();
  }

  const schemaSql = `
    -- 1. Users Table (Theme 4: Virtual Identity)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      password_hash TEXT,
      auth_provider TEXT NOT NULL DEFAULT 'local', -- 'local' | 'google'
      google_id TEXT UNIQUE,
      avatar_url TEXT,
      role TEXT NOT NULL DEFAULT 'player',         -- 'player' | 'admin'
      is_banned INTEGER NOT NULL DEFAULT 0,       -- 0: active, 1: suspended
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

    -- 2. Puzzle Game Sessions Table
    CREATE TABLE IF NOT EXISTS puzzle_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      guest_identifier TEXT,
      game_mode TEXT NOT NULL,                   -- 'SPEED_RUSH' | 'SURVIVAL' | 'PRACTICE'
      total_score INTEGER NOT NULL DEFAULT 0,
      puzzles_attempted INTEGER NOT NULL DEFAULT 0,
      puzzles_solved INTEGER NOT NULL DEFAULT 0,
      accuracy_pct REAL NOT NULL DEFAULT 0.0,
      avg_solve_time_ms INTEGER NOT NULL DEFAULT 0,
      grade_tier TEXT NOT NULL DEFAULT 'D',       -- 'S' | 'A' | 'B' | 'C' | 'D'
      max_streak INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user ON puzzle_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_mode_score ON puzzle_sessions(game_mode, total_score DESC);

    -- 3. Leaderboard Table (High Scores)
    CREATE TABLE IF NOT EXISTS leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      game_mode TEXT NOT NULL,
      high_score INTEGER NOT NULL DEFAULT 0,
      grade_tier TEXT NOT NULL DEFAULT 'D',
      best_accuracy_pct REAL NOT NULL DEFAULT 0.0,
      best_avg_time_ms INTEGER NOT NULL DEFAULT 0,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, game_mode),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard(game_mode, high_score DESC);

    -- 4. Enterprise Audit Logs Table (Admin & Security)
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,                      -- 'LOGIN' | 'LOGOUT' | 'SUBMIT_SCORE' | 'ADMIN_BAN' | 'SCORE_RESET'
      ip_address TEXT,
      details TEXT,                              -- JSON-encoded metadata
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
  `;

  await exec(schemaSql);
}
