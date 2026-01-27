import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase, type UseCaseContext, Result } from '@core/application/base';
import type { IUnitOfWork } from '@core/domain/ports/repositories';
import { type ILogger, LOGGER, UNIT_OF_WORK } from '@core/domain/ports/services';
import { DuplicateEntityException } from '@core/domain/base';
import { generateUUID, generateSlug } from '@shared/utils';
import { Tenant, TenantStatus, type TenantSettings } from '../../domain/entities/tenant.entity';
import {
  type ITenantRepository,
  TENANT_REPOSITORY,
} from '../../domain/repositories/tenant.repository.interface';

/**
 * Create Tenant Input
 */
export interface CreateTenantInput {
  name: string;
  slug?: string;
  settings?: TenantSettings;
  trialDays?: number;
}

/**
 * Create Tenant Output
 */
export interface CreateTenantOutput {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  settings: TenantSettings;
  trialEndsAt?: Date;
  createdAt: Date;
}

/**
 * Create Tenant Use Case
 *
 * Creates a new tenant (organization).
 *
 * Section 3.2: Feature Modules - TenantModule
 */
@Injectable()
export class CreateTenantUseCase extends BaseUseCase<CreateTenantInput, CreateTenantOutput> {
  constructor(
    @Inject(LOGGER) logger: ILogger,
    @Inject(UNIT_OF_WORK) unitOfWork: IUnitOfWork,
    @Inject(TENANT_REPOSITORY) private readonly tenantRepository: ITenantRepository,
  ) {
    super(logger, unitOfWork);
  }

  protected async executeImpl(
    input: CreateTenantInput,
    context?: UseCaseContext,
  ): Promise<Result<CreateTenantOutput>> {
    try {
      // Generate or use provided slug
      const slug = input.slug?.toLowerCase() || generateSlug(input.name);

      // Check for duplicate slug
      const slugExists = await this.tenantRepository.slugExists(slug);
      if (slugExists) {
        return Result.fail(new DuplicateEntityException('Tenant', 'slug', slug));
      }

      // Calculate trial end date
      let trialEndsAt: Date | undefined;
      if (input.trialDays && input.trialDays > 0) {
        trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + input.trialDays);
      }

      // Create tenant entity
      const tenantId = generateUUID();
      const status = input.trialDays ? TenantStatus.TRIAL : TenantStatus.ACTIVE;

      const tenant = Tenant.create(tenantId, {
        name: input.name,
        slug,
        status,
        settings: input.settings || {},
        ownerId: context?.userId,
        trialEndsAt,
      });

      // Persist tenant
      await this.tenantRepository.save(tenant);

      return Result.ok({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        settings: tenant.settings,
        trialEndsAt: tenant.trialEndsAt,
        createdAt: tenant.createdAt,
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
