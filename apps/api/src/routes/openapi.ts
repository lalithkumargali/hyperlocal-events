import { Router, type IRouter } from 'express';
import { oas31 } from 'openapi3-ts';

export const openApiRouter: IRouter = Router();

// OpenAPI 3.1 specification
const openApiSpec: oas31.OpenAPIObject = {
  openapi: '3.1.0',
  info: {
    title: 'Hyperlocal Events API',
    version: '0.1.0',
    description: 'MCP-powered hyperlocal events platform for discovering nearby events and places',
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Development server',
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        description: 'Check if the API is running',
        responses: {
          '200': {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: true },
                  },
                  required: ['ok'],
                },
              },
            },
          },
          '503': {
            description: 'API is unhealthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: false },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/v1/suggest': {
      post: {
        summary: 'Get personalized suggestions',
        description:
          'Get personalized event and place suggestions based on location, available time, and interests',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['lat', 'lon', 'minutesAvailable'],
                properties: {
                  lat: {
                    type: 'number',
                    minimum: -90,
                    maximum: 90,
                    description: 'Latitude coordinate',
                    example: 37.7749,
                  },
                  lon: {
                    type: 'number',
                    minimum: -180,
                    maximum: 180,
                    description: 'Longitude coordinate',
                    example: -122.4194,
                  },
                  minutesAvailable: {
                    type: 'integer',
                    minimum: 15,
                    maximum: 360,
                    description: 'Available time in minutes',
                    example: 120,
                  },
                  interests: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'User interests for filtering',
                    example: ['music', 'food', 'sports'],
                  },
                  radiusMeters: {
                    type: 'integer',
                    minimum: 1,
                    default: 5000,
                    description: 'Search radius in meters',
                    example: 5000,
                  },
                  now: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Current time (ISO 8601), defaults to server time',
                    example: '2025-10-29T18:00:00Z',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Successful response with suggestions',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: [
                      'id',
                      'title',
                      'type',
                      'durationMinutes',
                      'distanceMeters',
                      'score',
                      'provider',
                      'providerId',
                    ],
                    properties: {
                      id: { type: 'string', example: '1' },
                      title: { type: 'string', example: 'Summer Music Festival' },
                      type: { type: 'string', enum: ['event', 'place'], example: 'event' },
                      startAt: {
                        type: 'string',
                        format: 'date-time',
                        example: '2025-11-05T14:00:00Z',
                      },
                      endAt: {
                        type: 'string',
                        format: 'date-time',
                        example: '2025-11-05T22:00:00Z',
                      },
                      venue: {
                        type: 'object',
                        properties: {
                          name: { type: 'string', example: 'Golden Gate Park' },
                          address: {
                            type: 'string',
                            example: 'Golden Gate Park, San Francisco, CA',
                          },
                          lat: { type: 'number', example: 37.7694 },
                          lon: { type: 'number', example: -122.4862 },
                        },
                        required: ['name', 'lat', 'lon'],
                      },
                      durationMinutes: { type: 'number', example: 480 },
                      distanceMeters: { type: 'number', example: 2500 },
                      score: { type: 'number', minimum: 0, maximum: 1, example: 0.95 },
                      provider: { type: 'string', example: 'manual' },
                      providerId: { type: 'string', example: 'event-001' },
                      url: { type: 'string', format: 'uri', example: 'https://example.com' },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Validation error' },
                    details: { type: 'object' },
                  },
                },
              },
            },
          },
          '502': {
            description: 'MCP server unavailable',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Service temporarily unavailable' },
                    message: {
                      type: 'string',
                      example: 'Unable to process suggestions at this time',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

openApiRouter.get('/', (_req, res) => {
  res.json(openApiSpec);
});
