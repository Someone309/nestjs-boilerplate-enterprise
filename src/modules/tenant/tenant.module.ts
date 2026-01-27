import { Module } from '@nestjs/common';
import { TenantController } from './presentation/controllers/tenant.controller';
import {
  CreateTenantUseCase,
  GetTenantUseCase,
  ListTenantsUseCase,
  UpdateTenantUseCase,
  DeleteTenantUseCase,
} from './application/use-cases';
import { TENANT_REPOSITORY } from './domain/repositories/tenant.repository.interface';

/**
 * Tenant Module
 *
 * Feature module for multi-tenancy.
 * Repository is provided by the database module (TypeORM/Mongoose/Prisma).
 *
 * Section 3.2: Feature Modules - TenantModule
 * Section 8.6: Database Switching Guide
 */
@Module({
  controllers: [TenantController],
  providers: [
    // Use Cases
    CreateTenantUseCase,
    GetTenantUseCase,
    ListTenantsUseCase,
    UpdateTenantUseCase,
    DeleteTenantUseCase,
  ],
  exports: [
    // TENANT_REPOSITORY is provided by the database module
    CreateTenantUseCase,
    GetTenantUseCase,
    ListTenantsUseCase,
    UpdateTenantUseCase,
    DeleteTenantUseCase,
    TENANT_REPOSITORY,
  ],
})
export class TenantModule {}
