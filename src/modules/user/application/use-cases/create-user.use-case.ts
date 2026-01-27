import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase, type UseCaseContext, Result } from '@core/application/base';
import type { IUnitOfWork } from '@core/domain/ports/repositories';
import { type ILogger, LOGGER, UNIT_OF_WORK } from '@core/domain/ports/services';
import { DuplicateEntityException } from '@core/domain/base';
import { generateUUID } from '@shared/utils';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.value-object';
import { Password } from '../../domain/value-objects/password.value-object';
import { UserStatus } from '../../domain/enums/user-status.enum';
import {
  type IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import type { CreateUserInput } from '../commands/create-user.command';

/**
 * Create User Output
 */
export interface CreateUserOutput {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
}

/**
 * Create User Use Case
 *
 * Creates a new user account with validation.
 *
 * Section 2.2: Application Layer - UseCase for single business operation
 */
@Injectable()
export class CreateUserUseCase extends BaseUseCase<CreateUserInput, CreateUserOutput> {
  constructor(
    @Inject(LOGGER) logger: ILogger,
    @Inject(UNIT_OF_WORK) unitOfWork: IUnitOfWork,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {
    super(logger, unitOfWork);
  }

  protected async executeImpl(
    input: CreateUserInput,
    context?: UseCaseContext,
  ): Promise<Result<CreateUserOutput>> {
    try {
      const tenantId = context?.tenantId;
      if (!tenantId) {
        return Result.fail(new Error('Tenant ID is required'));
      }

      // Create value objects (validates input)
      const email = Email.create(input.email);
      const password = await Password.create(input.password);

      // Check for duplicate email
      const emailExists = await this.userRepository.emailExists(email.value, tenantId);
      if (emailExists) {
        return Result.fail(new DuplicateEntityException('User', 'email', email.value));
      }

      // Create user entity
      const userId = generateUUID();
      const user = User.create(userId, {
        email,
        password,
        firstName: input.firstName,
        lastName: input.lastName,
        status: UserStatus.PENDING,
        tenantId,
        roleIds: input.roleIds || [],
      });

      // Persist user
      await this.userRepository.save(user);

      // Collect domain events for dispatch after commit
      this.unitOfWork.addDomainEvents(user.domainEvents as never);
      user.clearDomainEvents();

      return Result.ok({
        id: user.id,
        email: user.email.value,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
