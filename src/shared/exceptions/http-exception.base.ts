import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, type ErrorCodeType } from '../constants';

/**
 * Base HTTP Exception with Error Code Support
 *
 * All custom HTTP exceptions must extend this class.
 * Provides standardized error response format (Section 11.3)
 */
export abstract class BaseHttpException extends HttpException {
  public readonly errorCode: ErrorCodeType;
  public readonly errorDetails?: Record<string, unknown>;

  constructor(
    errorCode: ErrorCodeType,
    message: string,
    status: HttpStatus,
    details?: Record<string, unknown>,
  ) {
    super(
      {
        code: errorCode,
        message,
        details,
      },
      status,
    );
    this.errorCode = errorCode;
    this.errorDetails = details;
  }
}

/**
 * Unauthorized Exception (401)
 * Used when authentication is required but missing or invalid
 */
export class UnauthorizedException extends BaseHttpException {
  constructor(message = 'Authentication required', details?: Record<string, unknown>) {
    super(ErrorCode.UNAUTHORIZED, message, HttpStatus.UNAUTHORIZED, details);
  }
}

/**
 * Invalid Token Exception (401)
 * Used when the provided token is malformed or invalid
 */
export class InvalidTokenException extends BaseHttpException {
  constructor(message = 'Invalid or malformed token', details?: Record<string, unknown>) {
    super(ErrorCode.INVALID_TOKEN, message, HttpStatus.UNAUTHORIZED, details);
  }
}

/**
 * Token Expired Exception (401)
 * Used when the token has expired
 */
export class TokenExpiredException extends BaseHttpException {
  constructor(message = 'Token has expired', details?: Record<string, unknown>) {
    super(ErrorCode.TOKEN_EXPIRED, message, HttpStatus.UNAUTHORIZED, details);
  }
}

/**
 * Token Revoked Exception (401)
 * Used when the token has been blacklisted/revoked
 */
export class TokenRevokedException extends BaseHttpException {
  constructor(message = 'Token has been revoked', details?: Record<string, unknown>) {
    super(ErrorCode.TOKEN_REVOKED, message, HttpStatus.UNAUTHORIZED, details);
  }
}

/**
 * Forbidden Exception (403)
 * Used when authenticated but not authorized
 */
export class ForbiddenException extends BaseHttpException {
  constructor(
    message = 'You do not have permission to access this resource',
    details?: Record<string, unknown>,
  ) {
    super(ErrorCode.FORBIDDEN, message, HttpStatus.FORBIDDEN, details);
  }
}

/**
 * Insufficient Permissions Exception (403)
 * Used when specific permissions are missing
 */
export class InsufficientPermissionsException extends BaseHttpException {
  constructor(requiredPermissions: string[], details?: Record<string, unknown>) {
    super(
      ErrorCode.INSUFFICIENT_PERMISSIONS,
      `Missing required permissions: ${requiredPermissions.join(', ')}`,
      HttpStatus.FORBIDDEN,
      { requiredPermissions, ...details },
    );
  }
}

/**
 * Not Found Exception (404)
 * Used when a resource is not found
 */
export class NotFoundException extends BaseHttpException {
  constructor(resource: string, id?: string, details?: Record<string, unknown>) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super(ErrorCode.RESOURCE_NOT_FOUND, message, HttpStatus.NOT_FOUND, {
      resource,
      id,
      ...details,
    });
  }
}

/**
 * Conflict Exception (409)
 * Used when there's a resource conflict
 */
export class ConflictException extends BaseHttpException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ErrorCode.CONFLICT, message, HttpStatus.CONFLICT, details);
  }
}

/**
 * Duplicate Resource Exception (409)
 * Used when trying to create a duplicate resource
 */
export class DuplicateResourceException extends BaseHttpException {
  constructor(resource: string, field: string, value: string, details?: Record<string, unknown>) {
    super(
      ErrorCode.DUPLICATE_RESOURCE,
      `${resource} with ${field} '${value}' already exists`,
      HttpStatus.CONFLICT,
      { resource, field, value, ...details },
    );
  }
}

/**
 * Version Conflict Exception (409)
 * Used for optimistic locking failures
 */
export class VersionConflictException extends BaseHttpException {
  constructor(
    resource: string,
    expectedVersion: number,
    actualVersion: number,
    details?: Record<string, unknown>,
  ) {
    super(
      ErrorCode.VERSION_CONFLICT,
      `Version conflict for ${resource}: expected ${expectedVersion}, found ${actualVersion}`,
      HttpStatus.CONFLICT,
      { resource, expectedVersion, actualVersion, ...details },
    );
  }
}

/**
 * Unprocessable Entity Exception (422)
 * Used for business rule violations
 */
export class UnprocessableEntityException extends BaseHttpException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ErrorCode.BUSINESS_RULE_VIOLATION, message, HttpStatus.UNPROCESSABLE_ENTITY, details);
  }
}

/**
 * Rate Limit Exceeded Exception (429)
 * Used when rate limit is exceeded
 */
export class RateLimitExceededException extends BaseHttpException {
  constructor(retryAfter: number, details?: Record<string, unknown>) {
    super(ErrorCode.RATE_LIMIT_EXCEEDED, 'Too many requests, please try again later', 429, {
      retryAfter,
      ...details,
    });
  }
}

/**
 * Internal Server Error Exception (500)
 * Used for unexpected server errors
 */
export class InternalServerException extends BaseHttpException {
  constructor(message = 'An unexpected error occurred', details?: Record<string, unknown>) {
    super(ErrorCode.INTERNAL_ERROR, message, HttpStatus.INTERNAL_SERVER_ERROR, details);
  }
}

/**
 * External Service Error Exception (502)
 * Used when an external service fails
 */
export class ExternalServiceException extends BaseHttpException {
  constructor(serviceName: string, details?: Record<string, unknown>) {
    super(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      `External service '${serviceName}' is unavailable`,
      HttpStatus.BAD_GATEWAY,
      { serviceName, ...details },
    );
  }
}

/**
 * Service Unavailable Exception (503)
 * Used when the service is temporarily unavailable
 */
export class ServiceUnavailableException extends BaseHttpException {
  constructor(message = 'Service temporarily unavailable', details?: Record<string, unknown>) {
    super(ErrorCode.SERVICE_UNAVAILABLE, message, HttpStatus.SERVICE_UNAVAILABLE, details);
  }
}
