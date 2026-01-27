import { Module, forwardRef } from '@nestjs/common';
import { RoleController } from './presentation/controllers/role.controller';
import {
  CreateRoleUseCase,
  GetRoleUseCase,
  ListRolesUseCase,
  UpdateRoleUseCase,
  DeleteRoleUseCase,
} from './application/use-cases';
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
    // Use cases can be used by other modules
    // Note: ROLE_REPOSITORY is provided globally by DatabaseModule
    CreateRoleUseCase,
    GetRoleUseCase,
    ListRolesUseCase,
    UpdateRoleUseCase,
    DeleteRoleUseCase,
  ],
})
export class RoleModule {}
