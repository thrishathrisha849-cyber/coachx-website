import { HttpStatus, ERROR_CODES, type ErrorCode } from '@coachx/shared';

/**
 * Base class for every predictable, "operational" error thrown inside the
 * application (validation failures, not-found lookups, auth failures,
 * etc.). Anything that is NOT an `AppError` reaching the global error
 * handler is treated as an unexpected bug and logged/reported accordingly.
 */
export class AppError extends Error {
  public readonly statusCode: HttpStatus;
  public readonly code: ErrorCode | string;
  public readonly isOperational = true;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    code: ErrorCode | string = ERROR_CODES.INTERNAL_ERROR,
    details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(message, HttpStatus.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, details);
  }

  static unauthorized(message = 'Authentication required'): AppError {
    return new AppError(message, HttpStatus.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }

  static forbidden(message = 'You do not have permission to perform this action'): AppError {
    return new AppError(message, HttpStatus.FORBIDDEN, ERROR_CODES.FORBIDDEN);
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError(message, HttpStatus.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  static conflict(message: string, details?: unknown): AppError {
    return new AppError(message, HttpStatus.CONFLICT, ERROR_CODES.CONFLICT, details);
  }

  static internal(message = 'An unexpected error occurred'): AppError {
    return new AppError(message, HttpStatus.INTERNAL_SERVER_ERROR, ERROR_CODES.INTERNAL_ERROR);
  }
}
