import { Request, Response, NextFunction } from 'express';

import { httpRequestsTotal, httpRequestDuration } from '../lib/metrics';

/**
 * Middleware to track HTTP request metrics
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  // Track response
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const route = req.route?.path || req.path;
    const method = req.method;
    const status = res.statusCode.toString();

    // Increment request counter
    httpRequestsTotal.labels(method, route, status).inc();

    // Record request duration
    httpRequestDuration.labels(method, route, status).observe(duration);
  });

  next();
}
