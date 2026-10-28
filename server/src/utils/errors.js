/**
 * @file errors.js
 * @description Standardized API Error hierarchy for Banana Quest REST Gateway.
 * @module server/utils/errors
 */

export class ApiError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends ApiError {
  constructor(message = 'Bad Request', details = null) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Authentication required', details = null) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Access forbidden: Insufficient permissions', details = null) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Requested resource not found', details = null) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

export class ServiceUnavailableError extends ApiError {
  constructor(message = 'External service temporarily unavailable', details = null) {
    super(message, 503, 'SERVICE_UNAVAILABLE', details);
  }
}
