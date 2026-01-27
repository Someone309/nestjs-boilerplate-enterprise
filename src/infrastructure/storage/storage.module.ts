import { Global, Module, type DynamicModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STORAGE_SERVICE } from '@core/domain/ports/services';
import { LocalStorageAdapter } from './adapters/local-storage.adapter';
import { S3StorageAdapter } from './adapters/s3-storage.adapter';

/**
 * Storage driver types
 */
export type StorageDriver = 'local' | 's3';

/**
 * Storage Module
 *
 * Section 2.4: Infrastructure Layer - Storage
 *
 * Provides file storage capabilities with multiple drivers:
 * - local: Local filesystem storage (development)
 * - s3: Amazon S3 or compatible services (production)
 *
 * The driver is selected based on the STORAGE_DRIVER environment variable.
 */
@Global()
@Module({})
export class StorageModule {
  static forRoot(): DynamicModule {
    return {
      module: StorageModule,
      providers: [
        LocalStorageAdapter,
        S3StorageAdapter,
        {
          provide: STORAGE_SERVICE,
          useFactory: (
            configService: ConfigService,
            localAdapter: LocalStorageAdapter,
            s3Adapter: S3StorageAdapter,
          ) => {
            const driver = configService.get<StorageDriver>('storage.driver', 'local');

            switch (driver) {
              case 's3':
                return s3Adapter;
              case 'local':
              default:
                return localAdapter;
            }
          },
          inject: [ConfigService, LocalStorageAdapter, S3StorageAdapter],
        },
      ],
      exports: [STORAGE_SERVICE, LocalStorageAdapter, S3StorageAdapter],
    };
  }
}
