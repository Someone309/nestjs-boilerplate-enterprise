import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase, type UseCaseContext, Result } from '@core/application/base';
import type { IUnitOfWork } from '@core/domain/ports/repositories';
import { type ILogger, LOGGER, UNIT_OF_WORK } from '@core/domain/ports/services';
import { EntityNotFoundException } from '@core/domain/base';
import { TenantStatus } from '../../domain/entities/tenant.entity';
import {
  type ITenantRepository,
  TENANT_REPOSITORY,
} from '../../domain/repositories/tenant.repository.interface';

/**
 * Delete Tenant Input
 */
export interface DeleteTenantInput {
  id: string;
  hardDelete?: boolean;
}

/**
 * Delete Tenant Output
 */
export interface DeleteTenantOutput {
  id: string;
  deleted: boolean;
  deletedAt: Date;
}

/**
 * Delete Tenant Use Case
 *
 * Deletes or suspends a tenant.
 * Typically only accessible by super admins.
 */
@Injectable()
export class DeleteTenantUseCase extends BaseUseCase<DeleteTenantInput, DeleteTenantOutput> {
  constructor(
    @Inject(LOGGER) logger: ILogger,
    @Inject(UNIT_OF_WORK) unitOfWork: IUnitOfWork,
    @Inject(TENANT_REPOSITORY) private readonly tenantRepository: ITenantRepository,
  ) {
    super(logger, unitOfWork);
  }

  protected async executeImpl(
    input: DeleteTenantInput,
    context?: UseCaseContext,
  ): Promise<Result<DeleteTenantOutput>> {
    try {
      // Only super admins can delete tenants
      if (!context?.isSuperAdmin) {
        return Result.fail(new Error('Only super admins can delete tenants'));
      }

      // Find existing tenant
      const tenant = await this.tenantRepository.findById(input.id);
      if (!tenant) {
        return Result.fail(new EntityNotFoundException('Tenant', input.id));
      }

      const deletedAt = new Date();

      if (input.hardDelete) {
        // Hard delete - permanently remove from database
        // WARNING: This will cascade delete all tenant data
        const deleted = await this.tenantRepository.delete(input.id);
        if (!deleted) {
          return Result.fail(new Error('Failed to delete tenant'));
        }
      } else {
        // Soft delete - mark as inactive
        if (tenant.status === TenantStatus.INACTIVE) {
          return Result.fail(new Error('Tenant is already inactive'));
        }

        tenant.deactivate();
        await this.tenantRepository.save(tenant);
      }

      return Result.ok({
        id: input.id,
        deleted: true,
        deletedAt,
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
