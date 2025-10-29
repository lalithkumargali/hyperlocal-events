import { SuggestRequestSchema, SuggestResponseSchema } from '@hyperlocal/core';
import { Request, Response } from 'express';

import { callMCPTool } from '../lib/mcp-client';
import { logger } from '../lib/logger';
import { suggestRequestsTotal, suggestRequestDuration, suggestResultsCount } from '../lib/metrics';

/**
 * POST /v1/suggest
 * Get personalized event/place suggestions based on location, time, and interests
 */
export async function suggestController(req: Request, res: Response): Promise<void> {
  const endpoint = req.path.includes('partner') ? 'partner' : 'public';
  const startTime = Date.now();

  try {
    // Track request
    suggestRequestsTotal.labels(endpoint).inc();

    // Validate request body
    const input = SuggestRequestSchema.parse(req.body);

    logger.info({ input }, 'Processing suggest request');

    // Call MCP pipeline.suggest
    const mcpResponse = await callMCPTool({
      tool: 'pipeline.suggest',
      arguments: {
        lat: input.lat,
        lon: input.lon,
        minutesAvailable: input.minutesAvailable,
        interests: input.interests,
        radiusMeters: input.radiusMeters,
        now: input.now,
        limit: 20,
      },
    });

    if (!mcpResponse.success) {
      logger.error({ error: mcpResponse.error }, 'MCP pipeline failed');
      res.status(502).json({
        error: 'Service temporarily unavailable',
        message: 'Unable to process suggestions at this time',
      });
      return;
    }

    // Extract suggestions from MCP response
    const mcpData = mcpResponse.data as any;
    const suggestions = mcpData?.suggestions || [];

    // Validate response with Zod
    const validatedSuggestions = SuggestResponseSchema.parse(suggestions);

    logger.info({ count: validatedSuggestions.length }, 'Successfully processed suggestions');

    // Track metrics
    const duration = (Date.now() - startTime) / 1000;
    suggestRequestDuration.labels(endpoint).observe(duration);
    suggestResultsCount.observe(validatedSuggestions.length);

    res.json(validatedSuggestions);
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

    res.status(502).json({
      error: 'Service temporarily unavailable',
      message: 'Unable to process suggestions at this time',
    });
  }
}
