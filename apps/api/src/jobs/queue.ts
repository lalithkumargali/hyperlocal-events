import { Queue } from 'bullmq';

import { redis } from '../lib/redis';

import { IngestRegionJob } from './types';

/**
 * Queue for region ingestion jobs
 */
export const ingestQueue = new Queue<IngestRegionJob>('ingest-region', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
    },
    removeOnFail: {
      count: 50, // Keep last 50 failed jobs
    },
  },
});

/**
 * Add a region ingestion job to the queue
 */
export async function scheduleRegionIngest(job: IngestRegionJob) {
  return ingestQueue.add('ingest-region', job, {
    jobId: `ingest-${job.lat}-${job.lon}-${Date.now()}`,
  });
}

/**
 * Schedule recurring ingestion for hot regions
 */
export async function scheduleHotRegions() {
  // Example: San Francisco
  await ingestQueue.add(
    'ingest-region',
    {
      lat: 37.7749,
      lon: -122.4194,
      radiusMeters: 10000,
      city: 'San Francisco',
    },
    {
      repeat: {
        pattern: '0 */2 * * *', // Every 2 hours
      },
      jobId: 'hot-region-sf',
    }
  );

  // Example: New York
  await ingestQueue.add(
    'ingest-region',
    {
      lat: 40.7128,
      lon: -74.006,
      radiusMeters: 10000,
      city: 'New York',
    },
    {
      repeat: {
        pattern: '0 */2 * * *', // Every 2 hours
      },
      jobId: 'hot-region-nyc',
    }
  );
}
