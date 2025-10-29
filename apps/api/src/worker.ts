#!/usr/bin/env tsx
/**
 * Background worker for ingesting events from providers
 */

import dotenv from 'dotenv';

import { createIngestWorker } from './jobs/ingest-worker';
import { scheduleHotRegions } from './jobs/queue';
import { logger } from './lib/logger';

dotenv.config();

async function main() {
  logger.info('🚀 Starting background worker');

  // Create and start the worker
  const worker = createIngestWorker();

  logger.info('✅ Worker started, listening for jobs');

  // Schedule hot regions (recurring jobs)
  await scheduleHotRegions();
  logger.info('✅ Hot regions scheduled');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await worker.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await worker.close();
    process.exit(0);
  });
}

main().catch((error) => {
  logger.error({ error }, 'Worker failed to start');
  process.exit(1);
});
