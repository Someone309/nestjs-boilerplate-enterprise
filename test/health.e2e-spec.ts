import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import { createTestApp, closeTestApp } from './utils/test-app';
import { createRequestHelper } from './utils/test-helpers';

describe('Health Endpoints (e2e)', () => {
  let app: INestApplication<App>;
  let req: ReturnType<typeof createRequestHelper>;

  beforeAll(async () => {
    app = await createTestApp();
    req = createRequestHelper(app);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  describe('GET /api/v1/health/live', () => {
    it('should return liveness status', async () => {
      const response = await req.get('/api/v1/health/live');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
    });
  });

  describe('GET /api/v1/health/ready', () => {
    it('should return readiness status', async () => {
      const response = await req.get('/api/v1/health/ready');

      // May return 200 or 503 depending on service availability
      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('status');
    });
  });

  describe('GET /api/v1/health/startup', () => {
    it('should return startup status', async () => {
      const response = await req.get('/api/v1/health/startup');

      // May return 200 or 503 depending on startup completion status
      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('startupComplete');
    });
  });
});
