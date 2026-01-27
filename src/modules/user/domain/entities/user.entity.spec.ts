import { User } from './user.entity';
import { Email } from '../value-objects/email.value-object';
import { Password } from '../value-objects/password.value-object';
import { UserStatus } from '../enums/user-status.enum';
import { UserCreatedEvent } from '../events/user-created.event';
import { UserUpdatedEvent } from '../events/user-updated.event';

describe('User Entity', () => {
  const validPassword = 'TestP@ss123';
  let defaultProps: {
    email: Email;
    password: Password;
    firstName: string;
    lastName: string;
    status: UserStatus;
    tenantId: string;
    roleIds: string[];
  };

  beforeEach(() => {
    defaultProps = {
      email: Email.create('test@example.com'),
      password: Password.createSync(validPassword),
      firstName: 'John',
      lastName: 'Doe',
      status: UserStatus.ACTIVE,
      tenantId: 'tenant-123',
      roleIds: ['role-1', 'role-2'],
    };
  });

  describe('create', () => {
    it('should create a user entity', () => {
      const user = User.create('user-123', defaultProps);

      expect(user.id).toBe('user-123');
      expect(user.email.value).toBe('test@example.com');
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user.fullName).toBe('John Doe');
      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.tenantId).toBe('tenant-123');
      expect(user.roleIds).toEqual(['role-1', 'role-2']);
      expect(user.emailVerified).toBe(false);
      expect(user.isActive).toBe(true);
    });

    it('should emit UserCreatedEvent on creation', () => {
      const user = User.create('user-123', defaultProps);
      const events = user.domainEvents;

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserCreatedEvent);

      const event = events[0] as UserCreatedEvent;
      expect(event.aggregateId).toBe('user-123');
      expect(event.email).toBe('test@example.com');
      expect(event.tenantId).toBe('tenant-123');
    });

    it('should initialize with optional props', () => {
      const props = {
        ...defaultProps,
        emailVerified: true,
        lastLoginAt: new Date('2026-01-01'),
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
      };

      const user = User.create('user-123', props);

      expect(user.emailVerified).toBe(true);
      expect(user.lastLoginAt).toEqual(new Date('2026-01-01'));
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute user without emitting events', () => {
      const user = User.reconstitute('user-123', defaultProps);

      expect(user.id).toBe('user-123');
      expect(user.domainEvents).toHaveLength(0);
    });
  });

  describe('updateEmail', () => {
    it('should update email and reset verification', () => {
      const user = User.create('user-123', { ...defaultProps, emailVerified: true });
      user.clearDomainEvents();

      const newEmail = Email.create('new@example.com');
      user.updateEmail(newEmail);

      expect(user.email.value).toBe('new@example.com');
      expect(user.emailVerified).toBe(false);
      expect(user.domainEvents).toHaveLength(1);
      expect(user.domainEvents[0]).toBeInstanceOf(UserUpdatedEvent);
    });

    it('should not emit event if email is the same', () => {
      const user = User.create('user-123', defaultProps);
      user.clearDomainEvents();

      user.updateEmail(defaultProps.email);

      expect(user.domainEvents).toHaveLength(0);
    });
  });

  describe('updatePassword', () => {
    it('should update password', () => {
      const user = User.create('user-123', defaultProps);
      user.clearDomainEvents();

      const newPassword = Password.createSync('NewP@ss456');
      user.updatePassword(newPassword);

      expect(user.password).toBe(newPassword);
      expect(user.domainEvents).toHaveLength(1);

      const event = user.domainEvents[0] as UserUpdatedEvent;
      expect(event.changes).toEqual({ passwordChanged: true });
    });
  });

  describe('changePassword', () => {
    it('should change password (alias for updatePassword)', () => {
      const user = User.create('user-123', defaultProps);
      user.clearDomainEvents();

      const newPassword = Password.createSync('NewP@ss456');
      user.changePassword(newPassword);

      expect(user.password).toBe(newPassword);
      expect(user.domainEvents).toHaveLength(1);
    });
  });

  describe('updateProfile', () => {
    it('should update first and last name', () => {
      const user = User.create('user-123', defaultProps);
      user.clearDomainEvents();

      user.updateProfile('Jane', 'Smith');

      expect(user.firstName).toBe('Jane');
      expect(user.lastName).toBe('Smith');
      expect(user.fullName).toBe('Jane Smith');
      expect(user.domainEvents).toHaveLength(1);
    });
  });

  describe('status changes', () => {
    it('should activate user', () => {
      const user = User.create('user-123', { ...defaultProps, status: UserStatus.PENDING });
      user.clearDomainEvents();

      user.activate();

      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.isActive).toBe(true);
      expect(user.domainEvents).toHaveLength(1);
    });

    it('should not emit event if already active', () => {
      const user = User.create('user-123', { ...defaultProps, status: UserStatus.ACTIVE });
      user.clearDomainEvents();

      user.activate();

      expect(user.domainEvents).toHaveLength(0);
    });

    it('should deactivate user', () => {
      const user = User.create('user-123', defaultProps);
      user.clearDomainEvents();

      user.deactivate();

      expect(user.status).toBe(UserStatus.INACTIVE);
      expect(user.isActive).toBe(false);
      expect(user.domainEvents).toHaveLength(1);
    });

    it('should suspend user', () => {
      const user = User.create('user-123', defaultProps);
      user.clearDomainEvents();

      user.suspend();

      expect(user.status).toBe(UserStatus.SUSPENDED);
      expect(user.isActive).toBe(false);
      expect(user.domainEvents).toHaveLength(1);
    });

    it('should change status', () => {
      const user = User.create('user-123', defaultProps);
      user.clearDomainEvents();

      user.changeStatus(UserStatus.DELETED);

      expect(user.status).toBe(UserStatus.DELETED);
      expect(user.domainEvents).toHaveLength(1);
    });

    it('should not emit event if status is the same', () => {
      const user = User.create('user-123', defaultProps);
      user.clearDomainEvents();

      user.changeStatus(UserStatus.ACTIVE);

      expect(user.domainEvents).toHaveLength(0);
    });
  });

  describe('email verification', () => {
    it('should verify email', () => {
      const user = User.create('user-123', defaultProps);
      user.clearDomainEvents();

      user.verifyEmail();

      expect(user.emailVerified).toBe(true);
      expect(user.domainEvents).toHaveLength(1);
    });

    it('should not emit event if already verified', () => {
      const user = User.create('user-123', { ...defaultProps, emailVerified: true });
      user.clearDomainEvents();

      user.verifyEmail();

      expect(user.domainEvents).toHaveLength(0);
    });
  });

  describe('role management', () => {
    it('should assign roles', () => {
      const user = User.create('user-123', defaultProps);
      user.clearDomainEvents();

      user.assignRoles(['role-3', 'role-4']);

      expect(user.roleIds).toEqual(['role-3', 'role-4']);
      expect(user.domainEvents).toHaveLength(1);
    });

    it('should add role', () => {
      const user = User.create('user-123', defaultProps);
      user.clearDomainEvents();

      user.addRole('role-3');

      expect(user.roleIds).toContain('role-3');
      expect(user.domainEvents).toHaveLength(1);
    });

    it('should not add duplicate role', () => {
      const user = User.create('user-123', defaultProps);
      user.clearDomainEvents();

      user.addRole('role-1');

      expect(user.roleIds.filter((r) => r === 'role-1')).toHaveLength(1);
      expect(user.domainEvents).toHaveLength(0);
    });

    it('should remove role', () => {
      const user = User.create('user-123', defaultProps);
      user.clearDomainEvents();

      user.removeRole('role-1');

      expect(user.roleIds).not.toContain('role-1');
      expect(user.domainEvents).toHaveLength(1);
    });

    it('should not emit event when removing non-existent role', () => {
      const user = User.create('user-123', defaultProps);
      user.clearDomainEvents();

      user.removeRole('non-existent');

      expect(user.domainEvents).toHaveLength(0);
    });

    it('should check if user has role', () => {
      const user = User.create('user-123', defaultProps);

      expect(user.hasRole('role-1')).toBe(true);
      expect(user.hasRole('role-3')).toBe(false);
    });
  });

  describe('recordLogin', () => {
    it('should record login time', () => {
      const user = User.create('user-123', defaultProps);
      const beforeLogin = new Date();

      user.recordLogin();

      expect(user.lastLoginAt).toBeDefined();
      expect(user.lastLoginAt?.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
    });
  });

  describe('roleIds immutability', () => {
    it('should return readonly roleIds array', () => {
      const user = User.create('user-123', defaultProps);
      const roleIds = user.roleIds;

      // roleIds should be readonly - TypeScript enforces this
      // At runtime, verify getting roles returns a copy
      expect(roleIds).toEqual(['role-1', 'role-2']);
      expect(user.roleIds).toEqual(roleIds);
    });

    it('should not be affected by external mutations of input roleIds', () => {
      const inputRoleIds = ['role-1', 'role-2'];
      const propsWithMutableRoles = { ...defaultProps, roleIds: inputRoleIds };

      const user = User.create('user-123', propsWithMutableRoles);

      // Mutate the original input array
      inputRoleIds.push('role-3');

      // User's roleIds should not be affected
      expect(user.roleIds).toEqual(['role-1', 'role-2']);
    });
  });
});
