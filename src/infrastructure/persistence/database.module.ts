import { Module, type DynamicModule, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { DatabaseConfig } from '@config/database.config';

// Import all database modules
import { DatabaseModule as TypeOrmDatabaseModule } from './typeorm/database.module';
import { MongooseDatabaseModule } from './mongoose/mongoose.module';
import { PrismaDatabaseModule } from './prisma/prisma.module';

/**
 * Supported ORM types
 */
export type OrmType = 'typeorm' | 'prisma' | 'mongoose';

/**
 * Unified Database Module
 *
 * Auto-detects database type from configuration and loads the appropriate module.
 *
 * Supported configurations:
 * - DB_TYPE=postgres + DB_ORM=typeorm (default) → TypeORM with PostgreSQL
 * - DB_TYPE=postgres + DB_ORM=prisma → Prisma with PostgreSQL
 * - DB_TYPE=mysql + DB_ORM=typeorm → TypeORM with MySQL
 * - DB_TYPE=mysql + DB_ORM=prisma → Prisma with MySQL
 * - DB_TYPE=sqlite + DB_ORM=typeorm → TypeORM with SQLite
 * - DB_TYPE=mongodb → Mongoose (MongoDB only supports Mongoose)
 *
 * Configuration: Set DB_TYPE and optionally DB_ORM in .env file
 *
 * Section 8: Database Abstraction Strategy
 */
@Global()
@Module({})
export class DatabaseModule {
  /**
   * Register database module with async configuration
   * Auto-detects database type and loads appropriate driver
   */
  static forRootAsync(): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: 'DATABASE_MODULE_FACTORY',
          useFactory: (configService: ConfigService) => {
            const dbConfig = configService.get<DatabaseConfig>('database');
            return this.detectOrm(dbConfig?.type, process.env.DB_ORM as OrmType);
          },
          inject: [ConfigService],
        },
      ],
    };
  }

  /**
   * Detect which ORM to use based on database type and ORM preference
   */
  private static detectOrm(dbType?: string, ormType?: OrmType): OrmType {
    // MongoDB only supports Mongoose
    if (dbType === 'mongodb') {
      return 'mongoose';
    }

    // Use specified ORM or default to TypeORM
    return ormType || 'typeorm';
  }

  /**
   * Get the appropriate database module based on DB_TYPE and DB_ORM
   */
  static getModule(dbType: string, ormType?: OrmType): DynamicModule {
    if (dbType === 'mongodb') {
      return MongooseDatabaseModule.forRootAsync();
    }

    if (ormType === 'prisma') {
      return PrismaDatabaseModule.forRootAsync();
    }

    return TypeOrmDatabaseModule.forRootAsync();
  }
}

/**
 * Create database module based on environment
 * Use this function in AppModule imports array
 *
 * @example
 * imports: [
 *   createDatabaseModule(),
 * ]
 *
 * Environment variables:
 * - DB_TYPE: postgres | mysql | sqlite | mongodb
 * - DB_ORM: typeorm | prisma (optional, defaults to typeorm for SQL databases)
 */
export function createDatabaseModule(): DynamicModule {
  const dbType = process.env.DB_TYPE || 'postgres';
  const ormType = process.env.DB_ORM as OrmType;

  // MongoDB always uses Mongoose
  if (dbType === 'mongodb') {
    return MongooseDatabaseModule.forRootAsync();
  }

  // Use Prisma if specified
  if (ormType === 'prisma') {
    return PrismaDatabaseModule.forRootAsync();
  }

  // Default to TypeORM for SQL databases
  return TypeOrmDatabaseModule.forRootAsync();
}
