import { Router, type IRouter } from 'express';

import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';

export const healthRouter: IRouter = Router();

healthRouter.get('/', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();

    res.json({ ok: true });
  } catch (error) {
    res.status(503).json({ ok: false });
  }
});
