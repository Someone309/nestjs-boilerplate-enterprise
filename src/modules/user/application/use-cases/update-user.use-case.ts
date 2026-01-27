import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase, type UseCaseContext, Result } from '@core/application/base';
import type { IUnitOfWork } from '@core/domain/ports/repositories';
import { type ILogger, LOGGER, UNIT_OF_WORK } from '@core/domain/ports/services';
import { EntityNotFoundException, DuplicateEntityException } from '@core/domain/base';
import { Email } from '../../domain/value-objects/email.value-object';
import type { UserStatus } from '../../domain/enums/user-status.enum';
import {
  type IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';

/**
 * Update User Input
 */
export interface UpdateUserInput {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  status?: UserStatus;
  roleIds?: string[];
}

/**
 * Update User Output
 */
export interface UpdateUserOutput {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  roleIds: readonly string[];
  emailVerified: boolean;
  updatedAt: Date;
}

/**
 * Update User Use Case
 *
 * Updates an existing user.
 *
 * Section 2.2: Application Layer - UseCase for update operation
 */
@Injectable()
export class UpdateUserUseCase extends BaseUseCase<UpdateUserInput, UpdateUserOutput> {
  constructor(
    @Inject(LOGGER) logger: ILogger,
    @Inject(UNIT_OF_WORK) unitOfWork: IUnitOfWork,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {
    super(logger, unitOfWork);
  }

  protected async executeImpl(
    input: UpdateUserInput,
    context?: UseCaseContext,
  ): Promise<Result<UpdateUserOutput>> {
    try {
      const tenantId = context?.tenantId;
      if (!tenantId) {
        return Result.fail(new Error('Tenant ID is required'));
      }

      // Find existing user
      const user = await this.userRepository.findById(input.id);
      if (!user) {
        return Result.fail(new EntityNotFoundException('User', input.id));
      }

      // Verify user belongs to tenant
      if (user.tenantId !== tenantId) {
        return Result.fail(new EntityNotFoundException('User', input.id));
      }

      // Update email if provided
      if (input.email && input.email !== user.email.value) {
        const newEmail = Email.create(input.email);

        // Check for duplicate email
        const emailExists = await this.userRepository.emailExists(
          newEmail.value,
          tenantId,
          user.id,
        );
        if (emailExists) {
          return Result.fail(new DuplicateEntityException('User', 'email', newEmail.value));
        }

        user.changeEmail(newEmail);
      }

      // Update other fields
      if (input.firstName !== undefined || input.lastName !== undefined) {
        user.updateProfile(input.firstName ?? user.firstName, input.lastName ?? user.lastName);
      }

      if (input.status !== undefined) {
        user.changeStatus(input.status);
      }

      if (input.roleIds !== undefined) {
        user.updateRoles(input.roleIds);
      }

      // Persist changes
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
        roleIds: user.roleIds,
        emailVerified: user.emailVerified,
        updatedAt: user.updatedAt,
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
