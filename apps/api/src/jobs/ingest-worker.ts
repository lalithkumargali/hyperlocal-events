import { Job, Worker } from 'bullmq';

import { logger } from '../lib/logger';
import { redis } from '../lib/redis';
import { ingestRegion } from '../services/ingestion';

import { IngestRegionJob, IngestResult } from './types';

/**
 * BullMQ worker for ingesting events from providers
 */
export function createIngestWorker() {
  const worker = new Worker<IngestRegionJob, IngestResult>(
    'ingest-region',
    async (job: Job<IngestRegionJob>) => {
      const { lat, lon, radiusMeters, city } = job.data;

      logger.info({ jobId: job.id, lat, lon, radiusMeters, city }, 'Starting region ingestion job');

      const startTime = Date.now();

      try {
        const result = await ingestRegion({
          lat,
          lon,
          radiusMeters,
        });

        const duration = Date.now() - startTime;

        logger.info(
          {
            jobId: job.id,
            eventsIngested: result.eventsIngested,
            placesIngested: result.placesIngested,
            providers: result.providers,
            duration,
          },
          'Region ingestion completed'
        );

        return {
          ...result,
          duration,
        };
      } catch (error) {
        logger.error({ error, jobId: job.id }, 'Region ingestion failed');
        throw error;
      }
    },
    {
      connection: redis,
      concurrency: 2, // Process 2 jobs at a time
      limiter: {
        max: 10, // Max 10 jobs
        duration: 60000, // per minute
      },
    }
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err }, 'Job failed');
  });

  return worker;
}
