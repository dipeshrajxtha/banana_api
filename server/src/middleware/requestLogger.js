/**
 * @file requestLogger.js
 * @description Structured HTTP request logging middleware measuring latency and response status.
 * @module server/middleware/requestLogger
 */

export function requestLogger(req, res, next) {
  const startTime = process.hrtime();
  const timestamp = new Date().toISOString();

  // Capture response finish event
  res.on('finish', () => {
    const diff = process.hrtime(startTime);
    const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    const status = res.statusCode;

    // Color-coded status prefix in development terminal
    const isError = status >= 400;
    const logMethod = isError ? console.warn : console.log;

    logMethod(
      `[${timestamp}] ${req.method.padEnd(6)} ${req.originalUrl.padEnd(25)} -> ${status} (${durationMs}ms)`
    );
  });

  next();
}
