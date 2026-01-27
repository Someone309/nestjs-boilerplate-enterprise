import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase, type UseCaseContext, Result } from '@core/application/base';
import type { IUnitOfWork } from '@core/domain/ports/repositories';
import { type ILogger, LOGGER, UNIT_OF_WORK } from '@core/domain/ports/services';
import { EntityNotFoundException } from '@core/domain/base';
import type { UserStatus } from '../../domain/enums/user-status.enum';
import {
  type IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';

/**
 * Get User Input
 */
export interface GetUserInput {
  id: string;
}

/**
 * Get User Output
 */
export interface GetUserOutput {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  roleIds: readonly string[];
  emailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get User Use Case
 *
 * Retrieves a user by ID.
 *
 * Section 2.2: Application Layer - Query for read operation
 */
@Injectable()
export class GetUserUseCase extends BaseUseCase<GetUserInput, GetUserOutput> {
  constructor(
    @Inject(LOGGER) logger: ILogger,
    @Inject(UNIT_OF_WORK) unitOfWork: IUnitOfWork,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {
    super(logger, unitOfWork);
  }

  protected async executeImpl(
    input: GetUserInput,
    context?: UseCaseContext,
  ): Promise<Result<GetUserOutput>> {
    try {
      const tenantId = context?.tenantId;
      if (!tenantId) {
        return Result.fail(new Error('Tenant ID is required'));
      }

      // Find user by ID
      const user = await this.userRepository.findById(input.id);

      if (!user) {
        return Result.fail(new EntityNotFoundException('User', input.id));
      }

      // Verify user belongs to tenant (unless super admin)
      if (user.tenantId !== tenantId) {
        return Result.fail(new EntityNotFoundException('User', input.id));
      }

      return Result.ok({
        id: user.id,
        email: user.email.value,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        roleIds: user.roleIds,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt ?? null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
