import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

import { apiKeyAuth } from './api-key';

describe('apiKeyAuth middleware', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(apiKeyAuth);
    app.get('/test', (_req, res) => res.json({ success: true }));
  });

  it('should return 401 when API key is missing', async () => {
    const response = await request(app).get('/test');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthorized');
  });

  it('should return 401 when API key is invalid', async () => {
    const response = await request(app).get('/test').set('x-partner-key', 'invalid-key');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthorized');
  });

  it('should allow request with valid API key', async () => {
    process.env.PARTNER_API_KEYS = 'test-key-123';

    const response = await request(app).get('/test').set('x-partner-key', 'test-key-123');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    delete process.env.PARTNER_API_KEYS;
  });
});
