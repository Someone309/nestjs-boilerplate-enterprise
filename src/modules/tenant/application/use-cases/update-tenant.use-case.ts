import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase, type UseCaseContext, Result } from '@core/application/base';
import type { IUnitOfWork } from '@core/domain/ports/repositories';
import { type ILogger, LOGGER, UNIT_OF_WORK } from '@core/domain/ports/services';
import { EntityNotFoundException } from '@core/domain/base';
import { TenantStatus, type TenantSettings } from '../../domain/entities/tenant.entity';
import {
  type ITenantRepository,
  TENANT_REPOSITORY,
} from '../../domain/repositories/tenant.repository.interface';

/**
 * Update Tenant Input
 */
export interface UpdateTenantInput {
  id: string;
  name?: string;
  settings?: Partial<TenantSettings>;
  status?: TenantStatus;
}

/**
 * Update Tenant Output
 */
export interface UpdateTenantOutput {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  settings: TenantSettings;
  updatedAt: Date;
}

/**
 * Update Tenant Use Case
 *
 * Updates an existing tenant.
 */
@Injectable()
export class UpdateTenantUseCase extends BaseUseCase<UpdateTenantInput, UpdateTenantOutput> {
  constructor(
    @Inject(LOGGER) logger: ILogger,
    @Inject(UNIT_OF_WORK) unitOfWork: IUnitOfWork,
    @Inject(TENANT_REPOSITORY) private readonly tenantRepository: ITenantRepository,
  ) {
    super(logger, unitOfWork);
  }

  protected async executeImpl(
    input: UpdateTenantInput,
    context?: UseCaseContext,
  ): Promise<Result<UpdateTenantOutput>> {
    try {
      // Find existing tenant
      const tenant = await this.tenantRepository.findById(input.id);
      if (!tenant) {
        return Result.fail(new EntityNotFoundException('Tenant', input.id));
      }

      // Verify ownership or super admin access
      if (context?.tenantId !== input.id && !context?.isSuperAdmin) {
        return Result.fail(new Error('Access denied'));
      }

      // Update name if provided
      if (input.name !== undefined) {
        tenant.updateName(input.name);
      }

      // Update settings if provided
      if (input.settings !== undefined) {
        tenant.updateSettings(input.settings);
      }

      // Update status if provided (admin only)
      if (input.status !== undefined) {
        switch (input.status) {
          case TenantStatus.ACTIVE:
            tenant.activate();
            break;
          case TenantStatus.SUSPENDED:
            tenant.suspend();
            break;
          case TenantStatus.INACTIVE:
            tenant.deactivate();
            break;
          default:
            // Keep current status (TRIAL)
            break;
        }
      }

      // Persist changes
      await this.tenantRepository.save(tenant);

      return Result.ok({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        settings: tenant.settings,
        updatedAt: tenant.updatedAt,
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
