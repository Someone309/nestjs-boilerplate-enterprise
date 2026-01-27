import { registerAs } from '@nestjs/config';

/**
 * Database Configuration
 *
 * Following Section 8 - Database Abstraction Strategy
 * and Section 12.6 - Database Operations
 *
 * Supports both MongoDB (primary) and PostgreSQL (alternative)
 */
export const databaseConfig = registerAs('database', () => ({
  // Database Type: postgres | mysql | sqlite (mongodb requires MongooseModule)
  type: (process.env.DB_TYPE as 'mongodb' | 'postgres' | 'mysql' | 'sqlite') || 'postgres',

  // ============================================
  // MongoDB Configuration (Primary)
  // ============================================
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/nestjs_boilerplate',

    // Connection Pool
    maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10', 10),
    minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2', 10),

    // Timeouts
    serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT || '5000', 10),
    socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT || '30000', 10),
    connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT || '10000', 10),

    // Auth (optional)
    username: process.env.MONGODB_USERNAME,
    password: process.env.MONGODB_PASSWORD,
    authSource: process.env.MONGODB_AUTH_SOURCE || 'admin',
  },

  // ============================================
  // PostgreSQL/MySQL Configuration (Alternative)
  // ============================================
  sql: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'nestjs_boilerplate',

    // SSL
    ssl: process.env.DB_SSL === 'true',
    sslRejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',

    // Connection Pool (Section 12.6)
    poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
    poolIdleTimeout: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10),

    // Query timeouts (Section 12.6)
    statementTimeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000', 10),
    lockTimeout: parseInt(process.env.DB_LOCK_TIMEOUT || '10000', 10),
    idleInTransactionTimeout: parseInt(process.env.DB_IDLE_IN_TRANSACTION_TIMEOUT || '60000', 10),

    // TypeORM specific
    synchronize: process.env.DB_SYNCHRONIZE === 'true', // Never use in production!
    logging: process.env.DB_LOGGING === 'true',
    migrationsRun: process.env.DB_MIGRATIONS_RUN === 'true',

    // Read replica (optional)
    replicaHost: process.env.DB_REPLICA_HOST,
    replicaPort: parseInt(process.env.DB_REPLICA_PORT || '5432', 10),
  },
}));

export type DatabaseConfig = ReturnType<typeof databaseConfig>;
