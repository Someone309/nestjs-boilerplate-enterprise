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

  describe('GET /api/v1/health', () => {
    it('should return health status', async () => {
      const response = await req.get('/api/v1/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
    });
  });

  describe('GET /api/v1/health/liveness', () => {
    it('should return liveness status', async () => {
      const response = await req.get('/api/v1/health/liveness');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });

  describe('GET /api/v1/health/readiness', () => {
    it('should return readiness status', async () => {
      const response = await req.get('/api/v1/health/readiness');

      // May return 200 or 503 depending on service availability
      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('status');
    });
  });
});
