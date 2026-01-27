import { Module, type DynamicModule, Global, type OnModuleDestroy, Inject } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, type TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { DatabaseConfig } from '@config/database.config';
import { type ILogger, LOGGER } from '@core/domain/ports/services';
import { UNIT_OF_WORK } from '@core/domain/ports/repositories';
import { TypeOrmUnitOfWork } from './base/unit-of-work.typeorm';

// Entities
import { UserEntity } from './entities/user.entity';
import { RoleEntity } from './entities/role.entity';
import { TenantEntity } from './entities/tenant.entity';
import { RefreshTokenEntity } from './entities/refresh-token.entity';

// Repositories
import { TypeOrmUserRepository } from './repositories/user.repository';
import { TypeOrmRoleRepository } from './repositories/role.repository';
import { TypeOrmTenantRepository } from './repositories/tenant.repository';
import {
  TypeOrmRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from './repositories/refresh-token.repository';

// Repository tokens
import { USER_REPOSITORY } from '@modules/user/domain/repositories';
import { ROLE_REPOSITORY } from '@modules/role/domain/repositories';
import { TENANT_REPOSITORY } from '@modules/tenant/domain/repositories';

/**
 * Database Module
 *
 * Provides TypeORM database connectivity.
 *
 * Section 8: Database Abstraction Strategy
 * Section 12.6: Database Operations
 */
@Global()
@Module({})
export class DatabaseModule implements OnModuleDestroy {
  constructor(@Inject(LOGGER) private readonly logger: ILogger) {}

  /**
   * Configure TypeORM asynchronously with ConfigService
   */
  static forRootAsync(): DynamicModule {
    return {
      module: DatabaseModule,
      global: true,
      imports: [
        // Register TypeORM entities for repositories
        TypeOrmModule.forFeature([UserEntity, RoleEntity, TenantEntity, RefreshTokenEntity]),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
            const dbConfig = configService.get<DatabaseConfig>('database');

            if (!dbConfig) {
              throw new Error('Database configuration not found');
            }

            // TypeORM supports postgres, mysql, sqlite - NOT mongodb
            // For MongoDB, use MongooseModule instead
            const dbType = dbConfig.type || 'postgres';
            if (dbType === 'mongodb') {
              throw new Error(
                'MongoDB is not supported by TypeORM module. ' +
                  'Set DB_TYPE=postgres in your .env file, or use MongooseModule for MongoDB.',
              );
            }

            const sqlConfig = dbConfig.sql;

            const options = {
              type: dbType,
              host: sqlConfig.host,
              port: sqlConfig.port,
              username: sqlConfig.username,
              password: sqlConfig.password,
              database: sqlConfig.database,

              // Entity configuration
              entities: [`${__dirname}/entities/*.entity{.ts,.js}`],
              autoLoadEntities: true,

              // Migration configuration
              migrations: [`${__dirname}/migrations/*{.ts,.js}`],
              migrationsRun: sqlConfig.migrationsRun,

              // Synchronize - NEVER use in production
              synchronize: sqlConfig.synchronize,

              // Logging
              logging: sqlConfig.logging,
              logger: sqlConfig.logging ? 'advanced-console' : undefined,

              // Connection pool (Section 12.6)
              extra: {
                // Pool configuration
                max: sqlConfig.poolMax,
                min: sqlConfig.poolMin,
                connectionTimeoutMillis: sqlConfig.connectionTimeout,
                idleTimeoutMillis: sqlConfig.poolIdleTimeout,

                // Query timeouts (Section 12.6)
                options: `-c statement_timeout=${sqlConfig.statementTimeout} -c lock_timeout=${sqlConfig.lockTimeout}`,

                // Connection validation
                testOnBorrow: true,
              },

              // SSL configuration
              ssl: sqlConfig.ssl ? { rejectUnauthorized: sqlConfig.sslRejectUnauthorized } : false,

              // Retry configuration
              retryAttempts: 3,
              retryDelay: 1000,
            } as TypeOrmModuleOptions;

            return options;
          },
        }),
      ],
      providers: [
        // Unit of Work - Transaction management (Section 8.5)
        {
          provide: UNIT_OF_WORK,
          useClass: TypeOrmUnitOfWork,
        },
        // Repositories
        {
          provide: USER_REPOSITORY,
          useClass: TypeOrmUserRepository,
        },
        {
          provide: ROLE_REPOSITORY,
          useClass: TypeOrmRoleRepository,
        },
        {
          provide: TENANT_REPOSITORY,
          useClass: TypeOrmTenantRepository,
        },
        {
          provide: REFRESH_TOKEN_REPOSITORY,
          useClass: TypeOrmRefreshTokenRepository,
        },
      ],
      exports: [
        TypeOrmModule,
        UNIT_OF_WORK,
        USER_REPOSITORY,
        ROLE_REPOSITORY,
        TENANT_REPOSITORY,
        REFRESH_TOKEN_REPOSITORY,
      ],
    };
  }

  /**
   * Graceful shutdown - close database connections
   */
  onModuleDestroy(): void {
    this.logger.log('Closing database connections...', 'DatabaseModule');
  }
}
