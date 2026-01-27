import { CreateUserUseCase } from './create-user.use-case';
import { UserStatus } from '../../domain/enums/user-status.enum';
import { DuplicateEntityException } from '@core/domain/base';
import {
  type MockLogger,
  type MockUnitOfWork,
  type MockUserRepository,
  createMockLogger,
  createMockUnitOfWork,
  createMockUserRepository,
} from '@shared/testing';

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let mockLogger: MockLogger;
  let mockUnitOfWork: MockUnitOfWork;
  let mockUserRepository: MockUserRepository;

  const validInput = {
    email: 'test@example.com',
    password: 'TestP@ss123',
    firstName: 'John',
    lastName: 'Doe',
    roleIds: ['role-1'],
  };

  const context = {
    tenantId: 'tenant-123',
    userId: 'admin-user',
  };

  beforeEach(() => {
    mockLogger = createMockLogger();
    mockUnitOfWork = createMockUnitOfWork();
    mockUserRepository = createMockUserRepository();

    useCase = new CreateUserUseCase(mockLogger, mockUnitOfWork, mockUserRepository);
  });

  afterEach(() => {
    mockLogger.reset();
    mockUnitOfWork.reset();
    mockUserRepository.reset();
  });

  describe('execute', () => {
    it('should create a new user successfully', async () => {
      mockUserRepository.emailExists.mockResolvedValue(false);

      const result = await useCase.execute(validInput, context);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.id).toBeDefined();
        expect(result.value.email).toBe('test@example.com');
        expect(result.value.firstName).toBe('John');
        expect(result.value.lastName).toBe('Doe');
        expect(result.value.status).toBe(UserStatus.PENDING);
      }
    });

    it('should save user to repository', async () => {
      mockUserRepository.emailExists.mockResolvedValue(false);

      await useCase.execute(validInput, context);

      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          _firstName: 'John',
          _lastName: 'Doe',
        }),
      );
    });

    it('should check for duplicate email', async () => {
      mockUserRepository.emailExists.mockResolvedValue(false);

      await useCase.execute(validInput, context);

      expect(mockUserRepository.emailExists).toHaveBeenCalledWith('test@example.com', 'tenant-123');
    });

    it('should fail when email already exists', async () => {
      mockUserRepository.emailExists.mockResolvedValue(true);

      const result = await useCase.execute(validInput, context);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(DuplicateEntityException);
      }
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when tenant ID is missing', async () => {
      const result = await useCase.execute(validInput, {});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Tenant ID is required');
      }
    });

    it('should fail with invalid email format', async () => {
      const invalidInput = { ...validInput, email: 'invalid-email' };

      const result = await useCase.execute(invalidInput, context);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Invalid email format');
      }
    });

    it('should fail with weak password', async () => {
      const invalidInput = { ...validInput, password: 'weak' };

      const result = await useCase.execute(invalidInput, context);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Password must be at least');
      }
    });

    it('should add domain events to unit of work', async () => {
      mockUserRepository.emailExists.mockResolvedValue(false);

      await useCase.execute(validInput, context);

      const pendingEvents = mockUnitOfWork.getPendingEvents();
      expect(pendingEvents).toHaveLength(1);
      expect(pendingEvents[0].constructor.name).toBe('UserCreatedEvent');
    });

    it('should handle repository errors gracefully', async () => {
      mockUserRepository.emailExists.mockRejectedValue(new Error('Database error'));

      const result = await useCase.execute(validInput, context);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Database error');
      }
    });

    it('should create user with empty roleIds when not provided', async () => {
      mockUserRepository.emailExists.mockResolvedValue(false);
      const inputWithoutRoles = { ...validInput, roleIds: undefined };

      const result = await useCase.execute(inputWithoutRoles, context);

      expect(result.success).toBe(true);
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          _roleIds: [],
        }),
      );
    });

    it('should normalize email to lowercase', async () => {
      mockUserRepository.emailExists.mockResolvedValue(false);
      const inputWithUppercaseEmail = { ...validInput, email: 'TEST@EXAMPLE.COM' };

      const result = await useCase.execute(inputWithUppercaseEmail, context);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.email).toBe('test@example.com');
      }
    });
  });
});
