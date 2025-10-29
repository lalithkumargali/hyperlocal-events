import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { scheduleRegionIngest } from '../jobs/queue';

interface CachedEventsParams {
  lat: number;
  lon: number;
  radiusMeters: number;
}

interface CachedEvent {
  id: string;
  provider: string;
  providerId: string;
  title: string;
  description: string | null;
  category: string[];
  startAt: Date;
  endAt: Date | null;
  venue: {
    name: string;
    lat: number;
    lon: number;
    address: string | null;
  } | null;
  url: string | null;
  popularityScore: number | null;
  distanceMeters?: number;
}

/**
 * Get events with caching strategy:
 * 1. Try Redis cache (TTL: 30 min)
 * 2. Try DB (if fresh < 2h)
 * 3. Trigger provider fan-out and cache
 */
export async function getCachedEvents(params: CachedEventsParams): Promise<CachedEvent[]> {
  const { lat, lon, radiusMeters } = params;
  const cacheKey = `events:${lat.toFixed(4)}:${lon.toFixed(4)}:${radiusMeters}`;

  // Step 1: Try Redis cache
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.info({ cacheKey }, 'Cache hit (Redis)');
      return JSON.parse(cached);
    }
  } catch (error) {
    logger.warn({ error }, 'Redis cache read failed');
  }

  // Step 2: Try DB (if fresh < 2h)
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  try {
    // Query events from DB with PostGIS distance calculation
    const events = await prisma.$queryRaw<CachedEvent[]>`
      SELECT 
        e.id,
        e.provider,
        e.provider_id as "providerId",
        e.title,
        e.description,
        e.category,
        e.start_at as "startAt",
        e.end_at as "endAt",
        e.url,
        e.popularity_score as "popularityScore",
        e.updated_at as "updatedAt",
        CASE 
          WHEN p.id IS NOT NULL THEN
            json_build_object(
              'name', p.name,
              'lat', ST_Y(p.location::geometry),
              'lon', ST_X(p.location::geometry),
              'address', p.address
            )
          ELSE NULL
        END as venue,
        CASE 
          WHEN p.id IS NOT NULL THEN
            ST_Distance(
              p.location,
              ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography
            )
          ELSE NULL
        END as "distanceMeters"
      FROM events e
      LEFT JOIN places p ON e.venue_id = p.id
      WHERE 
        e.updated_at > ${twoHoursAgo}
        AND (
          p.id IS NULL OR
          ST_DWithin(
            p.location,
            ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography,
            ${radiusMeters}
          )
        )
      ORDER BY e.popularity_score DESC NULLS LAST
      LIMIT 100
    `;

    if (events.length > 0) {
      logger.info({ count: events.length, cacheKey }, 'Cache hit (DB, fresh < 2h)');

      // Cache in Redis for 30 minutes
      await redis.setex(cacheKey, 1800, JSON.stringify(events));

      return events;
    }
  } catch (error) {
    logger.error({ error }, 'DB query failed');
  }

  // Step 3: Trigger provider fan-out (async)
  logger.info({ lat, lon, radiusMeters }, 'Cache miss, triggering ingestion');

  // Schedule ingestion job (non-blocking)
  scheduleRegionIngest({ lat, lon, radiusMeters }).catch((error) => {
    logger.error({ error }, 'Failed to schedule ingestion');
  });

  // Return empty array for now (client can retry)
  return [];
}

/**
 * Invalidate cache for a region
 */
export async function invalidateRegionCache(lat: number, lon: number, radiusMeters: number) {
  const cacheKey = `events:${lat.toFixed(4)}:${lon.toFixed(4)}:${radiusMeters}`;

  try {
    await redis.del(cacheKey);
    logger.info({ cacheKey }, 'Cache invalidated');
  } catch (error) {
    logger.error({ error, cacheKey }, 'Cache invalidation failed');
  }
}
