import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';

import { EventbriteConnector } from './eventbrite';
import eventbriteFixture from './__fixtures__/eventbrite.json';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('EventbriteConnector', () => {
  let connector: EventbriteConnector;

  beforeEach(() => {
    vi.clearAllMocks();
    connector = new EventbriteConnector();
  });

  it('should return empty array if not configured', async () => {
    const result = await connector.search({
      lat: 37.7749,
      lon: -122.4194,
      radiusMeters: 5000,
    });

    expect(result).toEqual([]);
  });

  it('should transform Eventbrite events to unified format', async () => {
    // Set API token for this test
    process.env.EVENTBRITE_TOKEN = 'test-token';
    connector = new EventbriteConnector();

    mockedAxios.get.mockResolvedValueOnce({
      data: eventbriteFixture,
    });

    const result = await connector.search({
      lat: 37.7749,
      lon: -122.4194,
      radiusMeters: 5000,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      provider: 'eventbrite',
      providerId: '123456789',
      title: 'Tech Conference 2025',
      description: 'Annual technology conference featuring industry leaders',
      category: expect.arrayContaining(['technology', 'software', 'conference']),
      startAt: '2025-11-15T09:00:00Z',
      endAt: '2025-11-15T17:00:00Z',
      venue: {
        name: 'Convention Center',
        lat: 37.7749,
        lon: -122.4194,
        address: '123 Main St, San Francisco, CA 94102',
      },
      url: 'https://www.eventbrite.com/e/tech-conference-2025-tickets-123456789',
    });

    // Clean up
    delete process.env.EVENTBRITE_TOKEN;
  });

  it('should handle API errors gracefully', async () => {
    process.env.EVENTBRITE_TOKEN = 'test-token';
    connector = new EventbriteConnector();

    mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

    await expect(
      connector.search({
        lat: 37.7749,
        lon: -122.4194,
        radiusMeters: 5000,
      })
    ).rejects.toThrow('API Error');

    delete process.env.EVENTBRITE_TOKEN;
  });
});
