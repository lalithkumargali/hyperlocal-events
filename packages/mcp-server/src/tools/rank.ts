import { logger } from '../lib/logger';

import { RankScoreInput, RankScoreInputSchema, RankScoreOutput, ScoredEvent } from './schemas';

/**
 * rank.score - Score events using transparent weighted function
 * Factors: relevance (interest match), proximity, time-fit, popularity
 */
export async function rankScore(input: unknown): Promise<RankScoreOutput> {
  const validated = RankScoreInputSchema.parse(input);
  const { events, userLat, userLon, interests = [], minutesAvailable } = validated;

  logger.info({ eventCount: events.length, interests, minutesAvailable }, 'rank.score called');

  const scoredEvents: ScoredEvent[] = [];

  for (const event of events) {
    try {
      // Calculate distance (Haversine formula)
      const distanceMeters = calculateDistance(
        userLat,
        userLon,
        event.venue?.lat || userLat,
        event.venue?.lon || userLon
      );

      // Estimate duration (default 2 hours for events, 1 hour for places)
      const durationMinutes =
        event.startAt && event.endAt
          ? (new Date(event.endAt).getTime() - new Date(event.startAt).getTime()) / 60000
          : event.startAt
            ? 120 // Default event duration
            : 60; // Default place visit duration

      // Calculate individual scores (0-1 scale)
      const interestScore = calculateInterestScore(event.category, interests);
      const distanceScore = calculateDistanceScore(distanceMeters, 10000); // Assume 10km radius
      const timeFitScore = calculateTimeFitScore(durationMinutes, minutesAvailable);
      const popularityScore = event.popularityScore || 0.5;

      // Weighted sum with specified weights
      // score = 0.4*interest + 0.3*distance + 0.2*timeFit + 0.1*popularity
      const weights = {
        interest: 0.4,
        distance: 0.3,
        timeFit: 0.2,
        popularity: 0.1,
      };

      const totalScore =
        interestScore * weights.interest +
        distanceScore * weights.distance +
        timeFitScore * weights.timeFit +
        popularityScore * weights.popularity;

      const scoredEvent: ScoredEvent = {
        ...event,
        score: Math.min(1, Math.max(0, totalScore)),
        scoreBreakdown: {
          relevance: interestScore,
          proximity: distanceScore,
          timeFit: timeFitScore,
          popularity: popularityScore,
        },
        distanceMeters: Math.round(distanceMeters),
        durationMinutes: Math.round(durationMinutes),
      };

      scoredEvents.push(scoredEvent);
    } catch (error) {
      logger.warn({ error, eventId: event.id }, 'Failed to score event, skipping');
    }
  }

  // Sort by score descending
  scoredEvents.sort((a, b) => b.score - a.score);

  logger.info(
    { scoredCount: scoredEvents.length, topScore: scoredEvents[0]?.score },
    'rank.score completed'
  );

  return scoredEvents;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate interest score using Jaccard similarity
 * Jaccard = |intersection| / |union|
 */
function calculateInterestScore(categories: string[], interests: string[]): number {
  if (interests.length === 0) return 0.5; // Neutral if no interests specified

  // Normalize to lowercase for comparison
  const catSet = new Set(categories.map((c) => c.toLowerCase()));
  const intSet = new Set(interests.map((i) => i.toLowerCase()));

  // Calculate intersection
  const intersection = new Set([...catSet].filter((x) => intSet.has(x)));

  // Calculate union
  const union = new Set([...catSet, ...intSet]);

  // Jaccard similarity
  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Calculate distance score
 * distanceScore = max(0, 1 - (distanceMeters / radiusMeters))
 */
function calculateDistanceScore(distanceMeters: number, radiusMeters: number): number {
  return Math.max(0, 1 - distanceMeters / radiusMeters);
}

/**
 * Calculate time-fit score with sigmoid drop-off
 * timeFitScore = 1 if duration <= minutesAvailable, else sigmoid drop
 */
function calculateTimeFitScore(durationMinutes: number, minutesAvailable: number): number {
  if (durationMinutes <= minutesAvailable) {
    return 1.0;
  }

  // Sigmoid drop-off for durations exceeding available time
  // sigmoid(x) = 1 / (1 + e^x)
  // Map excess time to sigmoid input
  const excessMinutes = durationMinutes - minutesAvailable;
  const normalizedExcess = excessMinutes / minutesAvailable; // 0 to infinity
  const sigmoidInput = normalizedExcess * 4; // Scale for steeper drop

  return 1 / (1 + Math.exp(sigmoidInput));
}
