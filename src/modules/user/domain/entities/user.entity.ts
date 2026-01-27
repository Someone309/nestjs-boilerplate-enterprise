import { AggregateRoot } from '@core/domain/base';
import type { Email } from '../value-objects/email.value-object';
import type { Password } from '../value-objects/password.value-object';
import { UserCreatedEvent } from '../events/user-created.event';
import { UserUpdatedEvent } from '../events/user-updated.event';
import { UserStatus } from '../enums/user-status.enum';

/**
 * User Props Interface
 */
export interface UserProps {
  email: Email;
  password: Password;
  firstName: string;
  lastName: string;
  status: UserStatus;
  tenantId: string;
  roleIds: string[];
  emailVerified?: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * User Entity
 *
 * Aggregate root for user management.
 * Contains user identity, credentials, and profile.
 *
 * Section 2.3: Domain Layer - Entity with unique ID
 */
export class User extends AggregateRoot {
  private _email: Email;
  private _password: Password;
  private _firstName: string;
  private _lastName: string;
  private _status: UserStatus;
  private _tenantId: string;
  private _roleIds: string[];
  private _emailVerified: boolean;
  private _lastLoginAt?: Date;

  private constructor(id: string, props: UserProps) {
    super(id);
    this._email = props.email;
    this._password = props.password;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._status = props.status;
    this._tenantId = props.tenantId;
    this._roleIds = [...props.roleIds];
    this._emailVerified = props.emailVerified ?? false;
    this._lastLoginAt = props.lastLoginAt;
    if (props.createdAt) {
      this._createdAt = props.createdAt;
    }
    if (props.updatedAt) {
      this._updatedAt = props.updatedAt;
    }
  }

  /**
   * Create a new user
   */
  static create(id: string, props: UserProps): User {
    const user = new User(id, props);
    user.addDomainEvent(new UserCreatedEvent(id, props.email.value, props.tenantId));
    return user;
  }

  /**
   * Reconstitute user from persistence
   */
  static reconstitute(id: string, props: UserProps): User {
    return new User(id, props);
  }

  // Getters
  get email(): Email {
    return this._email;
  }

  get password(): Password {
    return this._password;
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get fullName(): string {
    return `${this._firstName} ${this._lastName}`;
  }

  get status(): UserStatus {
    return this._status;
  }

  get tenantId(): string {
    return this._tenantId;
  }

  get roleIds(): readonly string[] {
    return this._roleIds;
  }

  get lastLoginAt(): Date | undefined {
    return this._lastLoginAt;
  }

  get emailVerified(): boolean {
    return this._emailVerified;
  }

  get isActive(): boolean {
    return this._status === UserStatus.ACTIVE;
  }

  // Behaviors
  updateEmail(email: Email): void {
    if (this._email.equals(email)) {
      return;
    }
    this._email = email;
    this._emailVerified = false; // Reset verification
    this.markUpdated();
    this.addDomainEvent(new UserUpdatedEvent(this.id, { email: email.value }));
  }

  updatePassword(password: Password): void {
    this._password = password;
    this.markUpdated();
    this.addDomainEvent(new UserUpdatedEvent(this.id, { passwordChanged: true }));
  }

  /**
   * Change password (alias for updatePassword with better semantics)
   */
  changePassword(password: Password): void {
    this.updatePassword(password);
  }

  updateProfile(firstName: string, lastName: string): void {
    this._firstName = firstName;
    this._lastName = lastName;
    this.markUpdated();
    this.addDomainEvent(new UserUpdatedEvent(this.id, { firstName, lastName }));
  }

  activate(): void {
    if (this._status === UserStatus.ACTIVE) {
      return;
    }
    this._status = UserStatus.ACTIVE;
    this.markUpdated();
    this.addDomainEvent(new UserUpdatedEvent(this.id, { status: UserStatus.ACTIVE }));
  }

  deactivate(): void {
    if (this._status === UserStatus.INACTIVE) {
      return;
    }
    this._status = UserStatus.INACTIVE;
    this.markUpdated();
    this.addDomainEvent(new UserUpdatedEvent(this.id, { status: UserStatus.INACTIVE }));
  }

  suspend(): void {
    if (this._status === UserStatus.SUSPENDED) {
      return;
    }
    this._status = UserStatus.SUSPENDED;
    this.markUpdated();
    this.addDomainEvent(new UserUpdatedEvent(this.id, { status: UserStatus.SUSPENDED }));
  }

  changeStatus(status: UserStatus): void {
    if (this._status === status) {
      return;
    }
    this._status = status;
    this.markUpdated();
    this.addDomainEvent(new UserUpdatedEvent(this.id, { status }));
  }

  changeEmail(email: Email): void {
    if (this._email.equals(email)) {
      return;
    }
    this._email = email;
    this._emailVerified = false;
    this.markUpdated();
    this.addDomainEvent(new UserUpdatedEvent(this.id, { email: email.value }));
  }

  updateRoles(roleIds: string[]): void {
    this._roleIds = [...roleIds];
    this.markUpdated();
    this.addDomainEvent(new UserUpdatedEvent(this.id, { roleIds }));
  }

  verifyEmail(): void {
    if (this._emailVerified) {
      return;
    }
    this._emailVerified = true;
    this.markUpdated();
    this.addDomainEvent(new UserUpdatedEvent(this.id, { emailVerified: true }));
  }

  recordLogin(): void {
    this._lastLoginAt = new Date();
    this.markUpdated();
  }

  assignRoles(roleIds: string[]): void {
    this._roleIds = [...roleIds];
    this.markUpdated();
    this.addDomainEvent(new UserUpdatedEvent(this.id, { roleIds }));
  }

  addRole(roleId: string): void {
    if (this._roleIds.includes(roleId)) {
      return;
    }
    this._roleIds.push(roleId);
    this.markUpdated();
    this.addDomainEvent(new UserUpdatedEvent(this.id, { roleAdded: roleId }));
  }

  removeRole(roleId: string): void {
    const index = this._roleIds.indexOf(roleId);
    if (index === -1) {
      return;
    }
    this._roleIds.splice(index, 1);
    this.markUpdated();
    this.addDomainEvent(new UserUpdatedEvent(this.id, { roleRemoved: roleId }));
  }

  hasRole(roleId: string): boolean {
    return this._roleIds.includes(roleId);
  }
}
