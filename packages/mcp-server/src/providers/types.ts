import { z } from 'zod';

/**
 * Unified provider event shape
 * All providers must return events in this format
 */
export const UnifiedEventSchema = z.object({
  provider: z.enum(['eventbrite', 'ticketmaster', 'meetup', 'google-places']),
  providerId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  category: z.array(z.string()),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  venue: z.object({
    name: z.string().optional(),
    lat: z.number(),
    lon: z.number(),
    address: z.string().optional(),
  }),
  url: z.string().url().optional(),
  popularity: z.number().min(0).max(1).optional(),
});

export type UnifiedEvent = z.infer<typeof UnifiedEventSchema>;

/**
 * Provider search parameters
 */
export interface ProviderSearchParams {
  lat: number;
  lon: number;
  radiusMeters: number;
  startTime?: Date;
  endTime?: Date;
  categories?: string[];
}

/**
 * Provider connector interface
 */
export interface ProviderConnector {
  name: string;
  search(params: ProviderSearchParams): Promise<UnifiedEvent[]>;
  isConfigured(): boolean;
}
