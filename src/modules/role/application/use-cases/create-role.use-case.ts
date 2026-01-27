import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase, type UseCaseContext, Result } from '@core/application/base';
import type { IUnitOfWork } from '@core/domain/ports/repositories';
import { type ILogger, LOGGER, UNIT_OF_WORK } from '@core/domain/ports/services';
import { DuplicateEntityException } from '@core/domain/base';
import { generateUUID } from '@shared/utils';
import { Role } from '../../domain/entities/role.entity';
import {
  type IRoleRepository,
  ROLE_REPOSITORY,
} from '../../domain/repositories/role.repository.interface';

/**
 * Create Role Input
 */
export interface CreateRoleInput {
  name: string;
  description?: string;
  permissions: string[];
  isDefault?: boolean;
}

/**
 * Create Role Output
 */
export interface CreateRoleOutput {
  id: string;
  name: string;
  description?: string;
  permissions: readonly string[];
  isSystem: boolean;
  isDefault: boolean;
  createdAt: Date;
}

/**
 * Create Role Use Case
 *
 * Creates a new role with permissions.
 *
 * Section 7.4: Security - Authorization with RBAC
 */
@Injectable()
export class CreateRoleUseCase extends BaseUseCase<CreateRoleInput, CreateRoleOutput> {
  constructor(
    @Inject(LOGGER) logger: ILogger,
    @Inject(UNIT_OF_WORK) unitOfWork: IUnitOfWork,
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: IRoleRepository,
  ) {
    super(logger, unitOfWork);
  }

  protected async executeImpl(
    input: CreateRoleInput,
    context?: UseCaseContext,
  ): Promise<Result<CreateRoleOutput>> {
    try {
      const tenantId = context?.tenantId;
      if (!tenantId) {
        return Result.fail(new Error('Tenant ID is required'));
      }

      // Check for duplicate role name
      const existingRole = await this.roleRepository.findByName(input.name, tenantId);
      if (existingRole) {
        return Result.fail(new DuplicateEntityException('Role', 'name', input.name));
      }

      // Create role entity
      const roleId = generateUUID();
      const role = Role.create(roleId, {
        name: input.name,
        description: input.description,
        permissions: input.permissions,
        tenantId,
        isSystem: false, // User-created roles are never system roles
        isDefault: input.isDefault,
      });

      // Persist role
      await this.roleRepository.save(role);

      return Result.ok({
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        isSystem: role.isSystem,
        isDefault: role.isDefault,
        createdAt: role.createdAt,
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
