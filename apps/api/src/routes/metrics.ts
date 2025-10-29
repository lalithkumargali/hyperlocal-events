import { Router, type IRouter } from 'express';

import { register } from '../lib/metrics';

export const metricsRouter: IRouter = Router();

/**
 * GET /metrics
 * Prometheus metrics endpoint
 */
metricsRouter.get('/', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
