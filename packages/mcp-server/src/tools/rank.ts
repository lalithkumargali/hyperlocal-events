import { logger } from '../lib/logger';

import { RankScoreInput, RankScoreInputSchema, RankScoreOutput, ScoredEvent } from './schemas';

/**
 * rank.score - Score events using transparent weighted function
 * Factors: relevance (interest match), proximity, time-fit, popularity
 */
export async function rankScore(input: unknown): Promise<RankScoreOutput> {
  const validated = RankScoreInputSchema.parse(input);
  const { events, userLat, userLon, interests = [], minutesAvailable, now } = validated;

  logger.info({ eventCount: events.length, interests, minutesAvailable }, 'rank.score called');

  const currentTime = now ? new Date(now) : new Date();
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
      const relevanceScore = calculateRelevance(event.category, interests);
      const proximityScore = calculateProximity(distanceMeters);
      const timeFitScore = calculateTimeFit(
        durationMinutes,
        minutesAvailable,
        event.startAt,
        currentTime
      );
      const popularityScore = event.popularityScore || 0.5;

      // Weighted sum (configurable weights)
      const weights = {
        relevance: 0.3,
        proximity: 0.25,
        timeFit: 0.25,
        popularity: 0.2,
      };

      const totalScore =
        relevanceScore * weights.relevance +
        proximityScore * weights.proximity +
        timeFitScore * weights.timeFit +
        popularityScore * weights.popularity;

      const scoredEvent: ScoredEvent = {
        ...event,
        score: Math.min(1, Math.max(0, totalScore)),
        scoreBreakdown: {
          relevance: relevanceScore,
          proximity: proximityScore,
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
 * Calculate relevance score based on interest match
 */
function calculateRelevance(categories: string[], interests: string[]): number {
  if (interests.length === 0) return 0.5; // Neutral if no interests specified

  const matches = categories.filter((cat) =>
    interests.some((interest) => cat.toLowerCase().includes(interest.toLowerCase()))
  );

  return Math.min(1, matches.length / Math.max(interests.length, 1));
}

/**
 * Calculate proximity score (closer = better)
 */
function calculateProximity(distanceMeters: number): number {
  // Score decreases with distance
  // 0m = 1.0, 5000m = 0.5, 10000m = 0.1
  const maxDistance = 10000; // 10km
  const score = Math.max(0, 1 - distanceMeters / maxDistance);
  return Math.pow(score, 0.5); // Square root for gentler falloff
}

/**
 * Calculate time-fit score (can complete within available time)
 */
function calculateTimeFit(
  durationMinutes: number,
  minutesAvailable: number,
  startAt: string | undefined,
  currentTime: Date
): number {
  // Check if duration fits
  if (durationMinutes > minutesAvailable) {
    return 0.1; // Very low score if doesn't fit
  }

  // Check if event is happening soon (if it has a start time)
  if (startAt) {
    const eventStart = new Date(startAt);
    const hoursUntilStart = (eventStart.getTime() - currentTime.getTime()) / (1000 * 60 * 60);

    // Events starting within available time window are better
    if (hoursUntilStart < 0) {
      return 0.2; // Event already started
    } else if (hoursUntilStart < minutesAvailable / 60) {
      return 1.0; // Perfect timing
    } else if (hoursUntilStart < 24) {
      return 0.7; // Today
    } else if (hoursUntilStart < 168) {
      return 0.5; // This week
    } else {
      return 0.3; // Future
    }
  }

  // For places without start time, just check duration fit
  return durationMinutes <= minutesAvailable * 0.5 ? 1.0 : 0.8;
}
