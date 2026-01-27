import { Module } from '@nestjs/common';
import { UserController } from './presentation/controllers/user.controller';
import { UserResolver } from './presentation/graphql/resolvers/user.resolver';
import {
  CreateUserUseCase,
  GetUserUseCase,
  ListUsersUseCase,
  UpdateUserUseCase,
  DeleteUserUseCase,
} from './application/use-cases';
import { UserEventHandler } from './application/event-handlers';

/**
 * User Module
 *
 * Feature module for user management.
 * Repository is provided by the database module (TypeORM/Mongoose/Prisma).
 *
 * Section 3.2: Feature Modules - UserModule
 * Section 8.6: Database Switching Guide
 */
@Module({
  controllers: [UserController],
  providers: [
    // GraphQL Resolvers
    UserResolver,

    // Use Cases
    CreateUserUseCase,
    GetUserUseCase,
    ListUsersUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,

    // Event Handlers
    UserEventHandler,
  ],
  exports: [
    // Export use cases for other modules
    // Note: USER_REPOSITORY is provided globally by DatabaseModule
    CreateUserUseCase,
    GetUserUseCase,
    ListUsersUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
  ],
})
export class UserModule {}
