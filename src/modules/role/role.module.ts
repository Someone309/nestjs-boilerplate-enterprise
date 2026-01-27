import { Module, forwardRef } from '@nestjs/common';
import { RoleController } from './presentation/controllers/role.controller';
import {
  CreateRoleUseCase,
  GetRoleUseCase,
  ListRolesUseCase,
  UpdateRoleUseCase,
  DeleteRoleUseCase,
} from './application/use-cases';
import { ROLE_REPOSITORY } from './domain/repositories/role.repository.interface';
import { UserModule } from '@modules/user/user.module';

/**
 * Role Module
 *
 * Feature module for role-based access control (RBAC).
 * Repository is provided by the database module (TypeORM/Mongoose/Prisma).
 *
 * Section 3.2: Feature Modules - RoleModule
 * Section 8.6: Database Switching Guide
 */
@Module({
  imports: [forwardRef(() => UserModule)],
  controllers: [RoleController],
  providers: [
    // Use Cases
    CreateRoleUseCase,
    GetRoleUseCase,
    ListRolesUseCase,
    UpdateRoleUseCase,
    DeleteRoleUseCase,
  ],
  exports: [
    // ROLE_REPOSITORY is provided by the database module
    CreateRoleUseCase,
    GetRoleUseCase,
    ListRolesUseCase,
    UpdateRoleUseCase,
    DeleteRoleUseCase,
    ROLE_REPOSITORY,
  ],
})
export class RoleModule {}
