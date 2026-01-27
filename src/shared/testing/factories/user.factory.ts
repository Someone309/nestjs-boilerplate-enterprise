import { User, type UserProps } from '@modules/user/domain/entities/user.entity';
import { Email } from '@modules/user/domain/value-objects/email.value-object';
import { Password } from '@modules/user/domain/value-objects/password.value-object';
import { UserStatus } from '@modules/user/domain/enums/user-status.enum';
import { generateUUID } from '@shared/utils';

/**
 * Factory input for creating test users
 * Uses primitive types for easier test setup
 */
interface UserFactoryInput {
  id?: string;
  email?: string;
  password?: Password;
  firstName?: string;
  lastName?: string;
  status?: UserStatus;
  tenantId?: string;
  roleIds?: string[];
  emailVerified?: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Default test user data
 */
const defaultUserProps = {
  firstName: 'John',
  lastName: 'Doe',
  status: UserStatus.ACTIVE,
  tenantId: 'test-tenant-id',
  roleIds: ['user-role-id'],
  emailVerified: false,
};

/**
 * User Factory for Testing
 *
 * Creates user entities with sensible defaults for testing.
 */
export class UserFactory {
  /**
   * Create a user entity with optional overrides
   */
  static async create(overrides: UserFactoryInput = {}): Promise<User> {
    const id = overrides.id ?? generateUUID();
    const email = overrides.email
      ? Email.create(overrides.email)
      : Email.create(`user-${id.slice(0, 8)}@test.com`);
    const password = overrides.password ?? (await Password.create('TestP@ss123'));

    const props: UserProps = {
      email,
      password,
      firstName: overrides.firstName ?? defaultUserProps.firstName,
      lastName: overrides.lastName ?? defaultUserProps.lastName,
      status: overrides.status ?? defaultUserProps.status,
      tenantId: overrides.tenantId ?? defaultUserProps.tenantId,
      roleIds: overrides.roleIds ?? [...defaultUserProps.roleIds],
      emailVerified: overrides.emailVerified ?? defaultUserProps.emailVerified,
      lastLoginAt: overrides.lastLoginAt,
      createdAt: overrides.createdAt,
      updatedAt: overrides.updatedAt,
    };

    return User.create(id, props);
  }

  /**
   * Create a user entity synchronously (for tests that don't support async)
   */
  static createSync(overrides: UserFactoryInput = {}): User {
    const id = overrides.id ?? generateUUID();
    const email = overrides.email
      ? Email.create(overrides.email)
      : Email.create(`user-${id.slice(0, 8)}@test.com`);
    const password = overrides.password ?? Password.createSync('TestP@ss123');

    const props: UserProps = {
      email,
      password,
      firstName: overrides.firstName ?? defaultUserProps.firstName,
      lastName: overrides.lastName ?? defaultUserProps.lastName,
      status: overrides.status ?? defaultUserProps.status,
      tenantId: overrides.tenantId ?? defaultUserProps.tenantId,
      roleIds: overrides.roleIds ?? [...defaultUserProps.roleIds],
      emailVerified: overrides.emailVerified ?? defaultUserProps.emailVerified,
      lastLoginAt: overrides.lastLoginAt,
      createdAt: overrides.createdAt,
      updatedAt: overrides.updatedAt,
    };

    return User.create(id, props);
  }

  /**
   * Create multiple users
   */
  static async createMany(count: number, overrides: UserFactoryInput = {}): Promise<User[]> {
    const users: User[] = [];
    for (let i = 0; i < count; i++) {
      const user = await this.create({
        ...overrides,
        email: `user-${i}@test.com`,
      });
      users.push(user);
    }
    return users;
  }

  /**
   * Create an active user
   */
  static async createActive(overrides: UserFactoryInput = {}): Promise<User> {
    return this.create({
      ...overrides,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    });
  }

  /**
   * Create a pending user
   */
  static async createPending(overrides: UserFactoryInput = {}): Promise<User> {
    return this.create({
      ...overrides,
      status: UserStatus.PENDING,
      emailVerified: false,
    });
  }

  /**
   * Create a suspended user
   */
  static async createSuspended(overrides: UserFactoryInput = {}): Promise<User> {
    return this.create({
      ...overrides,
      status: UserStatus.SUSPENDED,
    });
  }

  /**
   * Create an admin user
   */
  static async createAdmin(overrides: UserFactoryInput = {}): Promise<User> {
    return this.create({
      ...overrides,
      email: overrides.email ?? 'admin@test.com',
      roleIds: ['admin-role-id', 'user-role-id'],
      status: UserStatus.ACTIVE,
      emailVerified: true,
    });
  }
}
