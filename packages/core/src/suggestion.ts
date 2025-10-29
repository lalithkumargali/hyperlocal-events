import { z } from 'zod';

/**
 * Shared schemas for suggestion API and MCP pipeline
 */

export const VenueSchema = z.object({
  name: z.string(),
  address: z.string().optional(),
  lat: z.number(),
  lon: z.number(),
});

export const SuggestionSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(['event', 'place']),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  venue: VenueSchema.optional(),
  durationMinutes: z.number(),
  distanceMeters: z.number(),
  score: z.number().min(0).max(1),
  provider: z.string(),
  providerId: z.string(),
  url: z.string().url().optional(),
});

export const SuggestRequestSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  minutesAvailable: z.number().int().min(15).max(360),
  interests: z.array(z.string()).optional(),
  radiusMeters: z.number().int().positive().default(5000),
  now: z.string().datetime().optional(),
});

export const SuggestResponseSchema = z.array(SuggestionSchema);

export type Venue = z.infer<typeof VenueSchema>;
export type Suggestion = z.infer<typeof SuggestionSchema>;
export type SuggestRequest = z.infer<typeof SuggestRequestSchema>;
export type SuggestResponse = z.infer<typeof SuggestResponseSchema>;
