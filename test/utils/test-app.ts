import { type TestingModule, Test } from '@nestjs/testing';
import { type INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import type { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

/**
 * Test Application Factory
 *
 * Creates a NestJS application instance for E2E testing.
 */
export async function createTestApp(): Promise<INestApplication<App>> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  // Apply the same configuration as production
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );

  // Match production API prefix and versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.enableCors();

  await app.init();

  return app;
}

/**
 * Close test application
 */
export async function closeTestApp(app: INestApplication | undefined): Promise<void> {
  if (app) {
    await app.close();
  }
}
