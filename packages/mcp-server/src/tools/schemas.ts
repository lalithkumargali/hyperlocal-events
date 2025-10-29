import { z } from 'zod';

// Geo tool schemas
export const GeoResolveInputSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  radiusMeters: z.number().positive().default(5000),
});

export const GeoResolveOutputSchema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  boundingBox: z.object({
    minLat: z.number(),
    maxLat: z.number(),
    minLon: z.number(),
    maxLon: z.number(),
  }),
  center: z.object({
    lat: z.number(),
    lon: z.number(),
  }),
});

// Events search schemas
export const EventsSearchInputSchema = z.object({
  lat: z.number(),
  lon: z.number(),
  radiusMeters: z.number().positive(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  categories: z.array(z.string()).optional(),
});

export const NormalizedEventSchema = z.object({
  id: z.string(),
  provider: z.string(),
  providerId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  venue: z
    .object({
      name: z.string(),
      address: z.string().optional(),
      lat: z.number(),
      lon: z.number(),
    })
    .optional(),
  category: z.array(z.string()),
  url: z.string().url().optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  popularityScore: z.number().min(0).max(1).default(0.5),
});

export const EventsSearchOutputSchema = z.object({
  provider: z.string(),
  events: z.array(NormalizedEventSchema),
  cached: z.boolean(),
  fetchedAt: z.string().datetime(),
});

// Rank tool schemas
export const RankScoreInputSchema = z.object({
  events: z.array(NormalizedEventSchema),
  userLat: z.number(),
  userLon: z.number(),
  interests: z.array(z.string()).optional(),
  minutesAvailable: z.number().positive(),
  now: z.string().datetime().optional(),
});

export const ScoredEventSchema = NormalizedEventSchema.extend({
  score: z.number().min(0).max(1),
  scoreBreakdown: z.object({
    relevance: z.number(),
    proximity: z.number(),
    timeFit: z.number(),
    popularity: z.number(),
  }),
  distanceMeters: z.number(),
  durationMinutes: z.number(),
});

export const RankScoreOutputSchema = z.array(ScoredEventSchema);

// Cache tool schemas
export const CacheGetInputSchema = z.object({
  key: z.string(),
});

export const CacheGetOutputSchema = z.object({
  found: z.boolean(),
  value: z.any().optional(),
  ttl: z.number().optional(),
});

export const CacheSetInputSchema = z.object({
  key: z.string(),
  value: z.any(),
  ttlSeconds: z.number().positive().default(600), // 10 minutes default
});

export const CacheSetOutputSchema = z.object({
  success: z.boolean(),
});

// Pipeline tool schemas
export const PipelineSuggestInputSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  minutesAvailable: z.number().int().min(15).max(360),
  interests: z.array(z.string()).optional(),
  radiusMeters: z.number().int().positive().default(5000),
  now: z.string().datetime().optional(),
  limit: z.number().int().positive().default(20),
});

export const PipelineSuggestOutputSchema = z.object({
  suggestions: z.array(ScoredEventSchema),
  metadata: z.object({
    totalFound: z.number(),
    providers: z.array(z.string()),
    cached: z.boolean(),
    processingTimeMs: z.number(),
  }),
});

// Type exports
export type GeoResolveInput = z.infer<typeof GeoResolveInputSchema>;
export type GeoResolveOutput = z.infer<typeof GeoResolveOutputSchema>;
export type EventsSearchInput = z.infer<typeof EventsSearchInputSchema>;
export type EventsSearchOutput = z.infer<typeof EventsSearchOutputSchema>;
export type NormalizedEvent = z.infer<typeof NormalizedEventSchema>;
export type RankScoreInput = z.infer<typeof RankScoreInputSchema>;
export type RankScoreOutput = z.infer<typeof RankScoreOutputSchema>;
export type ScoredEvent = z.infer<typeof ScoredEventSchema>;
export type CacheGetInput = z.infer<typeof CacheGetInputSchema>;
export type CacheGetOutput = z.infer<typeof CacheGetOutputSchema>;
export type CacheSetInput = z.infer<typeof CacheSetInputSchema>;
export type CacheSetOutput = z.infer<typeof CacheSetOutputSchema>;
export type PipelineSuggestInput = z.infer<typeof PipelineSuggestInputSchema>;
export type PipelineSuggestOutput = z.infer<typeof PipelineSuggestOutputSchema>;
