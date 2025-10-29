import { describe, it, expect } from 'vitest';

import { rankScore } from './rank';
import { NormalizedEvent } from './schemas';

describe('rank.score', () => {
  const baseEvent: NormalizedEvent = {
    id: 'test-1',
    provider: 'test',
    providerId: 'test-1',
    title: 'Test Event',
    category: ['music', 'concert'],
    venue: {
      name: 'Test Venue',
      lat: 37.7749,
      lon: -122.4194,
    },
    popularityScore: 0.8,
  };

  it('should score events with perfect interest match', async () => {
    const events: NormalizedEvent[] = [
      {
        ...baseEvent,
        category: ['music', 'concert'],
      },
    ];

    const result = await rankScore({
      events,
      userLat: 37.7749,
      userLon: -122.4194,
      interests: ['music', 'concert'],
      minutesAvailable: 120,
    });

    expect(result).toHaveLength(1);
    expect(result[0].scoreBreakdown.relevance).toBe(1.0); // Perfect Jaccard match
    expect(result[0].scoreBreakdown.proximity).toBe(1.0); // Same location
    expect(result[0].scoreBreakdown.timeFit).toBe(1.0); // Duration fits
  });

  it('should calculate Jaccard similarity correctly', async () => {
    const events: NormalizedEvent[] = [
      {
        ...baseEvent,
        category: ['music', 'jazz', 'live'],
      },
    ];

    const result = await rankScore({
      events,
      userLat: 37.7749,
      userLon: -122.4194,
      interests: ['music', 'rock'],
      minutesAvailable: 120,
    });

    // Intersection: {music}
    // Union: {music, jazz, live, rock}
    // Jaccard = 1/4 = 0.25
    expect(result[0].scoreBreakdown.relevance).toBe(0.25);
  });

  it('should calculate distance score correctly', async () => {
    const events: NormalizedEvent[] = [
      {
        ...baseEvent,
        venue: {
          name: 'Far Venue',
          lat: 37.7849, // ~1.1km away
          lon: -122.4194,
        },
      },
    ];

    const result = await rankScore({
      events,
      userLat: 37.7749,
      userLon: -122.4194,
      interests: [],
      minutesAvailable: 120,
    });

    // Distance ~1113 meters
    // distanceScore = max(0, 1 - 1113/10000) ≈ 0.889
    expect(result[0].scoreBreakdown.proximity).toBeGreaterThan(0.88);
    expect(result[0].scoreBreakdown.proximity).toBeLessThan(0.9);
  });

  it('should apply sigmoid drop for time-fit when duration exceeds available time', async () => {
    const events: NormalizedEvent[] = [
      {
        ...baseEvent,
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 180 * 60 * 1000).toISOString(), // 180 min duration
      },
    ];

    const result = await rankScore({
      events,
      userLat: 37.7749,
      userLon: -122.4194,
      interests: [],
      minutesAvailable: 120, // Only 120 min available
    });

    // Duration (180) > available (120), should have sigmoid drop
    expect(result[0].scoreBreakdown.timeFit).toBeLessThan(1.0);
    expect(result[0].scoreBreakdown.timeFit).toBeGreaterThan(0.0);
  });

  it('should give timeFit=1 when duration fits within available time', async () => {
    const events: NormalizedEvent[] = [
      {
        ...baseEvent,
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 60 min duration
      },
    ];

    const result = await rankScore({
      events,
      userLat: 37.7749,
      userLon: -122.4194,
      interests: [],
      minutesAvailable: 120, // 120 min available
    });

    expect(result[0].scoreBreakdown.timeFit).toBe(1.0);
  });

  it('should use correct weights: 0.4*interest + 0.3*distance + 0.2*timeFit + 0.1*popularity', async () => {
    const events: NormalizedEvent[] = [
      {
        ...baseEvent,
        category: ['music'],
        venue: {
          name: 'Test Venue',
          lat: 37.7749,
          lon: -122.4194,
        },
        popularityScore: 0.8,
      },
    ];

    const result = await rankScore({
      events,
      userLat: 37.7749,
      userLon: -122.4194,
      interests: ['music'],
      minutesAvailable: 120,
    });

    const { relevance, proximity, timeFit, popularity } = result[0].scoreBreakdown;

    // Calculate expected score
    const expectedScore = 0.4 * relevance + 0.3 * proximity + 0.2 * timeFit + 0.1 * popularity;

    expect(result[0].score).toBeCloseTo(expectedScore, 5);
  });

  it('should sort events by score descending', async () => {
    const events: NormalizedEvent[] = [
      {
        ...baseEvent,
        id: 'low-score',
        category: ['other'],
        venue: {
          name: 'Far Venue',
          lat: 37.8749, // Very far
          lon: -122.5194,
        },
        popularityScore: 0.1,
      },
      {
        ...baseEvent,
        id: 'high-score',
        category: ['music', 'concert'],
        venue: {
          name: 'Near Venue',
          lat: 37.7749,
          lon: -122.4194,
        },
        popularityScore: 0.9,
      },
      {
        ...baseEvent,
        id: 'mid-score',
        category: ['music'],
        venue: {
          name: 'Mid Venue',
          lat: 37.7799,
          lon: -122.4194,
        },
        popularityScore: 0.5,
      },
    ];

    const result = await rankScore({
      events,
      userLat: 37.7749,
      userLon: -122.4194,
      interests: ['music', 'concert'],
      minutesAvailable: 120,
    });

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('high-score');
    expect(result[2].id).toBe('low-score');

    // Verify descending order
    expect(result[0].score).toBeGreaterThanOrEqual(result[1].score);
    expect(result[1].score).toBeGreaterThanOrEqual(result[2].score);
  });

  it('should handle events without venues', async () => {
    const events: NormalizedEvent[] = [
      {
        ...baseEvent,
        venue: undefined as any,
      },
    ];

    const result = await rankScore({
      events,
      userLat: 37.7749,
      userLon: -122.4194,
      interests: [],
      minutesAvailable: 120,
    });

    expect(result).toHaveLength(1);
    expect(result[0].distanceMeters).toBe(0); // Falls back to user location
  });

  it('should handle empty interests with neutral score', async () => {
    const events: NormalizedEvent[] = [
      {
        ...baseEvent,
        category: ['music', 'concert'],
      },
    ];

    const result = await rankScore({
      events,
      userLat: 37.7749,
      userLon: -122.4194,
      interests: [],
      minutesAvailable: 120,
    });

    expect(result[0].scoreBreakdown.relevance).toBe(0.5); // Neutral score
  });
});
