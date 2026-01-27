import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase, type UseCaseContext, Result } from '@core/application/base';
import type { IUnitOfWork } from '@core/domain/ports/repositories';
import { type ILogger, LOGGER, UNIT_OF_WORK } from '@core/domain/ports/services';
import { EntityNotFoundException } from '@core/domain/base';
import {
  type IRoleRepository,
  ROLE_REPOSITORY,
} from '../../domain/repositories/role.repository.interface';
import {
  type IUserRepository,
  USER_REPOSITORY,
} from '@modules/user/domain/repositories/user.repository.interface';

/**
 * Delete Role Input
 */
export interface DeleteRoleInput {
  id: string;
}

/**
 * Delete Role Output
 */
export interface DeleteRoleOutput {
  id: string;
  deleted: boolean;
  deletedAt: Date;
}

/**
 * Delete Role Use Case
 *
 * Deletes a role if it's not a system role and not in use.
 */
@Injectable()
export class DeleteRoleUseCase extends BaseUseCase<DeleteRoleInput, DeleteRoleOutput> {
  constructor(
    @Inject(LOGGER) logger: ILogger,
    @Inject(UNIT_OF_WORK) unitOfWork: IUnitOfWork,
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: IRoleRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {
    super(logger, unitOfWork);
  }

  protected async executeImpl(
    input: DeleteRoleInput,
    context?: UseCaseContext,
  ): Promise<Result<DeleteRoleOutput>> {
    try {
      const tenantId = context?.tenantId;
      if (!tenantId) {
        return Result.fail(new Error('Tenant ID is required'));
      }

      // Find existing role
      const role = await this.roleRepository.findById(input.id);
      if (!role) {
        return Result.fail(new EntityNotFoundException('Role', input.id));
      }

      // Verify role belongs to tenant
      if (role.tenantId !== tenantId) {
        return Result.fail(new EntityNotFoundException('Role', input.id));
      }

      // Cannot delete system roles
      if (role.isSystem) {
        return Result.fail(new Error('Cannot delete system role'));
      }

      // Cannot delete default role
      if (role.isDefault) {
        return Result.fail(
          new Error('Cannot delete default role. Set another role as default first.'),
        );
      }

      // Check if role is in use by any users
      const usersWithRole = await this.userRepository.findByRole(input.id, { page: 1, limit: 1 });
      if (usersWithRole.total > 0) {
        return Result.fail(
          new Error(`Cannot delete role. ${usersWithRole.total} user(s) are using this role.`),
        );
      }

      // Delete role
      const deleted = await this.roleRepository.delete(input.id);
      if (!deleted) {
        return Result.fail(new Error('Failed to delete role'));
      }

      return Result.ok({
        id: input.id,
        deleted: true,
        deletedAt: new Date(),
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
