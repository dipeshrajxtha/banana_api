/**
 * @file server.js
 * @description HTTP Server bootstrapper with database initialization.
 * @module server/server
 */

import app from './app.js';
import { config } from './config/index.js';
import { initDb } from './db/index.js';

async function bootstrap() {
  try {
    // 1. Initialize SQLite Database Schemas
    await initDb();
    console.log('📦 Database tables and schemas verified.');

    // 2. Start HTTP Listener
    const server = app.listen(config.port, () => {
      console.log(`🍌 Banana Quest Server running on http://localhost:${config.port} [${config.nodeEnv}]`);
    });

    // Graceful Shutdown Handlers
    const shutdown = () => {
      console.log('\n🛑 Gracefully shutting down Banana Quest server...');
      server.close(() => {
        console.log('✅ Server closed. Exiting process.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    console.error('❌ Failed to bootstrap Banana Quest server:', err);
    process.exit(1);
  }
}

bootstrap();
