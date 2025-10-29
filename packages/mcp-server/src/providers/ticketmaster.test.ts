import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';

import { TicketmasterConnector } from './ticketmaster';
import ticketmasterFixture from './__fixtures__/ticketmaster.json';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('TicketmasterConnector', () => {
  let connector: TicketmasterConnector;

  beforeEach(() => {
    vi.clearAllMocks();
    connector = new TicketmasterConnector();
  });

  it('should return empty array if not configured', async () => {
    const result = await connector.search({
      lat: 37.7749,
      lon: -122.4194,
      radiusMeters: 5000,
    });

    expect(result).toEqual([]);
  });

  it('should transform Ticketmaster events to unified format', async () => {
    process.env.TICKETMASTER_KEY = 'test-key';
    connector = new TicketmasterConnector();

    mockedAxios.get.mockResolvedValueOnce({
      data: ticketmasterFixture,
    });

    const result = await connector.search({
      lat: 37.7749,
      lon: -122.4194,
      radiusMeters: 5000,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      provider: 'ticketmaster',
      providerId: 'TM123456',
      title: 'Rock Concert',
      description: 'Amazing live rock performance',
      category: expect.arrayContaining(['music', 'rock', 'alternative rock']),
      startAt: '2025-12-01T20:00:00Z',
      endAt: '2025-12-01T23:00:00Z',
      venue: {
        name: 'City Arena',
        lat: 37.7833,
        lon: -122.4089,
        address: '456 Concert Blvd, San Francisco, CA',
      },
      url: 'https://www.ticketmaster.com/rock-concert-tickets/event/TM123456',
    });

    delete process.env.TICKETMASTER_KEY;
  });

  it('should handle API errors gracefully', async () => {
    process.env.TICKETMASTER_KEY = 'test-key';
    connector = new TicketmasterConnector();

    mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

    await expect(
      connector.search({
        lat: 37.7749,
        lon: -122.4194,
        radiusMeters: 5000,
      })
    ).rejects.toThrow('API Error');

    delete process.env.TICKETMASTER_KEY;
  });
});
