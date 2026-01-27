import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase, type UseCaseContext, Result } from '@core/application/base';
import type { IUnitOfWork } from '@core/domain/ports/repositories';
import { type ILogger, LOGGER, UNIT_OF_WORK } from '@core/domain/ports/services';
import { EntityNotFoundException } from '@core/domain/base';
import {
  type IRoleRepository,
  ROLE_REPOSITORY,
} from '../../domain/repositories/role.repository.interface';

/**
 * Get Role Input
 */
export interface GetRoleInput {
  id: string;
}

/**
 * Get Role Output
 */
export interface GetRoleOutput {
  id: string;
  name: string;
  description?: string;
  permissions: readonly string[];
  tenantId: string;
  isSystem: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get Role Use Case
 *
 * Retrieves a role by ID.
 */
@Injectable()
export class GetRoleUseCase extends BaseUseCase<GetRoleInput, GetRoleOutput> {
  constructor(
    @Inject(LOGGER) logger: ILogger,
    @Inject(UNIT_OF_WORK) unitOfWork: IUnitOfWork,
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: IRoleRepository,
  ) {
    super(logger, unitOfWork);
  }

  protected async executeImpl(
    input: GetRoleInput,
    context?: UseCaseContext,
  ): Promise<Result<GetRoleOutput>> {
    try {
      const tenantId = context?.tenantId;
      if (!tenantId) {
        return Result.fail(new Error('Tenant ID is required'));
      }

      const role = await this.roleRepository.findById(input.id);

      if (!role) {
        return Result.fail(new EntityNotFoundException('Role', input.id));
      }

      // Verify role belongs to tenant (system roles are accessible to all)
      if (!role.isSystem && role.tenantId !== tenantId) {
        return Result.fail(new EntityNotFoundException('Role', input.id));
      }

      return Result.ok({
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        tenantId: role.tenantId,
        isSystem: role.isSystem,
        isDefault: role.isDefault,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
