import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase, type UseCaseContext, Result } from '@core/application/base';
import type { IUnitOfWork } from '@core/domain/ports/repositories';
import { type ILogger, LOGGER, UNIT_OF_WORK } from '@core/domain/ports/services';
import { EntityNotFoundException, DuplicateEntityException } from '@core/domain/base';
import {
  type IRoleRepository,
  ROLE_REPOSITORY,
} from '../../domain/repositories/role.repository.interface';

/**
 * Update Role Input
 */
export interface UpdateRoleInput {
  id: string;
  name?: string;
  description?: string;
  permissions?: string[];
  isDefault?: boolean;
}

/**
 * Update Role Output
 */
export interface UpdateRoleOutput {
  id: string;
  name: string;
  description?: string;
  permissions: readonly string[];
  isSystem: boolean;
  isDefault: boolean;
  updatedAt: Date;
}

/**
 * Update Role Use Case
 *
 * Updates an existing role.
 */
@Injectable()
export class UpdateRoleUseCase extends BaseUseCase<UpdateRoleInput, UpdateRoleOutput> {
  constructor(
    @Inject(LOGGER) logger: ILogger,
    @Inject(UNIT_OF_WORK) unitOfWork: IUnitOfWork,
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: IRoleRepository,
  ) {
    super(logger, unitOfWork);
  }

  protected async executeImpl(
    input: UpdateRoleInput,
    context?: UseCaseContext,
  ): Promise<Result<UpdateRoleOutput>> {
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

      // System roles have limited modifications
      if (role.isSystem) {
        if (input.name !== undefined || input.permissions !== undefined) {
          return Result.fail(new Error('Cannot modify name or permissions of system role'));
        }
      }

      // Update name if provided
      if (input.name !== undefined && input.name !== role.name) {
        // Check for duplicate name
        const existingRole = await this.roleRepository.findByName(input.name, tenantId);
        if (existingRole && existingRole.id !== role.id) {
          return Result.fail(new DuplicateEntityException('Role', 'name', input.name));
        }
        role.updateName(input.name);
      }

      // Update description if provided
      if (input.description !== undefined) {
        role.updateDescription(input.description);
      }

      // Update permissions if provided
      if (input.permissions !== undefined) {
        role.setPermissions(input.permissions);
      }

      // Update default status if provided
      if (input.isDefault !== undefined) {
        role.setDefault(input.isDefault);
      }

      // Persist changes
      await this.roleRepository.save(role);

      return Result.ok({
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        isSystem: role.isSystem,
        isDefault: role.isDefault,
        updatedAt: role.updatedAt,
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
