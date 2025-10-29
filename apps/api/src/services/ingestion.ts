// Mock providers for now - in production, these would call real APIs
interface UnifiedEvent {
  provider: string;
  providerId: string;
  title: string;
  description?: string;
  category: string[];
  startAt?: string;
  endAt?: string;
  venue: {
    name?: string;
    lat: number;
    lon: number;
    address?: string;
  };
  url?: string;
  popularity?: number;
}

import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';

interface IngestRegionParams {
  lat: number;
  lon: number;
  radiusMeters: number;
}

interface IngestResult {
  eventsIngested: number;
  placesIngested: number;
  providers: string[];
}

/**
 * Ingest events from all providers for a region and store in DB
 */
export async function ingestRegion(params: IngestRegionParams): Promise<IngestResult> {
  const { lat, lon, radiusMeters } = params;

  logger.info({ lat, lon, radiusMeters }, 'Starting region ingestion');

  // Mock events for testing (in production, call real provider APIs)
  const allEvents: UnifiedEvent[] = [
    {
      provider: 'mock',
      providerId: 'test-event-1',
      title: 'Test Event 1',
      description: 'A test event for ingestion',
      category: ['technology', 'networking'],
      startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
      venue: {
        name: 'Test Venue',
        lat: lat + 0.01,
        lon: lon - 0.01,
        address: '123 Test St',
      },
      url: 'https://example.com/event1',
      popularity: 0.8,
    },
    {
      provider: 'mock',
      providerId: 'test-event-2',
      title: 'Test Event 2',
      description: 'Another test event',
      category: ['music', 'entertainment'],
      startAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      venue: {
        name: 'Music Hall',
        lat: lat - 0.01,
        lon: lon + 0.01,
        address: '456 Music Ave',
      },
      url: 'https://example.com/event2',
      popularity: 0.9,
    },
  ];

  const activeProviders = ['mock'];

  // Upsert to database
  const { eventsIngested, placesIngested } = await upsertEvents(allEvents);

  // Log ingestion
  await prisma.ingestLog.create({
    data: {
      provider: activeProviders.join(','),
      startedAt: new Date(),
      finishedAt: new Date(),
      ok: true,
      records: eventsIngested,
    },
  });

  return {
    eventsIngested,
    placesIngested,
    providers: activeProviders,
  };
}

/**
 * Upsert events and places to database with deduplication
 */
async function upsertEvents(events: UnifiedEvent[]): Promise<{
  eventsIngested: number;
  placesIngested: number;
}> {
  let eventsIngested = 0;
  let placesIngested = 0;

  for (const event of events) {
    try {
      // First, upsert the place/venue
      let placeId: string | undefined;

      if (event.venue) {
        // Use raw SQL for PostGIS point insertion
        const placeResult = await prisma.$executeRaw`
          INSERT INTO places (id, provider, provider_id, name, category, location, address, city, state, country, url, created_at, updated_at)
          VALUES (
            gen_random_uuid(),
            ${event.provider},
            ${event.providerId + '-venue'},
            ${event.venue.name || 'Unnamed Venue'},
            ${event.category}::text[],
            ST_SetSRID(ST_MakePoint(${event.venue.lon}, ${event.venue.lat}), 4326)::geography,
            ${event.venue.address},
            NULL,
            NULL,
            NULL,
            ${event.url},
            NOW(),
            NOW()
          )
          ON CONFLICT (provider, provider_id) DO UPDATE SET
            name = EXCLUDED.name,
            category = EXCLUDED.category,
            location = EXCLUDED.location,
            address = EXCLUDED.address,
            url = EXCLUDED.url,
            updated_at = NOW()
          RETURNING id
        `;

        // Get the place ID
        const place = await prisma.place.findUnique({
          where: {
            provider_providerId: {
              provider: event.provider,
              providerId: event.providerId + '-venue',
            },
          },
          select: { id: true },
        });

        placeId = place?.id;
        if (placeResult) placesIngested++;
      }

      // Then upsert the event
      await prisma.event.upsert({
        where: {
          provider_providerId: {
            provider: event.provider,
            providerId: event.providerId,
          },
        },
        create: {
          provider: event.provider,
          providerId: event.providerId,
          title: event.title,
          description: event.description,
          category: event.category,
          startAt: event.startAt ? new Date(event.startAt) : new Date(),
          endAt: event.endAt ? new Date(event.endAt) : null,
          venueId: placeId,
          priceMin: null,
          priceMax: null,
          currency: 'USD',
          url: event.url,
          popularityScore: event.popularity || 0.5,
        },
        update: {
          title: event.title,
          description: event.description,
          category: event.category,
          startAt: event.startAt ? new Date(event.startAt) : undefined,
          endAt: event.endAt ? new Date(event.endAt) : null,
          venueId: placeId,
          url: event.url,
          popularityScore: event.popularity || 0.5,
          updatedAt: new Date(),
        },
      });

      eventsIngested++;
    } catch (error) {
      logger.error({ error, event: event.title }, 'Failed to upsert event');
      // Continue with other events
    }
  }

  logger.info({ eventsIngested, placesIngested }, 'Completed upserting events and places');

  return { eventsIngested, placesIngested };
}
