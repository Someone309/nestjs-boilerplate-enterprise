import type {
  PaginatedResult,
  PaginationParams,
  SortParams,
} from '@core/domain/ports/repositories';
import type { User } from '@modules/user/domain/entities/user.entity';
import type {
  IUserRepository,
  UserFilterCriteria,
} from '@modules/user/domain/repositories/user.repository.interface';

/**
 * Mock User Repository for Testing
 */
export class MockUserRepository implements IUserRepository {
  private _users = new Map<string, User>();

  // Basic repository methods
  findById = jest.fn().mockImplementation((id: string): Promise<User | null> => {
    return Promise.resolve(this._users.get(id) ?? null);
  });

  findOne = jest.fn().mockImplementation((_criteria: UserFilterCriteria): Promise<User | null> => {
    // Simple implementation - returns first user or null
    const users = Array.from(this._users.values());
    return Promise.resolve(users[0] ?? null);
  });

  findMany = jest
    .fn()
    .mockImplementation(
      (
        _criteria: UserFilterCriteria,
        pagination?: PaginationParams,
        _sort?: SortParams,
      ): Promise<PaginatedResult<User>> => {
        const users = Array.from(this._users.values());
        const page = pagination?.page ?? 1;
        const limit = pagination?.limit ?? 10;
        const totalPages = Math.ceil(users.length / limit);
        return Promise.resolve({
          data: users,
          total: users.length,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        });
      },
    );

  // Legacy findAll method (for backward compatibility)
  findAll = jest
    .fn()
    .mockImplementation(
      (
        criteria?: UserFilterCriteria,
        pagination?: PaginationParams,
        sort?: SortParams,
      ): Promise<PaginatedResult<User>> => {
        return this.findMany(criteria ?? {}, pagination, sort);
      },
    );

  save = jest.fn().mockImplementation((user: User): Promise<User> => {
    this._users.set(user.id, user);
    return Promise.resolve(user);
  });

  delete = jest.fn().mockImplementation((id: string): Promise<boolean> => {
    const existed = this._users.has(id);
    this._users.delete(id);
    return Promise.resolve(existed);
  });

  exists = jest.fn().mockImplementation((criteria: UserFilterCriteria): Promise<boolean> => {
    if (criteria.email) {
      for (const user of this._users.values()) {
        if (user.email.value === criteria.email) {
          return Promise.resolve(true);
        }
      }
      return Promise.resolve(false);
    }
    return Promise.resolve(this._users.size > 0);
  });

  count = jest.fn().mockImplementation((_criteria: UserFilterCriteria): Promise<number> => {
    return Promise.resolve(this._users.size);
  });

  // User-specific methods
  findByEmail = jest
    .fn()
    .mockImplementation((email: string, tenantId: string): Promise<User | null> => {
      for (const user of this._users.values()) {
        if (user.email.value === email && user.tenantId === tenantId) {
          return Promise.resolve(user);
        }
      }
      return Promise.resolve(null);
    });

  findByEmailGlobal = jest.fn().mockImplementation((email: string): Promise<User | null> => {
    for (const user of this._users.values()) {
      if (user.email.value === email) {
        return Promise.resolve(user);
      }
    }
    return Promise.resolve(null);
  });

  findByRole = jest
    .fn()
    .mockImplementation(
      (
        roleId: string,
        pagination?: PaginationParams,
        _sort?: SortParams,
      ): Promise<PaginatedResult<User>> => {
        const users = Array.from(this._users.values()).filter((u) => u.roleIds.includes(roleId));
        const page = pagination?.page ?? 1;
        const limit = pagination?.limit ?? 10;
        const totalPages = Math.ceil(users.length / limit);
        return Promise.resolve({
          data: users,
          total: users.length,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        });
      },
    );

  emailExists = jest
    .fn()
    .mockImplementation(
      (email: string, tenantId: string, excludeUserId?: string): Promise<boolean> => {
        for (const user of this._users.values()) {
          if (
            user.email.value === email &&
            user.tenantId === tenantId &&
            user.id !== excludeUserId
          ) {
            return Promise.resolve(true);
          }
        }
        return Promise.resolve(false);
      },
    );

  countActiveInTenant = jest.fn().mockImplementation((tenantId: string): Promise<number> => {
    let count = 0;
    for (const user of this._users.values()) {
      if (user.tenantId === tenantId && user.isActive) {
        count++;
      }
    }
    return Promise.resolve(count);
  });

  findPendingActivation = jest.fn().mockImplementation((_olderThan: Date): Promise<User[]> => {
    return Promise.resolve([]);
  });

  // Test helpers
  addUser(user: User): void {
    this._users.set(user.id, user);
  }

  clearUsers(): void {
    this._users.clear();
  }

  reset(): void {
    this.findById.mockClear();
    this.findOne.mockClear();
    this.findMany.mockClear();
    this.findAll.mockClear();
    this.save.mockClear();
    this.delete.mockClear();
    this.exists.mockClear();
    this.count.mockClear();
    this.findByEmail.mockClear();
    this.findByEmailGlobal.mockClear();
    this.findByRole.mockClear();
    this.emailExists.mockClear();
    this.countActiveInTenant.mockClear();
    this.findPendingActivation.mockClear();
    this._users.clear();
  }
}

/**
 * Create a mock user repository instance
 */
export function createMockUserRepository(): MockUserRepository {
  return new MockUserRepository();
}
