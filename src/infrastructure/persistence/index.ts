// Unified Database Module (auto-switches based on DB_TYPE and DB_ORM)
export { DatabaseModule, createDatabaseModule, type OrmType } from './database.module';

// TypeORM (postgres, mysql, sqlite)
export { DatabaseModule as TypeOrmDatabaseModule } from './typeorm/database.module';
export * from './typeorm/base';
export * from './typeorm/entities';
export * from './typeorm/repositories';

// Mongoose (mongodb)
export { MongooseDatabaseModule } from './mongoose/mongoose.module';
export * from './mongoose/base';
export * from './mongoose/schemas';

// Prisma (postgres, mysql, sqlite)
export { PrismaDatabaseModule, PRISMA_CLIENT } from './prisma/prisma.module';
export * from './prisma/base';

// Mappers
export * from './mappers';
