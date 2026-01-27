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
import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';

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
    // USER_REPOSITORY is provided by the database module
    CreateUserUseCase,
    GetUserUseCase,
    ListUsersUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    USER_REPOSITORY,
  ],
})
export class UserModule {}
