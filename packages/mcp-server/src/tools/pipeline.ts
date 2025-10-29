import { logger } from '../lib/logger';

import { eventsSearch } from './events';
import { geoResolve } from './geo';
import { rankScore } from './rank';
import { PipelineSuggestInput, PipelineSuggestInputSchema, PipelineSuggestOutput } from './schemas';

/**
 * pipeline.suggest - Orchestrate the full suggestion pipeline
 * Steps: geo.resolve -> events.search -> rank.score -> return top N
 */
export async function pipelineSuggest(input: unknown): Promise<PipelineSuggestOutput> {
  const validated = PipelineSuggestInputSchema.parse(input);
  const { lat, lon, minutesAvailable, interests, radiusMeters, now, limit } = validated;

  const startTime = Date.now();
  logger.info({ lat, lon, minutesAvailable, limit }, 'pipeline.suggest started');

  try {
    // Step 1: Resolve geo location
    logger.info('Step 1: Resolving geo location');
    const geoResult = await geoResolve({ lat, lon, radiusMeters });

    // Step 2: Search events from all providers
    logger.info('Step 2: Searching events from providers');
    const searchResults = await eventsSearch({
      lat,
      lon,
      radiusMeters,
      startTime: now,
    });

    // Flatten all events from all providers
    const allEvents = searchResults.flatMap((result) => result.events);
    const providers = searchResults.map((r) => r.provider);
    const anyCached = searchResults.some((r) => r.cached);

    logger.info({ totalEvents: allEvents.length, providers }, 'Step 2: Events search completed');

    // Step 3: Rank and score events
    logger.info('Step 3: Ranking events');
    const rankedEvents = await rankScore({
      events: allEvents,
      userLat: lat,
      userLon: lon,
      interests,
      minutesAvailable,
      now,
    });

    // Step 4: Return top N
    const topSuggestions = rankedEvents.slice(0, limit);

    const processingTimeMs = Date.now() - startTime;

    const result: PipelineSuggestOutput = {
      suggestions: topSuggestions,
      metadata: {
        totalFound: allEvents.length,
        providers,
        cached: anyCached,
        processingTimeMs,
      },
    };

    logger.info(
      {
        returned: topSuggestions.length,
        totalFound: allEvents.length,
        processingTimeMs,
      },
      'pipeline.suggest completed'
    );

    return result;
  } catch (error) {
    logger.error({ error }, 'pipeline.suggest failed');
    throw error;
  }
}
