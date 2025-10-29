import { logger } from '../lib/logger';

import { cacheGet, cacheSet } from './cache';
import {
  EventsSearchInput,
  EventsSearchInputSchema,
  EventsSearchOutput,
  NormalizedEvent,
} from './schemas';

/**
 * events.search - Fan-out to multiple providers and return normalized events
 * Providers: Eventbrite, Ticketmaster, Meetup, Google Places (POIs)
 */
export async function eventsSearch(input: unknown): Promise<EventsSearchOutput[]> {
  const validated = EventsSearchInputSchema.parse(input);
  const { lat, lon, radiusMeters } = validated;

  logger.info({ lat, lon, radiusMeters }, 'events.search called');

  const cacheKey = `events:${lat.toFixed(4)}:${lon.toFixed(4)}:${radiusMeters}`;

  // Check cache first
  const cached = await cacheGet({ key: cacheKey });
  if (cached.found && cached.value) {
    logger.info({ cacheKey }, 'events.search returning cached results');
    return cached.value as EventsSearchOutput[];
  }

  // Fan-out to providers (with jitter to respect rate limits)
  const providers = [
    fetchEventbriteEvents,
    fetchTicketmasterEvents,
    fetchMeetupEvents,
    fetchGooglePlacesEvents,
  ];

  const results: EventsSearchOutput[] = [];
  const now = new Date().toISOString();

  for (const provider of providers) {
    try {
      // Add jitter (50-200ms) to avoid rate limit spikes
      const jitter = Math.random() * 150 + 50;
      await new Promise((resolve) => setTimeout(resolve, jitter));

      const result = await provider(validated);
      results.push({
        ...result,
        cached: false,
        fetchedAt: now,
      });
    } catch (error) {
      logger.warn({ error, provider: provider.name }, 'Provider fetch failed, continuing');
      // Fail fast on individual provider, continue with others
    }
  }

  // Cache results for 10-30 minutes (random TTL to avoid thundering herd)
  const ttl = Math.floor(Math.random() * 1200) + 600; // 10-30 minutes
  await cacheSet({ key: cacheKey, value: results, ttlSeconds: ttl });

  logger.info({ providers: results.length, ttl }, 'events.search completed');
  return results;
}

/**
 * Mock provider implementations
 * In production, these would call actual APIs
 */

async function fetchEventbriteEvents(input: EventsSearchInput): Promise<EventsSearchOutput> {
  logger.info('Fetching from Eventbrite (mock)');

  // Mock data - in production, call Eventbrite API
  const events: NormalizedEvent[] = [
    {
      id: 'eb-1',
      provider: 'eventbrite',
      providerId: 'eb-12345',
      title: 'Tech Networking Mixer',
      description: 'Connect with local tech professionals',
      startAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      endAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
      venue: {
        name: 'Innovation Hub',
        address: '100 Tech St, San Francisco, CA',
        lat: input.lat + 0.01,
        lon: input.lon - 0.01,
      },
      category: ['technology', 'networking'],
      url: 'https://eventbrite.com/event/12345',
      priceMin: 0,
      priceMax: 0,
      popularityScore: 0.75,
    },
  ];

  return {
    provider: 'eventbrite',
    events,
    cached: false,
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchTicketmasterEvents(input: EventsSearchInput): Promise<EventsSearchOutput> {
  logger.info('Fetching from Ticketmaster (mock)');

  const events: NormalizedEvent[] = [
    {
      id: 'tm-1',
      provider: 'ticketmaster',
      providerId: 'tm-67890',
      title: 'Live Concert Series',
      description: 'Amazing live music performance',
      startAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      endAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
      venue: {
        name: 'City Arena',
        address: '200 Concert Blvd, San Francisco, CA',
        lat: input.lat - 0.01,
        lon: input.lon + 0.01,
      },
      category: ['music', 'concert'],
      url: 'https://ticketmaster.com/event/67890',
      priceMin: 50,
      priceMax: 150,
      popularityScore: 0.9,
    },
  ];

  return {
    provider: 'ticketmaster',
    events,
    cached: false,
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchMeetupEvents(input: EventsSearchInput): Promise<EventsSearchOutput> {
  logger.info('Fetching from Meetup (mock)');

  const events: NormalizedEvent[] = [
    {
      id: 'mu-1',
      provider: 'meetup',
      providerId: 'mu-abc123',
      title: 'Weekend Hiking Group',
      description: 'Explore local trails with fellow hikers',
      startAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      endAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
      venue: {
        name: 'Trailhead Park',
        address: '300 Nature Way, San Francisco, CA',
        lat: input.lat + 0.02,
        lon: input.lon + 0.02,
      },
      category: ['outdoor', 'sports', 'social'],
      url: 'https://meetup.com/event/abc123',
      priceMin: 0,
      priceMax: 0,
      popularityScore: 0.65,
    },
  ];

  return {
    provider: 'meetup',
    events,
    cached: false,
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchGooglePlacesEvents(input: EventsSearchInput): Promise<EventsSearchOutput> {
  logger.info('Fetching from Google Places (mock)');

  // Google Places returns POIs, not events
  const events: NormalizedEvent[] = [
    {
      id: 'gp-1',
      provider: 'google_places',
      providerId: 'gp-xyz789',
      title: 'Local Art Gallery',
      description: 'Contemporary art exhibitions',
      venue: {
        name: 'Modern Art Space',
        address: '400 Gallery Ave, San Francisco, CA',
        lat: input.lat - 0.015,
        lon: input.lon - 0.015,
      },
      category: ['art', 'culture', 'museum'],
      url: 'https://maps.google.com/place/xyz789',
      popularityScore: 0.7,
    },
  ];

  return {
    provider: 'google_places',
    events,
    cached: false,
    fetchedAt: new Date().toISOString(),
  };
}
