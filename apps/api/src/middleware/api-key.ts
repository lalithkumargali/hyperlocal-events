import { Request, Response, NextFunction } from 'express';

import { logger } from '../lib/logger';

/**
 * Simple API key authentication middleware
 * In production, this would check against a database table
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-partner-key'] as string;

  if (!apiKey) {
    logger.warn({ path: req.path }, 'Missing API key');
    res.status(401).json({
      error: 'Unauthorized',
      message: 'API key required. Provide x-partner-key header.',
    });
    return;
  }

  // Simple validation against environment variable
  // In production, check against database with partner info
  const validKeys = (process.env.PARTNER_API_KEYS || '').split(',').filter(Boolean);

  if (!validKeys.includes(apiKey)) {
    logger.warn({ path: req.path, apiKey: apiKey.substring(0, 8) + '...' }, 'Invalid API key');
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key',
    });
    return;
  }

  // Log usage for analytics
  logger.info(
    {
      apiKey: apiKey.substring(0, 8) + '...',
      path: req.path,
      method: req.method,
    },
    'Partner API request'
  );

  next();
}
