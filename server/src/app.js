/**
 * @file app.js
 * @description Express Application entrypoint with security middlewares, routing, and centralized error handling.
 * @module server/app
 * @author Dipesh Raj Shrestha
 * @reference University of Bedfordshire - CIS046-3 Software For Enterprise
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { NotFoundError } from './utils/errors.js';

// Route Imports
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';



const app = express();

// 1. Security Headers (Helmet)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// 2. CORS (Cross-Origin Resource Sharing)
app.use(cors({
  origin: config.clientUrl,
  credentials: true
}));

// 3. Request Logging
if (config.nodeEnv !== 'test') {
  app.use(requestLogger);
}

// 4. Body and Cookie Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 5. REST API Routes
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);



// 6. 404 Handler for Unmatched Endpoints
app.use((req, res, next) => {
  next(new NotFoundError(`Endpoint '${req.method} ${req.originalUrl}' does not exist.`));
});

// 7. Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
