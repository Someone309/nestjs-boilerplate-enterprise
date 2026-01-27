/**
 * User Status Enum
 *
 * Represents the possible states of a user account.
 */
export enum UserStatus {
  /**
   * User account is pending activation
   */
  PENDING = 'pending',

  /**
   * User account is active and can login
   */
  ACTIVE = 'active',

  /**
   * User account is inactive (self-deactivated or admin-deactivated)
   */
  INACTIVE = 'inactive',

  /**
   * User account is suspended (violation of terms)
   */
  SUSPENDED = 'suspended',

  /**
   * User account is deleted (soft delete)
   */
  DELETED = 'deleted',
}
