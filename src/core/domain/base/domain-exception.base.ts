import { ErrorCode, type ErrorCodeType } from '@shared/constants';

/**
 * Base Domain Exception Class
 *
 * All domain-specific exceptions must extend this class.
 * Used for business rule violations (HTTP 422).
 *
 * Section 4.3: Error Handling Flow - DomainException returns 422
 */
export abstract class DomainException extends Error {
  public readonly code: ErrorCodeType;
  public readonly details?: Record<string, unknown>;

  constructor(code: ErrorCodeType, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Serialize exception for API response
   */
  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

/**
 * Business Rule Violation Exception
 * Used when a domain invariant is violated
 */
export class BusinessRuleViolationException extends DomainException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ErrorCode.BUSINESS_RULE_VIOLATION, message, details);
  }
}

/**
 * Invalid State Transition Exception
 * Used when an invalid status change is attempted
 */
export class InvalidStateTransitionException extends DomainException {
  constructor(
    currentState: string,
    targetState: string,
    entityType: string,
    details?: Record<string, unknown>,
  ) {
    super(
      ErrorCode.INVALID_STATE_TRANSITION,
      `Cannot transition ${entityType} from '${currentState}' to '${targetState}'`,
      { currentState, targetState, entityType, ...details },
    );
  }
}

/**
 * Entity Not Found Exception
 * Used when a required entity doesn't exist
 */
export class EntityNotFoundException extends DomainException {
  constructor(entityType: string, id: string, details?: Record<string, unknown>) {
    super(ErrorCode.RESOURCE_NOT_FOUND, `${entityType} with id '${id}' not found`, {
      entityType,
      id,
      ...details,
    });
  }
}

/**
 * Duplicate Entity Exception
 * Used when trying to create an entity that already exists
 */
export class DuplicateEntityException extends DomainException {
  constructor(entityType: string, field: string, value: string, details?: Record<string, unknown>) {
    super(ErrorCode.DUPLICATE_RESOURCE, `${entityType} with ${field} '${value}' already exists`, {
      entityType,
      field,
      value,
      ...details,
    });
  }
}

/**
 * Insufficient Balance Exception
 * Used for financial operations
 */
export class InsufficientBalanceException extends DomainException {
  constructor(required: number, available: number, details?: Record<string, unknown>) {
    super(
      ErrorCode.INSUFFICIENT_BALANCE,
      `Insufficient balance: required ${required}, available ${available}`,
      { required, available, ...details },
    );
  }
}
