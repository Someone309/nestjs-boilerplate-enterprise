---
to: src/modules/<%= name %>/<%= name %>.module.ts
---
import { Module } from '@nestjs/common';
import { <%= h.changeCase.pascal(name) %>Controller } from './presentation/controllers/<%= name %>.controller';
import { <%= h.changeCase.constant(name) %>_REPOSITORY } from './domain/repositories/<%= name %>.repository.interface';
import { Create<%= h.changeCase.pascal(name) %>UseCase } from './application/use-cases/create-<%= name %>.use-case';
import { Get<%= h.changeCase.pascal(name) %>UseCase } from './application/use-cases/get-<%= name %>.use-case';
import { List<%= h.changeCase.pascal(name) %>sUseCase } from './application/use-cases/list-<%= name %>s.use-case';
import { Update<%= h.changeCase.pascal(name) %>UseCase } from './application/use-cases/update-<%= name %>.use-case';
import { Delete<%= h.changeCase.pascal(name) %>UseCase } from './application/use-cases/delete-<%= name %>.use-case';

/**
 * <%= h.changeCase.pascal(name) %> Module
 *
 * <%= description || `Manages ${name} resources.` %>
 *
 * Note: Repository is provided by the database module (TypeORM/Mongoose/Prisma).
 * See Section 8.6: Database Switching Guide
 */
@Module({
  controllers: [<%= h.changeCase.pascal(name) %>Controller],
  providers: [
    // Use Cases
    Create<%= h.changeCase.pascal(name) %>UseCase,
    Get<%= h.changeCase.pascal(name) %>UseCase,
    List<%= h.changeCase.pascal(name) %>sUseCase,
    Update<%= h.changeCase.pascal(name) %>UseCase,
    Delete<%= h.changeCase.pascal(name) %>UseCase,
  ],
  exports: [
    // Repository is provided by database module but re-exported for convenience
    <%= h.changeCase.constant(name) %>_REPOSITORY,
    Create<%= h.changeCase.pascal(name) %>UseCase,
    Get<%= h.changeCase.pascal(name) %>UseCase,
    List<%= h.changeCase.pascal(name) %>sUseCase,
    Update<%= h.changeCase.pascal(name) %>UseCase,
    Delete<%= h.changeCase.pascal(name) %>UseCase,
  ],
})
export class <%= h.changeCase.pascal(name) %>Module {}
