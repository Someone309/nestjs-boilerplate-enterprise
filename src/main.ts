import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import {
  AllExceptionsFilter,
  DomainExceptionFilter,
  ValidationExceptionFilter,
} from './shared/filters';
import {
  TransformResponseInterceptor,
  TimeoutInterceptor,
  ResponseTimeInterceptor,
} from './shared/interceptors';
import { TrimStringPipe, SanitizePipe } from './shared/pipes';
import { setupSwagger } from './config/swagger.config';
import type { AppConfig } from './config/app.config';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const appConfig = configService.get<AppConfig>('app');

  // ============================================
  // API Versioning
  // ============================================
  app.setGlobalPrefix(appConfig?.apiPrefix || 'api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: appConfig?.apiVersion || 'v1',
  });

  // ============================================
  // Security Headers (Section 12.5)
  // ============================================
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-origin' },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
      noSniff: true,
      originAgentCluster: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  // ============================================
  // Response Compression (Section 12.9)
  // ============================================
  app.use(
    compression({
      filter: (req, res) => {
        // Don't compress if client doesn't accept it
        if (req.headers['x-no-compression']) {
          return false;
        }
        // Use compression's default filter (checks Accept-Encoding)
        return compression.filter(req, res);
      },
      threshold: 1024, // Only compress responses > 1KB
      level: 6, // Compression level (1-9, 6 is default balance)
    }),
  );

  // ============================================
  // Request Size Limits (Section 12.5)
  // ============================================
  app.use(json({ limit: appConfig?.jsonBodyLimit || '1mb' }));
  app.use(urlencoded({ extended: true, limit: appConfig?.urlEncodedLimit || '1mb' }));

  // ============================================
  // CORS Configuration (Section 12.5)
  // ============================================
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      const allowedOrigins = appConfig?.corsOrigins || ['http://localhost:3000'];
      // Allow requests with no origin (mobile apps, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-Id',
      'X-Tenant-Id',
      'Accept-Language',
    ],
    exposedHeaders: [
      'X-Request-Id',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
    maxAge: 86400, // Preflight cache 24h
  });

  // ============================================
  // Global Pipes (Section 12.5)
  // Order: TrimString -> Sanitize -> Validation
  // ============================================
  app.useGlobalPipes(
    new TrimStringPipe(), // Trim whitespace from strings
    new SanitizePipe(), // Remove null bytes, path traversal
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO (security!)
      forbidNonWhitelisted: true, // Reject unknown properties with 400
      transform: true, // Auto-transform to DTO class instances
      transformOptions: {
        enableImplicitConversion: false, // Explicit typing only (security!)
      },
      stopAtFirstError: false, // Return all errors, not just first
      errorHttpStatusCode: 400,
    }),
  );

  // ============================================
  // Global Interceptors (Section 4.1)
  // ============================================
  app.useGlobalInterceptors(
    new ResponseTimeInterceptor(),
    new TimeoutInterceptor(),
    new TransformResponseInterceptor(),
  );

  // ============================================
  // Global Filters (Section 4.3)
  // Order matters: More specific filters first
  // ============================================
  app.useGlobalFilters(
    new ValidationExceptionFilter(), // Handle BadRequestException from validation
    new DomainExceptionFilter(), // Handle domain exceptions
    new AllExceptionsFilter(), // Catch-all for remaining exceptions
  );

  // ============================================
  // Swagger Documentation (Section 11)
  // ============================================
  if (appConfig?.nodeEnv !== 'production') {
    setupSwagger(app, {
      title: 'NestJS Boilerplate API',
      description: 'Clean Architecture + Modular Monolith API',
      version: '1.0.0',
      basePath: `${appConfig?.apiPrefix}/${appConfig?.apiVersion}`,
      enabled: true,
    });
    logger.log(`Swagger documentation available at: /docs`);
  }

  // ============================================
  // Graceful Shutdown (Section 12.2)
  // ============================================
  app.enableShutdownHooks();

  // ============================================
  // Start Server
  // ============================================
  const host = appConfig?.host || '0.0.0.0';
  const port = appConfig?.port || 3000;

  await app.listen(port, host);

  logger.log(`Application is running on: http://${host}:${port}`);
  logger.log(`API Prefix: /${appConfig?.apiPrefix}/${appConfig?.apiVersion}`);
  logger.log(`Environment: ${appConfig?.nodeEnv}`);
}

void bootstrap();
