import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase, type UseCaseContext, Result } from '@core/application/base';
import type { IUnitOfWork } from '@core/domain/ports/repositories';
import { type ILogger, LOGGER, UNIT_OF_WORK } from '@core/domain/ports/services';
import { EntityNotFoundException } from '@core/domain/base';
import type { TenantStatus, TenantSettings } from '../../domain/entities/tenant.entity';
import {
  type ITenantRepository,
  TENANT_REPOSITORY,
} from '../../domain/repositories/tenant.repository.interface';

/**
 * Get Tenant Input
 */
export interface GetTenantInput {
  id: string;
}

/**
 * Get Tenant Output
 */
export interface GetTenantOutput {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  settings: TenantSettings;
  ownerId?: string;
  trialEndsAt?: Date;
  isTrialExpired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get Tenant Use Case
 *
 * Retrieves a tenant by ID.
 */
@Injectable()
export class GetTenantUseCase extends BaseUseCase<GetTenantInput, GetTenantOutput> {
  constructor(
    @Inject(LOGGER) logger: ILogger,
    @Inject(UNIT_OF_WORK) unitOfWork: IUnitOfWork,
    @Inject(TENANT_REPOSITORY) private readonly tenantRepository: ITenantRepository,
  ) {
    super(logger, unitOfWork);
  }

  protected async executeImpl(
    input: GetTenantInput,
    _context?: UseCaseContext,
  ): Promise<Result<GetTenantOutput>> {
    try {
      const tenant = await this.tenantRepository.findById(input.id);

      if (!tenant) {
        return Result.fail(new EntityNotFoundException('Tenant', input.id));
      }

      return Result.ok({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        settings: tenant.settings,
        ownerId: tenant.ownerId,
        trialEndsAt: tenant.trialEndsAt,
        isTrialExpired: tenant.isTrialExpired,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
