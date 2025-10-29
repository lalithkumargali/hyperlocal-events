import { cacheGet, cacheSet } from './cache';
import { eventsSearch } from './events';
import { geoResolve } from './geo';
import { pipelineSuggest } from './pipeline';
import { rankScore } from './rank';

export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

export const tools: Tool[] = [
  {
    name: 'geo.resolve',
    description: 'Reverse geocode lat/lon using Nominatim and compute bounding box',
    inputSchema: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: 'Latitude (-90 to 90)' },
        lon: { type: 'number', description: 'Longitude (-180 to 180)' },
        radiusMeters: { type: 'number', description: 'Search radius in meters', default: 5000 },
      },
      required: ['lat', 'lon'],
    },
    handler: geoResolve,
  },
  {
    name: 'events.search',
    description:
      'Fan-out to multiple providers (Eventbrite, Ticketmaster, Meetup, Google Places) and return normalized events',
    inputSchema: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: 'Latitude' },
        lon: { type: 'number', description: 'Longitude' },
        radiusMeters: { type: 'number', description: 'Search radius in meters' },
        startTime: { type: 'string', description: 'Start time (ISO 8601)' },
        endTime: { type: 'string', description: 'End time (ISO 8601)' },
        categories: { type: 'array', items: { type: 'string' }, description: 'Event categories' },
      },
      required: ['lat', 'lon', 'radiusMeters'],
    },
    handler: eventsSearch,
  },
  {
    name: 'rank.score',
    description:
      'Score events using weighted function: relevance (interest match), proximity, time-fit, popularity',
    inputSchema: {
      type: 'object',
      properties: {
        events: { type: 'array', description: 'Array of normalized events' },
        userLat: { type: 'number', description: 'User latitude' },
        userLon: { type: 'number', description: 'User longitude' },
        interests: { type: 'array', items: { type: 'string' }, description: 'User interests' },
        minutesAvailable: { type: 'number', description: 'Available time in minutes' },
        now: { type: 'string', description: 'Current time (ISO 8601)' },
      },
      required: ['events', 'userLat', 'userLon', 'minutesAvailable'],
    },
    handler: rankScore,
  },
  {
    name: 'cache.get',
    description: 'Get value from Redis cache',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Cache key' },
      },
      required: ['key'],
    },
    handler: cacheGet,
  },
  {
    name: 'cache.set',
    description: 'Set value in Redis cache with TTL',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Cache key' },
        value: { type: 'object', description: 'Value to cache' },
        ttlSeconds: { type: 'number', description: 'TTL in seconds', default: 600 },
      },
      required: ['key', 'value'],
    },
    handler: cacheSet,
  },
  {
    name: 'pipeline.suggest',
    description:
      'Orchestrate full suggestion pipeline: geo -> events -> rank -> return top N suggestions',
    inputSchema: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: 'Latitude (-90 to 90)' },
        lon: { type: 'number', description: 'Longitude (-180 to 180)' },
        minutesAvailable: { type: 'number', description: 'Available time (15-360 minutes)' },
        interests: { type: 'array', items: { type: 'string' }, description: 'User interests' },
        radiusMeters: { type: 'number', description: 'Search radius in meters', default: 5000 },
        now: { type: 'string', description: 'Current time (ISO 8601)' },
        limit: { type: 'number', description: 'Max suggestions to return', default: 20 },
      },
      required: ['lat', 'lon', 'minutesAvailable'],
    },
    handler: pipelineSuggest,
  },
];
