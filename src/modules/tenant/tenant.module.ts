import { Module } from '@nestjs/common';
import { TenantController } from './presentation/controllers/tenant.controller';
import {
  CreateTenantUseCase,
  GetTenantUseCase,
  ListTenantsUseCase,
  UpdateTenantUseCase,
  DeleteTenantUseCase,
} from './application/use-cases';

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
    // Export use cases for other modules
    // Note: TENANT_REPOSITORY is provided globally by DatabaseModule
    CreateTenantUseCase,
    GetTenantUseCase,
    ListTenantsUseCase,
    UpdateTenantUseCase,
    DeleteTenantUseCase,
  ],
})
export class TenantModule {}
