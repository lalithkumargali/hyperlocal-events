import { Request, Response } from 'express';

import { logger } from '../lib/logger';
import { SuggestRequestSchema, Suggestion } from '../schemas/suggest';

/**
 * POST /v1/suggest
 * Get personalized event/place suggestions based on location, time, and interests
 */
export async function suggestController(req: Request, res: Response): Promise<void> {
  try {
    // Validate request body
    const input = SuggestRequestSchema.parse(req.body);

    logger.info({ input }, 'Processing suggest request');

    // TODO: In Section E, delegate to MCP server via HTTP/IPC
    // For now, return deterministic mock suggestions

    const now = input.now ? new Date(input.now) : new Date();
    const mockSuggestions: Suggestion[] = [
      {
        id: '1',
        title: 'Summer Music Festival',
        type: 'event',
        startAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(),
        venue: {
          name: 'Golden Gate Park',
          address: 'Golden Gate Park, San Francisco, CA',
          lat: 37.7694,
          lon: -122.4862,
        },
        durationMinutes: 480,
        distanceMeters: 2500,
        score: 0.95,
        provider: 'manual',
        providerId: 'event-001',
        url: 'https://summerfest.example.com',
      },
      {
        id: '2',
        title: 'Tech Innovation Summit 2025',
        type: 'event',
        startAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        endAt: new Date(now.getTime() + 32 * 24 * 60 * 60 * 1000).toISOString(),
        venue: {
          name: 'Tech Hub Conference Center',
          address: '456 Mission St, San Francisco, CA',
          lat: 37.7833,
          lon: -122.4089,
        },
        durationMinutes: 2880,
        distanceMeters: 1200,
        score: 0.88,
        provider: 'manual',
        providerId: 'event-002',
        url: 'https://techinnovation.example.com',
      },
      {
        id: '3',
        title: 'The Grand Theater',
        type: 'place',
        venue: {
          name: 'The Grand Theater',
          address: '123 Market St, San Francisco, CA',
          lat: 37.7749,
          lon: -122.4194,
        },
        durationMinutes: 120,
        distanceMeters: 800,
        score: 0.72,
        provider: 'manual',
        providerId: 'venue-001',
        url: 'https://grandtheater.example.com',
      },
    ];

    // Filter by interests if provided
    let filteredSuggestions = mockSuggestions;
    if (input.interests && input.interests.length > 0) {
      // For mock data, just return all suggestions
      // In real implementation, this would filter based on event categories
      filteredSuggestions = mockSuggestions;
    }

    // Filter by distance (radiusMeters)
    filteredSuggestions = filteredSuggestions.filter((s) => s.distanceMeters <= input.radiusMeters);

    // Filter by time available
    filteredSuggestions = filteredSuggestions.filter(
      (s) => s.durationMinutes <= input.minutesAvailable
    );

    // Sort by score (descending)
    filteredSuggestions.sort((a, b) => b.score - a.score);

    res.json(filteredSuggestions);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      logger.warn({ error }, 'Validation error in suggest request');
      res.status(400).json({
        error: 'Validation error',
        details: error,
      });
      return;
    }

    logger.error({ error }, 'Error processing suggest request');

    // If MCP server fails (in future implementation), return 502
    res.status(502).json({
      error: 'Service temporarily unavailable',
      message: 'Unable to process suggestions at this time',
    });
  }
}
