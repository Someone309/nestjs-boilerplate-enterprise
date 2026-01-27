import { Global, Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { CustomThrottlerGuard } from './throttle';
import type { ThrottleConfig } from '@config/throttle.config';

/**
 * Security Module
 *
 * Provides security features including:
 * - Rate limiting with tier support
 * - Input sanitization utilities
 *
 * Section 12.5: Security Hardening
 */
@Global()
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const throttleConfig = configService.get<ThrottleConfig>('throttle');

        return {
          throttlers: [
            {
              name: 'default',
              ttl: throttleConfig?.global?.ttl ?? 60000,
              limit: throttleConfig?.global?.limit ?? 100,
            },
          ],
          // In production, configure Redis storage
          // storage: new ThrottlerStorageRedisService(redisClient),
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    // Register CustomThrottlerGuard as global guard
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
  exports: [ThrottlerModule],
})
export class SecurityModule {}
