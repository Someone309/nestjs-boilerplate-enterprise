import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Swagger Configuration Options
 */
export interface SwaggerConfig {
  title: string;
  description: string;
  version: string;
  basePath: string;
  enabled: boolean;
}

/**
 * Default Swagger configuration
 */
export const swaggerConfig: SwaggerConfig = {
  title: 'NestJS Boilerplate API',
  description: `
## API Documentation

This API follows Clean Architecture principles with a Modular Monolith structure.

### Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <access_token>
\`\`\`

### Response Format

All responses follow a standard envelope:

**Success Response:**
\`\`\`json
{
  "success": true,
  "data": { ... },
  "meta": {
    "pagination": { ... }
  }
}
\`\`\`

**Error Response:**
\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": [ ... ],
    "timestamp": "2026-01-15T10:30:00.000Z",
    "path": "/api/v1/resource",
    "requestId": "req_abc123"
  }
}
\`\`\`

### Rate Limiting

- Anonymous: 30 requests/minute
- Authenticated: 100 requests/minute
- Premium: 500 requests/minute

Rate limit headers are included in all responses:
- \`X-RateLimit-Limit\`: Maximum requests per window
- \`X-RateLimit-Remaining\`: Remaining requests
- \`X-RateLimit-Reset\`: Unix timestamp when limit resets

### Pagination

Collection endpoints support pagination:
- \`page\`: Page number (1-indexed, default: 1)
- \`limit\`: Items per page (default: 20, max: 100)
- \`sort\`: Sort field (prefix with \`-\` for DESC)

### Multi-Tenancy

Most endpoints are tenant-scoped. Include the tenant context via:
- JWT token (contains tenantId claim)
- \`X-Tenant-Id\` header (for service-to-service calls)
`,
  version: '1.0.0',
  basePath: 'api/v1',
  enabled: true,
};

/**
 * Setup Swagger documentation
 *
 * Section 11: API Response Standards
 */
export function setupSwagger(app: INestApplication, config: SwaggerConfig = swaggerConfig): void {
  if (!config.enabled) {
    return;
  }

  const documentBuilder = new DocumentBuilder()
    .setTitle(config.title)
    .setDescription(config.description)
    .setVersion(config.version)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT access token',
        in: 'header',
      },
      'bearer', // Default name used by @ApiBearerAuth()
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-Tenant-Id',
        in: 'header',
        description: 'Tenant ID for multi-tenant context',
      },
      'Tenant-Id',
    )
    .addServer(`/${config.basePath}`, 'API Server')
    .addTag('Auth', 'Authentication and authorization endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Roles', 'Role and permission management endpoints')
    .addTag('Tenants', 'Tenant management endpoints (super-admin only)')
    .addTag('Health', 'Health check and monitoring endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, documentBuilder, {
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `${controllerKey}_${methodKey}`,
  });

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: `${config.title} - API Documentation`,
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin-bottom: 20px }
    `,
  });
}
