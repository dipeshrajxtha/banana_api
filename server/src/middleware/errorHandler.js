/**
 * @file errorHandler.js
 * @description Centralized error handling middleware formatting standardized REST responses.
 * @module server/middleware/errorHandler
 */

import { ApiError } from '../utils/errors.js';
import { config } from '../config/index.js';

export function errorHandler(err, req, res, next) {
  // If headers have already been sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : err.status || 500;
  const errorCode = isApiError ? err.code : 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected internal error occurred';

  // Log server errors to console
  if (statusCode >= 500) {
    console.error(`[UnhandledServerError] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      status: statusCode,
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
      ...(isApiError && err.details ? { details: err.details } : {}),
      ...(config.nodeEnv === 'development' && statusCode >= 500 ? { stack: err.stack } : {})
    }
  });
}
